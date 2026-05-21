import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Folder from "@/models/Folder";

// GET /api/folders
export async function GET() {
  try {
    await connectDB();

    const folders = await Folder
      .find()
      .select("_id name createdAt updatedAt")
      .sort({ createdAt: -1 })
      .limit(200)   // safety cap — no one has >200 folders
      .lean()
      .exec();

    return NextResponse.json(
      { folders },
      {
        headers: {
          // Browser caches for 60s; serves stale for 120s while revalidating.
          // Folders change rarely — this makes every repeat visit instant.
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/folders:", error);
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
  }
}

// POST /api/folders
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    // Use lean() for the duplicate check — we only need existence, not a document
    const existing = await Folder.findOne({ name: name.trim() }).select("_id").lean().exec();
    if (existing) {
      return NextResponse.json({ error: "A folder with this name already exists" }, { status: 409 });
    }

    const folder = await Folder.create({ name: name.trim() });
    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error("POST /api/folders:", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
