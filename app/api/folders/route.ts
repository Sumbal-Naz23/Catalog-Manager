import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Folder from "@/models/Folder";

// GET all folders
export async function GET() {
  try {
    await connectDB();
    // lean() returns plain JS objects — 3-5x faster than full Mongoose documents
    const folders = await Folder.find()
      .select("_id name createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      { folders },
      {
        headers: {
          // Cache in browser for 30s, allow stale-while-revalidate for 60s
          // Folders rarely change — this makes repeat visits instant
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/folders error:", error);
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
  }
}

// POST create folder
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    const existing = await Folder.findOne({ name: name.trim() }).lean();
    if (existing) {
      return NextResponse.json({ error: "A folder with this name already exists" }, { status: 409 });
    }

    const folder = await Folder.create({ name: name.trim() });
    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error("POST /api/folders error:", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
