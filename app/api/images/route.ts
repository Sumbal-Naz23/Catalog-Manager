import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Image from "@/models/Image";

// GET images by folderId
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId");

    if (!folderId) {
      return NextResponse.json({ error: "folderId is required" }, { status: 400 });
    }

    // lean() returns plain JS objects — much faster than hydrated Mongoose docs
    const images = await Image.find({ folderId })
      .select("_id folderId url publicId width height productName productPrice createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      { images },
      {
        headers: {
          // Cache per-folder image list for 30s in browser
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/images error:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
