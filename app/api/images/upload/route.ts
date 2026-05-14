import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Image, { IImage } from "@/models/Image";
import cloudinary from "@/lib/cloudinary";
import { HydratedDocument } from "mongoose";

// Tell Next.js to allow up to 50 MB bodies for this route specifically.
// This is the per-route override; next.config.ts sets the global default.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** Upload a single buffer to Cloudinary and return the result. */
function uploadToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<{ secure_url: string; public_id: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) {
          console.error("[Cloudinary] upload_stream error:", error);
          reject(new Error(error.message ?? "Cloudinary upload failed"));
        } else if (!result) {
          reject(new Error("Cloudinary returned an empty result"));
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
          });
        }
      }
    );
    stream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // ── Parse form data ──────────────────────────────────────────────────────
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (parseErr) {
      console.error("[Upload] Failed to parse form data:", parseErr);
      return NextResponse.json(
        { error: "Could not read the upload request. The file may be too large or the request was malformed." },
        { status: 400 }
      );
    }

    const folderId = formData.get("folderId") as string | null;
    const files = formData.getAll("images") as File[];
    const productName = ((formData.get("productName") as string) ?? "").trim();
    const productPriceRaw = (formData.get("productPrice") as string) ?? "";
    const productPrice = productPriceRaw.trim() !== "" ? parseFloat(productPriceRaw) : null;

    // ── Validate inputs ──────────────────────────────────────────────────────
    if (!folderId) {
      return NextResponse.json({ error: "folderId is required" }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    // Validate each file before touching Cloudinary
    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type || "unknown"}. Allowed: JPEG, PNG, WEBP, GIF, AVIF.` },
          { status: 415 }
        );
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `"${file.name}" exceeds the 10 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).` },
          { status: 413 }
        );
      }
    }

    // ── Upload each file ─────────────────────────────────────────────────────
    const uploadedImages: HydratedDocument<IImage>[] = [];

    for (const file of files) {
      let buffer: Buffer;
      try {
        const bytes = await file.arrayBuffer();
        buffer = Buffer.from(bytes);
      } catch (bufErr) {
        console.error("[Upload] Failed to read file buffer:", bufErr);
        return NextResponse.json(
          { error: `Failed to read file "${file.name}". Please try again.` },
          { status: 500 }
        );
      }

      let cloudinaryResult: { secure_url: string; public_id: string; width: number; height: number };
      try {
        cloudinaryResult = await uploadToCloudinary(buffer, `catalog-manager/${folderId}`);
      } catch (cloudErr) {
        console.error("[Upload] Cloudinary error for file:", file.name, cloudErr);
        return NextResponse.json(
          { error: `Image upload failed for "${file.name}": ${cloudErr instanceof Error ? cloudErr.message : "Unknown error"}` },
          { status: 502 }
        );
      }

      try {
        const image = await Image.create({
          folderId,
          url: cloudinaryResult.secure_url,
          publicId: cloudinaryResult.public_id,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          productName,
          productPrice: productPrice ?? null,
        });
        uploadedImages.push(image);
      } catch (dbErr) {
        console.error("[Upload] MongoDB save error:", dbErr);
        // Attempt to clean up the orphaned Cloudinary asset
        try {
          await cloudinary.uploader.destroy(cloudinaryResult.public_id);
        } catch {
          // best-effort cleanup — ignore secondary error
        }
        return NextResponse.json(
          { error: "Failed to save image record. Please try again." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ images: uploadedImages }, { status: 201 });
  } catch (error) {
    console.error("[Upload] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during upload. Please try again." },
      { status: 500 }
    );
  }
}
