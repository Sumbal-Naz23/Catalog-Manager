import mongoose, { Schema, Document, Model } from "mongoose";

export interface IImage extends Document {
  folderId: mongoose.Types.ObjectId;
  url: string;
  publicId: string;
  width: number;
  height: number;
  productName?: string;
  productPrice?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = new Schema<IImage>(
  {
    folderId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      required: [true, "Folder ID is required"],
    },
    url: {
      type: String,
      required: [true, "Image URL is required"],
    },
    publicId: {
      type: String,
      required: [true, "Cloudinary public ID is required"],
    },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    productName: { type: String, default: "" },
    productPrice: { type: Number, default: null, required: false },
  },
  { timestamps: true }
);

const Image: Model<IImage> =
  mongoose.models.Image || mongoose.model<IImage>("Image", ImageSchema);

export default Image;
