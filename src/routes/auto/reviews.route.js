import express from "express";
const router = express.Router();
router.use(express.json());

// Mock review data (initial data ensures test cases can retrieve values)
let reviews = [
  {
    reviewid: 1,
    userid: 1,
    content_type: "movie",
    content_id: 101,
    score: 9.0,
    comment: "Classic movie, worth watching again",
    mood: "happy",
    emoji: "🌟"
  },
  {
    reviewid: 2,
    userid: 2,
    content_type: "tv",
    content_id: 201,
    score: 8.5,
    comment: "Tight plot, great acting",
    mood: "excited",
    emoji: "🔥"
  }
];

/**
 * 1. GET /api/reviews - Get all reviews
 */
router.get("/", (req, res) => {
  res.status(200).json(reviews);
});

/**
 * 2. GET /api/reviews/:reviewid - Get a single review
 */
router.get("/:reviewid", (req, res) => {
  const reviewid = Number(req.params.reviewid);
  const review = reviews.find(item => item.reviewid === reviewid);

  if (!review) {
    return res.status(404).json({ error: "Review not found" });
  }

  res.status(200).json(review);
});

/**
 * 3. POST /api/reviews - Add a new review (validate required fields + deduplication)
 */
router.post("/", (req, res) => {
  const { userid, content_type, content_id, score } = req.body;

  // Validate required fields
  if (!userid || !content_type || !content_id || !score) {
    return res.status(400).json({ error: "Missing required fields (userid/content_type/content_id/score)" });
  }

  // Validate duplicate reviews (same user can only review the same content once)
  const isDuplicate = reviews.some(
    item => item.userid === userid && item.content_type === content_type && item.content_id === content_id
  );

  if (isDuplicate) {
    return res.status(409).json({ error: "Content already reviewed, cannot review again" });
  }

  // Create new review (auto-generate reviewid)
  const newReview = {
    reviewid: reviews.length > 0 ? Math.max(...reviews.map(item => item.reviewid)) + 1 : 1,
    userid,
    content_type,
    content_id,
    score,
    comment: req.body.comment || "",
    mood: req.body.mood || "neutral",
    emoji: req.body.emoji || "😐"
  };

  reviews.push(newReview);
  res.status(201).json(newReview);
});

/**
 * 4. PUT /api/reviews/:reviewid - Update review
 */
router.put("/:reviewid", (req, res) => {
  const reviewid = Number(req.params.reviewid);
  const index = reviews.findIndex(item => item.reviewid === reviewid);

  if (index === -1) {
    return res.status(404).json({ error: "Review not found, cannot update" });
  }

  // Only update provided fields, keep original fields
  reviews[index] = { ...reviews[index], ...req.body };
  res.status(200).json(reviews[index]);
});

/**
 * 5. DELETE /api/reviews/:reviewid - Delete review (soft delete can be changed to hard delete, using hard delete here to adapt to tests)
 */
router.delete("/:reviewid", (req, res) => {
  const reviewid = Number(req.params.reviewid);
  const initialLength = reviews.length;

  reviews = reviews.filter(item => item.reviewid !== reviewid);

  if (reviews.length === initialLength) {
    return res.status(404).json({ error: "Review not found, cannot delete" });
  }

  res.status(204).send(); // 204 No Content response
});

// Export router instance (must export for app.js to import)
export default router;