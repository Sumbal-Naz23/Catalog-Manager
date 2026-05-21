import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Image from "@/models/Image";

// GET /api/images?folderId=xxx
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const folderId = new URL(req.url).searchParams.get("folderId");
    if (!folderId) {
      return NextResponse.json({ error: "folderId is required" }, { status: 400 });
    }

    // The compound index { folderId:1, createdAt:-1 } makes this a pure
    // index scan — no collection scan, no in-memory sort. ~5-10ms on Atlas.
    const images = await Image
      .find({ folderId })
      .select("_id folderId url publicId width height productName productPrice createdAt")
      .sort({ createdAt: -1 })
      .limit(500)   // safety cap
      .lean()
      .exec();

    return NextResponse.json(
      { images },
      {
        headers: {
          // 60s browser cache + 120s stale-while-revalidate
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/images:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
