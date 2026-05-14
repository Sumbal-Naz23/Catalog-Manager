import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Image, { IImage } from "@/models/Image";
import cloudinary from "@/lib/cloudinary";
import { HydratedDocument } from "mongoose";

// ─── Runtime config ───────────────────────────────────────────────────────────
// Use Node.js runtime (not Edge) so we have full stream/buffer support.
export const runtime = "nodejs";

// Allow up to 120 seconds for large uploads to Cloudinary.
export const maxDuration = 120;

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB per file

// All common image MIME types including SVG
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "image/heic",
  "image/heif",
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Always returns a JSON response — never plain text. */
function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Stream a buffer directly to Cloudinary without loading it twice. */
function streamToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<{ secure_url: string; public_id: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        // Let Cloudinary auto-detect format — handles SVG, HEIC, etc.
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "avif", "svg", "bmp", "tiff", "heic", "heif"],
      },
      (error, result) => {
        if (error) {
          console.error("[Cloudinary] upload_stream error:", JSON.stringify(error));
          reject(new Error(error.message ?? "Cloudinary upload failed"));
        } else if (!result) {
          reject(new Error("Cloudinary returned an empty result"));
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width ?? 0,
            height: result.height ?? 0,
          });
        }
      }
    );
    uploadStream.end(buffer);
  });
}

// ─── POST /api/images/upload ──────────────────────────────────────────────────
//
// Accepts a multipart/form-data body with:
//   folderId      string   (required)
//   images        File[]   (required, one or more)
//   productName   string   (optional)
//   productPrice  string   (optional, numeric)
//
// The client sends ONE file per request to avoid any body-size limits.
// Multiple files are handled by the client calling this endpoint in a loop.
//
export async function POST(req: NextRequest) {
  try {
    await connectDB();
  } catch (dbConnErr) {
    console.error("[Upload] DB connection failed:", dbConnErr);
    return jsonError("Database connection failed. Please try again.", 503);
  }

  // ── Parse multipart body ────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (parseErr) {
    const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
    console.error("[Upload] formData parse error:", msg);
    // This is the most common failure point — body too large or malformed
    if (msg.toLowerCase().includes("too large") || msg.toLowerCase().includes("entity")) {
      return jsonError("File too large. Please upload images under 100 MB each.", 413);
    }
    return jsonError("Could not read the upload request. Please try again.", 400);
  }

  const folderId = (formData.get("folderId") as string | null)?.trim();
  const files = formData.getAll("images") as File[];
  const productName = ((formData.get("productName") as string) ?? "").trim();
  const productPriceRaw = ((formData.get("productPrice") as string) ?? "").trim();
  const productPrice = productPriceRaw !== "" ? parseFloat(productPriceRaw) : null;

  // ── Validate ────────────────────────────────────────────────────────────────
  if (!folderId) {
    return jsonError("folderId is required.", 400);
  }
  if (!files || files.length === 0) {
    return jsonError("No images provided.", 400);
  }

  for (const file of files) {
    const mime = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return jsonError(
        `Unsupported format: "${file.type || "unknown"}". Supported: JPG, PNG, WEBP, GIF, SVG, AVIF, BMP, TIFF, HEIC.`,
        415
      );
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return jsonError(
        `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB — exceeds the 100 MB limit.`,
        413
      );
    }
  }

  // ── Upload each file ────────────────────────────────────────────────────────
  const uploadedImages: HydratedDocument<IImage>[] = [];

  for (const file of files) {
    // Read file into buffer
    let buffer: Buffer;
    try {
      buffer = Buffer.from(await file.arrayBuffer());
    } catch (bufErr) {
      console.error("[Upload] Buffer read error for", file.name, bufErr);
      return jsonError(`Could not read "${file.name}". Please try again.`, 500);
    }

    // Upload to Cloudinary
    let cloudResult: { secure_url: string; public_id: string; width: number; height: number };
    try {
      cloudResult = await streamToCloudinary(buffer, `catalog-manager/${folderId}`);
    } catch (cloudErr) {
      console.error("[Upload] Cloudinary error for", file.name, cloudErr);
      return jsonError(
        `Upload failed for "${file.name}": ${cloudErr instanceof Error ? cloudErr.message : "Cloudinary error"}`,
        502
      );
    }

    // Save to MongoDB
    try {
      const image = await Image.create({
        folderId,
        url: cloudResult.secure_url,
        publicId: cloudResult.public_id,
        width: cloudResult.width,
        height: cloudResult.height,
        productName,
        productPrice: productPrice ?? null,
      });
      uploadedImages.push(image);
    } catch (dbErr) {
      console.error("[Upload] MongoDB save error:", dbErr);
      // Clean up orphaned Cloudinary asset (best-effort)
      cloudinary.uploader.destroy(cloudResult.public_id).catch(() => {});
      return jsonError("Failed to save image record. Please try again.", 500);
    }
  }

  return NextResponse.json({ images: uploadedImages }, { status: 201 });
}
