import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Folder from "@/models/Folder";

// GET all folders
export async function GET() {
  try {
    await connectDB();
    const folders = await Folder.find().sort({ createdAt: -1 });
    return NextResponse.json({ folders });
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

    const existing = await Folder.findOne({ name: name.trim() });
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
