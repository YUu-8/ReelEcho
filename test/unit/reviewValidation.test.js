import { describe, it, expect } from "vitest";
import { validateReview } from "../../src/utils/reviewValidation.js";

describe("validateReview", () => {
  it("returns no errors for valid review data", () => {
    const validData = {
      userid: 1,
      content_type: "movie",
      content_id: 101,
      score: 9.0,
      mood: "happy",
    };
    const errors = validateReview(validData);
    expect(errors).toEqual([]);
  });

  it("returns errors for missing required fields", () => {
    const invalidData = { content_type: "tv", score: 8.5 }; // Missing userid + content_id
    const errors = validateReview(invalidData);
    expect(errors).toContain("userid must be a valid number");
    expect(errors).toContain("content_id must be a valid number");
  });

  it("returns errors for invalid field values", () => {
    const invalidData = {
      userid: "not-a-number",
      content_type: "book", // Invalid content_type
      content_id: "invalid",
      score: 11, // Score exceeds max (10)
      mood: "joyful", // Invalid mood
    };
    const errors = validateReview(invalidData);
    expect(errors).toContain("userid must be a valid number");
    expect(errors).toContain('content_type must be "movie" or "tv"');
    expect(errors).toContain("content_id must be a valid number");
    expect(errors).toContain("score must be a number between 0 and 10");
    expect(errors).toContain('mood must be one of: "happy", "excited", "neutral", "sad", "angry"');
  });
});