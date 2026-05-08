import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Image from "@/models/Image";
import cloudinary from "@/lib/cloudinary";

// PATCH – update productName, productPrice, and optionally replace the image
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const image = await Image.findById(id);
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Form data – may include a new image file
      const formData = await req.formData();
      const productName = formData.get("productName") as string | null;
      const productPriceRaw = formData.get("productPrice") as string | null;
      const file = formData.get("image") as File | null;

      if (productName !== null) image.productName = productName;
      if (productPriceRaw !== null) {
        image.productPrice = productPriceRaw.trim() === "" ? null : parseFloat(productPriceRaw);
      }

      if (file && file.size > 0) {
        // Delete old Cloudinary asset
        await cloudinary.uploader.destroy(image.publicId);

        // Upload new one
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const result = await new Promise<{
          secure_url: string;
          public_id: string;
          width: number;
          height: number;
        }>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { folder: `catalog-manager/${image.folderId}`, resource_type: "image" },
              (error, result) => {
                if (error || !result) reject(error);
                else resolve(result as { secure_url: string; public_id: string; width: number; height: number });
              }
            )
            .end(buffer);
        });

        image.url = result.secure_url;
        image.publicId = result.public_id;
        image.width = result.width;
        image.height = result.height;
      }
    } else {
      // JSON body – only metadata update
      const body = await req.json();
      if ("productName" in body) image.productName = body.productName ?? "";
      if ("productPrice" in body) image.productPrice = body.productPrice ?? null;
    }

    await image.save();
    return NextResponse.json({ image });
  } catch (error) {
    console.error("PATCH /api/images/[id] error:", error);
    return NextResponse.json({ error: "Failed to update image" }, { status: 500 });
  }
}

// DELETE a single image
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const image = await Image.findById(id);
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(image.publicId);

    // Delete from MongoDB
    await Image.findByIdAndDelete(id);

    return NextResponse.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/images/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
