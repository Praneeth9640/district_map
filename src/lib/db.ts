import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

/**
 * Shared MongoDB connection for Vercel serverless.
 * Reuses the connection across warm invocations.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "Missing MONGODB_URI. Add your MongoDB Atlas connection string to .env",
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
