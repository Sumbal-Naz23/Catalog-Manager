// Server-only utility — fetches folders directly from MongoDB,
// bypassing the HTTP layer entirely. Used by the dashboard Server Component
// to pre-populate the sidebar on first paint.
import { connectDB } from "@/lib/mongodb";
import FolderModel from "@/models/Folder";
import type { Folder } from "@/hooks/useFolders";

export async function getFolders(): Promise<Folder[]> {
  try {
    await connectDB();
    const docs = await FolderModel
      .find()
      .select("_id name createdAt updatedAt")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
      .exec();

    // Serialize: convert ObjectId / Date to plain strings
    return docs.map((d) => ({
      _id:       String(d._id),
      name:      d.name,
      createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
      updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : String(d.updatedAt),
    }));
  } catch {
    // On error return empty — client will fetch via API as fallback
    return [];
  }
}
