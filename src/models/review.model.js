import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    reviewid: {
      type: Number,
      required: true,
      unique: true,
    },
    userid: { type: Number, required: true, index: true },
    content_type: { type: String, required: true, enum: ["movie", "tv"], index: true },
    content_id: { type: Number, required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 10 },
    comment: { type: String, default: "", trim: true },
    mood: { type: String, default: "neutral", enum: ["happy", "excited", "neutral", "sad", "angry"] },
    emoji: { type: String, default: "😐" },
  },
  { timestamps: true, collection: "Reviews" }
);

// reviewSchema.index({ userid: 1, content_type: 1, content_id: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);