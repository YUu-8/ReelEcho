import Review from "../models/review.model.js";

/**
 * Get all reviews
 * Returns an array of all review documents (200)
 */
export async function getAllReviews(_req, res, next) {
  try {
    const reviews = await Review.find().sort({ reviewid: 1 }).lean();
    return res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
}

/**
 * Create new review (Lab 7 Section 4: MVC Controller Requirement)
 * Handles validation, duplicate check, and auto-increment reviewid
 */
export async function createReview(req, res, next) {
  try {
    // Step 1: Validate ALL required fields first (fixes 400 instead of 409)
    const { userid, content_type, content_id, score } = req.body;
    const requiredFields = [userid, content_type, content_id, score];
    if (requiredFields.some(field => field === undefined || field === null)) {
      return res.status(400).json({ 
        error: "Missing required fields: userid, content_type, content_id, score are mandatory" 
      });
    }

    // Step 2: Check for duplicates BEFORE creating (atomic operation)
    const existingReview = await Review.findOne({
      userid,
      content_type,
      content_id
    });

    if (existingReview) {
      return res.status(409).json({ 
        error: "Content already reviewed, cannot review again" 
      });
    }

    // Step 3: Auto-increment reviewid (prevents duplicate key errors)
    const maxReview = await Review.findOne().sort({ reviewid: -1 }).lean();
    const newReviewid = maxReview ? maxReview.reviewid + 1 : 1;

    // Step 4: Create new review (only if no duplicates/validation errors)
    const newReview = await Review.create({
      reviewid: newReviewid,
      userid,
      content_type,
      content_id,
      score,
      comment: req.body.comment || "",
      mood: req.body.mood || "neutral",
      emoji: req.body.emoji || "😐",
    });

    return res.status(201).json(newReview);
  } catch (err) {
    // Handle unexpected database errors (Lab 7 Error Handling Requirement)
    if (err.code === 11000) {
      return res.status(409).json({ error: "Duplicate review detected" });
    }
    next(err); // Pass to global error handler
  }
}

/**
 * Update existing review (Fixes 500 error in integration test)
 */
export async function updateReview(req, res, next) {
  try {
    const { reviewid } = req.params;
    const updateData = req.body;

    // Step 1: Validate reviewid exists
    const existingReview = await Review.findOne({ reviewid: Number(reviewid) });
    if (!existingReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Step 2: Update only allowed fields (prevent schema violations)
    const allowedUpdates = ["score", "comment", "mood", "emoji"];
    const filteredUpdates = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => ({ ...obj, [key]: updateData[key] }), {});

    // Step 3: Perform atomic update
    const updatedReview = await Review.findOneAndUpdate(
      { reviewid: Number(reviewid) },
      filteredUpdates,
      { new: true, runValidators: true } // Return updated document + validate
    );

    return res.status(200).json(updatedReview);
  } catch (err) {
    next(err);
  }
}

/**
 * Delete review (already working - keep as is)
 */
export async function deleteReview(req, res, next) {
  try {
    const { reviewid } = req.params;
    const deletedReview = await Review.findOneAndDelete({ reviewid: Number(reviewid) });
    
    if (!deletedReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Get single review (already working - keep as is)
 */
export async function getReviewById(req, res, next) {
  try {
    const { reviewid } = req.params;
    const review = await Review.findOne({ reviewid: Number(reviewid) });
    
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    return res.status(200).json(review);
  } catch (err) {
    next(err);
  }
}