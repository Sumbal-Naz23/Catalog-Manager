import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Folder from "@/models/Folder";
import Image from "@/models/Image";
import cloudinary from "@/lib/cloudinary";

// PATCH rename folder
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    const existing = await Folder.findOne({ name: name.trim(), _id: { $ne: id } });
    if (existing) {
      return NextResponse.json({ error: "A folder with this name already exists" }, { status: 409 });
    }

    const folder = await Folder.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    );

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({ folder });
  } catch (error) {
    console.error("PATCH /api/folders/[id] error:", error);
    return NextResponse.json({ error: "Failed to rename folder" }, { status: 500 });
  }
}

// DELETE folder and all its images
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const folder = await Folder.findById(id);
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Delete all images in this folder from Cloudinary
    const images = await Image.find({ folderId: id });
    const deletePromises = images.map((img) =>
      cloudinary.uploader.destroy(img.publicId)
    );
    await Promise.allSettled(deletePromises);

    // Delete images from DB
    await Image.deleteMany({ folderId: id });

    // Delete folder
    await Folder.findByIdAndDelete(id);

    return NextResponse.json({ message: "Folder deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/folders/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}
