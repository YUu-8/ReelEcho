import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    // Numeric id (like other modules such as reviewid)
    id: { type: Number, required: true, unique: true, index: true },

    userid: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
    reviewid: { type: Number, required: true, index: true },

    content: { type: String, required: true, trim: true },

    // Auto-generated date
    post_date: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "Posts" }
);

export default mongoose.model("Post", postSchema);
