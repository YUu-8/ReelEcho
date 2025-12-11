import request from "supertest";
import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import app from "../../src/app.js";
import Review from "../../src/models/review.model.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables (Lab 7 Section 1.5 Requirement)
dotenv.config();

/**
 * Generate 100% unique test data to prevent duplicate key conflicts
 * Lab 7 Section 5.2: Test Isolation (No cross-test data contamination)
 * @returns {Object} Unique review test data
 */
const generateUniqueTestReview = () => {
  const uniqueTimestamp = Date.now(); // Use current time for guaranteed uniqueness
  return {
    userid: uniqueTimestamp,
    content_type: "movie",
    content_id: uniqueTimestamp,
    score: Math.floor(Math.random() * 10) + 1, // Random valid score (1-10)
    comment: `Integration test review - ${uniqueTimestamp}`,
    mood: "happy",
    emoji: "🌟"
  };
};

/**
 * Integration Tests for Reviews API
 * Lab 7 Core Requirement: Validate end-to-end flow (Route → Controller → Model → Atlas)
 * Scope: Verify API operations persist/modify data in MongoDB Atlas correctly
 */
describe("Reviews API (Integration)", () => {
  // Test data variables (dynamically generated per test)
  let baseTestReview;
  let createdReview;

  /**
   * Connect to MongoDB Atlas once before all tests
   * Lab 7 Section 1.6 Requirement: Reusable database connection logic
   */
  beforeAll(async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        ssl: true,
        retryWrites: true,
        w: "majority",
        connectTimeoutMS: 5000 // Prevent hanging connections
      });
      console.log("Integration tests: Successfully connected to MongoDB Atlas");
    } catch (error) {
      console.error("Integration tests: Failed to connect to MongoDB Atlas", error);
      throw error; // Fail fast if connection fails
    }
  });

  /**
   * Atomic test isolation - run before EVERY test
   * Lab 7 Best Practice: Guarantee clean state for each test
   * - Drop collection (not just deleteMany) to reset indexes/state
   * - Create fresh unique test data for each test iteration
   */
  beforeEach(async () => {
    // Drop Reviews collection (handles edge cases where deleteMany might fail)
    await Review.collection.drop().catch((err) => {
      // Ignore "namespace not found" error (collection already dropped)
      if (err.code !== 26) throw err;
    });

    // Generate unique base test data (no collision possible)
    baseTestReview = generateUniqueTestReview();

    // Create base review for test operations (GET/PUT/DELETE)
    const createResponse = await request(app)
      .post("/api/reviews")
      .send(baseTestReview)
      .set("Content-Type", "application/json");

    // Store created review data for subsequent test steps
    createdReview = createResponse.body;
  });

  /**
   * Disconnect from MongoDB Atlas once after all tests
   * Lab 7 Resource Management: Prevent lingering database connections
   */
  afterAll(async () => {
    await mongoose.disconnect();
    console.log("Integration tests: Disconnected from MongoDB Atlas");
  });

  /**
   * Test: Create new review and verify persistence in Atlas
   * Lab 7 Section 5.2 Core Requirement: API → Atlas data sync validation
   * Expected: 201 Created + review exists in Atlas
   */
  it("should create a new review and save to Atlas", async () => {
    // Generate completely unique review data (no duplicate risk)
    const newTestReview = generateUniqueTestReview();

    // Step 1: Send POST request to create review
    const createResponse = await request(app)
      .post("/api/reviews")
      .send(newTestReview)
      .set("Content-Type", "application/json");

    // Validate API response (status code + data structure)
    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.body).toHaveProperty("reviewid"); // Auto-generated ID
    expect(createResponse.body.userid).toBe(newTestReview.userid);
    expect(createResponse.body.score).toBe(newTestReview.score);
    expect(createResponse.body.content_type).toBe(newTestReview.content_type);

    // Step 2: Direct Atlas query to verify data persistence
    const atlasReview = await Review.findOne({
      reviewid: createResponse.body.reviewid
    }).lean(); // lean() for plain JS object (better performance)

    // Validate Atlas data matches API response
    expect(atlasReview).not.toBeNull();
    expect(atlasReview.comment).toBe(newTestReview.comment);
    expect(atlasReview.mood).toBe(newTestReview.mood);
    expect(atlasReview.createdAt).toBeDefined(); // Mongoose timestamp (Lab 7 Requirement)
  });

  /**
   * Test: Prevent duplicate reviews (compound index enforcement)
   * Lab 7 Section 3 Requirement: Unique constraint (userid + content_type + content_id)
   * Expected: 409 Conflict when duplicate is attempted
   */
  it("should prevent duplicate reviews", async () => {
    // Step 1: Attempt to create duplicate review (same userid + content_type + content_id)
    const duplicateReview = {
      userid: baseTestReview.userid,
      content_type: baseTestReview.content_type,
      content_id: baseTestReview.content_id,
      score: 8.5, // Different score - still duplicate based on compound index
      comment: "Duplicate review attempt"
    };

    const duplicateResponse = await request(app)
      .post("/api/reviews")
      .send(duplicateReview)
      .set("Content-Type", "application/json");

    // Validate duplicate prevention
    expect(duplicateResponse.statusCode).toBe(409);
    expect(duplicateResponse.body.error).toBe("Content already reviewed, cannot review again");

    // Step 2: Verify only one review exists in Atlas (no duplicate created)
    const reviewCount = await Review.countDocuments({
      userid: baseTestReview.userid,
      content_type: baseTestReview.content_type,
      content_id: baseTestReview.content_id
    });
    expect(reviewCount).toBe(1); // Only the original review exists
  });

  /**
   * Test: Retrieve single review by reviewid
   * Lab 7 Section 4 Requirement: GET by ID endpoint validation
   * Expected: 200 OK + matching review data from Atlas
   */
  it("should get a single review by reviewid", async () => {
    // Step 1: Send GET request for specific reviewid
    const getResponse = await request(app).get(`/api/reviews/${createdReview.reviewid}`);

    // Validate API response
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body.reviewid).toBe(createdReview.reviewid);
    expect(getResponse.body.content_id).toBe(baseTestReview.content_id);
    expect(getResponse.body.emoji).toBe(baseTestReview.emoji);

    // Step 2: Cross-verify with direct Atlas query
    const atlasReview = await Review.findOne({
      reviewid: createdReview.reviewid
    }).lean();
    expect(getResponse.body.score).toBe(atlasReview.score);
  });

  /**
   * Test: Update existing review
   * Lab 7 Section 4 Requirement: PUT endpoint validation
   * Expected: 200 OK + updated data persisted in Atlas
   */
  it("should update an existing review", async () => {
    // Step 1: Define valid update data (only allowed fields)
    const updateData = {
      score: 9.5,
      comment: "Updated integration test review - verified in Atlas",
      mood: "excited",
      emoji: "🎉"
    };

    // Step 2: Send PUT request to update review
    const updateResponse = await request(app)
      .put(`/api/reviews/${createdReview.reviewid}`)
      .send(updateData)
      .set("Content-Type", "application/json");

    // Validate API response (updated fields + preserved original fields)
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.score).toBe(updateData.score);
    expect(updateResponse.body.comment).toBe(updateData.comment);
    expect(updateResponse.body.mood).toBe(updateData.mood);
    expect(updateResponse.body.userid).toBe(baseTestReview.userid); // Unchanged field

    // Step 3: Verify update in Atlas
    const updatedAtlasReview = await Review.findOne({
      reviewid: createdReview.reviewid
    }).lean();
    expect(updatedAtlasReview.score).toBe(updateData.score);
    expect(updatedAtlasReview.comment).toBe(updateData.comment);
    expect(updatedAtlasReview.updatedAt).not.toBe(updatedAtlasReview.createdAt); // Timestamp updated
  });

  /**
   * Test: Delete review
   * Lab 7 Section 4 Requirement: DELETE endpoint validation
   * Expected: 204 No Content + review removed from Atlas
   */
  it("should delete a review", async () => {
    // Step 1: Send DELETE request for existing review
    const deleteResponse = await request(app).delete(`/api/reviews/${createdReview.reviewid}`);

    // Validate API response (204 = success with no content)
    expect(deleteResponse.statusCode).toBe(204);
    expect(deleteResponse.body).toEqual({}); // Empty body for 204

    // Step 2: Verify review no longer exists in Atlas
    const deletedAtlasReview = await Review.findOne({
      reviewid: createdReview.reviewid
    }).lean();
    expect(deletedAtlasReview).toBeNull();

    // Step 3: Verify 404 when trying to retrieve deleted review
    const getDeletedResponse = await request(app).get(`/api/reviews/${createdReview.reviewid}`);
    expect(getDeletedResponse.statusCode).toBe(404);
  });
});