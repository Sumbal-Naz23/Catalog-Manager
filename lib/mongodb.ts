import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      // Keep a small pool — serverless functions don't need many connections
      maxPoolSize: 5,
      minPoolSize: 1,
      // Fail fast if MongoDB is unreachable rather than hanging
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      // Reuse connections aggressively
      maxIdleTimeMS: 60000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
