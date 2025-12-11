import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import app from "../src/app.js";
import Review from "../src/models/review.model.js";

describe("Reviews API (/api/reviews)", () => {
  let testReview;

  beforeEach(async () => {
    // Atomic cleanup - drop collection instead of deleteMany (guarantees clean state)
    await Review.collection.drop().catch(err => {
      if (err.code !== 26) throw err; // Ignore "namespace not found" error
    });

    const createRes = await request(app)
      .post("/api/reviews")
      .send({
        userid: 1,
        content_type: "movie",
        content_id: 101,
        score: 9.0,
        comment: "Functional test review",
        mood: "happy",
        emoji: "🌟"
      });

    testReview = createRes.body;
  });

  it("GET /api/reviews/:reviewid should return 404 (review not found)", async () => {
    const nonExistentId = testReview.reviewid + 1000; // guaranteed non-existent
    const res = await request(app).get(`/api/reviews/${nonExistentId}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it("POST /api/reviews should create a new review and return 201", async () => {
    const newReview = {
      userid: 2,
      content_type: "movie",
      content_id: 202,
      score: 7.0,
      comment: "Another functional test review",
      mood: "happy",
      emoji: "🙂"
    };

    const res = await request(app)
      .post("/api/reviews")
      .send(newReview)
      .set("Content-Type", "application/json");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("reviewid");
    expect(res.body.userid).toBe(newReview.userid);
  });

  it("POST /api/reviews should return 409 (duplicate review)", async () => {
    const duplicateReview = {
      userid: testReview.userid,
      content_type: testReview.content_type,
      content_id: testReview.content_id,
      score: 8.0,
      comment: "Duplicate review attempt"
    };

    const res = await request(app)
      .post("/api/reviews")
      .send(duplicateReview)
      .set("Content-Type", "application/json");

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Content already reviewed, cannot review again");
  });

  it("PUT /api/reviews/:reviewid should update review and return 200", async () => {
    const updateData = {
      score: 9.5,
      comment: "Updated functional test review",
      emoji: "🎉"
    };

    const res = await request(app)
      .put(`/api/reviews/${testReview.reviewid}`)
      .send(updateData)
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body.score).toBe(updateData.score);
  });
});