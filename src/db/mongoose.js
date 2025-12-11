import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Validate MONGO_URI exists (Lab 7 Section 1.5 requirement)
if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not defined in environment variables");
}

/**
 * Connect to MongoDB Atlas using Mongoose (matches your app.js import)
 */
export async function connectToMongoose() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      ssl: true, // Required for Atlas connection
      retryWrites: true,
      w: "majority",
    });
    console.log("Connected to MongoDB:", mongoose.connection.db.databaseName); // Lab 7 required output
  } catch (err) {
    console.error("MongoDB Atlas connection error:", err);
    process.exit(1); // Exit on critical error
  }
}

// Export connection for testing
export const db = mongoose.connection;