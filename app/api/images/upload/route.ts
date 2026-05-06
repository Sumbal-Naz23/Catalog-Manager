import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Image from "@/models/Image";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();
    const folderId = formData.get("folderId") as string;
    const files = formData.getAll("images") as File[];

    if (!folderId) {
      return NextResponse.json({ error: "folderId is required" }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    const uploadedImages = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to Cloudinary
      const result = await new Promise<{
        secure_url: string;
        public_id: string;
        width: number;
        height: number;
      }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: `catalog-manager/${folderId}`,
              resource_type: "image",
            },
            (error, result) => {
              if (error || !result) reject(error);
              else resolve(result as { secure_url: string; public_id: string; width: number; height: number });
            }
          )
          .end(buffer);
      });

      // Save to MongoDB
      const image = await Image.create({
        folderId,
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      });

      uploadedImages.push(image);
    }

    return NextResponse.json({ images: uploadedImages }, { status: 201 });
  } catch (error) {
    console.error("POST /api/images/upload error:", error);
    return NextResponse.json({ error: "Failed to upload images" }, { status: 500 });
  }
}
