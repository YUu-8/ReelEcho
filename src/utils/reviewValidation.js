/**
 * Validates review data (pure function - no side effects)
 * @param {Object} data - Review data to validate
 * @returns {string[]} Errors (empty array if valid)
 */
export function validateReview(data) {
  const errors = [];

  // Required field checks
  if (!data.userid || (typeof data.userid !== "number" && typeof data.userid !== "string")) {
    errors.push("userid must be a valid string or number");
  }
  if (!data.content_type || !["movie", "tv"].includes(data.content_type)) {
    errors.push('content_type must be "movie" or "tv"');
  }
  if (!data.content_id || (typeof data.content_id !== "number" && typeof data.content_id !== "string")) {
    errors.push("content_id must be a valid number or string");
  }
  if (data.score === undefined || typeof data.score !== "number" || data.score < 0 || data.score > 10) {
    errors.push("score must be a number between 0 and 10");
  }

  // Optional field checks
  if (data.mood && !["happy", "excited", "neutral", "sad", "angry"].includes(data.mood)) {
    errors.push('mood must be one of: "happy", "excited", "neutral", "sad", "angry"');
  }

  return errors;
}