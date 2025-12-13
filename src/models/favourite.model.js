import mongoose from "mongoose";

// Schema for individual favourite items (movies/shows)
const favouriteItemSchema = new mongoose.Schema({
  // Either movieid or showid must exist (non-required individually, validated in controller)
  movieid: { type: String },
  showid: { type: String }
}, { _id: false }); // Disable auto-generated _id to simplify data structure

// Main schema for user's favourite lists
const favouriteListSchema = new mongoose.Schema({
  userid: { type: String, required: true }, // Required: Unique identifier for the user
  list_name: { type: String, required: true }, // Required: Name of the favourite list
  visibility: { 
    type: String, 
    required: true, 
    enum: ["public", "private"], // Only allow "public" or "private" visibility
    default: "public" // Default visibility setting: public
  },
  items: { type: [favouriteItemSchema], default: [] }, // Array of favourite items (movies/shows)
  isDeleted: { type: Boolean, default: false } // Soft delete flag (true = list marked as deleted)
}, { timestamps: true }); // Auto-generate createdAt/updatedAt timestamp fields

// Unique compound index: Prevent duplicate list names for the same user (avoids 409 conflicts)
favouriteListSchema.index({ userid: 1, list_name: 1 }, { unique: true });

// Export model: 
// - Model name: "FavouriteList"
// - Default collection name: "favourites" (Mongoose pluralizes model name)
// - To customize collection name: add third parameter (e.g., mongoose.model("FavouriteList", favouriteListSchema, "user_favourites"))
export default mongoose.model("FavouriteList", favouriteListSchema);