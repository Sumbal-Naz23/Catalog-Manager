import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
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
  // Already connected — return immediately (hot path, ~0ms)
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,       // more connections = less queuing under load
        minPoolSize: 2,        // keep 2 warm so cold starts are faster
        serverSelectionTimeoutMS: 4000,  // fail fast
        socketTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        maxIdleTimeMS: 120000, // keep connections alive for 2 min
        // Heartbeat every 10s — detects stale connections quickly
        heartbeatFrequencyMS: 10000,
      })
      .then((m) => {
        // Ensure indexes are created on first connect
        // (no-op after first run — Mongoose caches this)
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset so next request retries the connection
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
