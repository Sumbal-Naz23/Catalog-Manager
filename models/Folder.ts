import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFolder extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    name: {
      type: String,
      required: [true, "Folder name is required"],
      trim: true,
      unique: true, // unique automatically creates an index
    },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// createdAt DESC — used by GET /api/folders sort({ createdAt: -1 })
FolderSchema.index({ createdAt: -1 });

const Folder: Model<IFolder> =
  mongoose.models.Folder || mongoose.model<IFolder>("Folder", FolderSchema);

export default Folder;
