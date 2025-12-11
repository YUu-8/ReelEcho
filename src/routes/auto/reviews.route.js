import express from "express";
import {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
} from "../../controllers/review.controller.js";

const router = express.Router();
router.use(express.json()); // Preserve existing JSON parsing

// Map endpoints to controller functions (no business logic here)
router.get("/", getAllReviews); // GET /api/reviews - Get all reviews
router.get("/:reviewid", getReviewById); // GET /api/reviews/:reviewid - Get single review
router.post("/", createReview); // POST /api/reviews - Add new review
router.put("/:reviewid", updateReview); // PUT /api/reviews/:reviewid - Update review
router.delete("/:reviewid", deleteReview); // DELETE /api/reviews/:reviewid - Delete review

export default router;