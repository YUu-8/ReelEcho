import { describe, it, expect } from "vitest"; // Manually import required test variables
import request from "supertest";
import app from "../src/app.js";

// Test Suite: Review API All Endpoints
describe("Reviews API (/api/reviews)", () => {
  // Test 1: GET all reviews → Returns 200 and array
  it("GET /api/reviews should return 200 and reviews array", async () => {
    const res = await request(app).get("/api/reviews");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Test 2: GET single existing review → Returns 200 and review details
  it("GET /api/reviews/:reviewid should return existing review", async () => {
    const res = await request(app).get("/api/reviews/1");
    expect(res.status).toBe(200);
    expect(res.body.reviewid).toBe(1);
  });

  // Test 3: GET non-existent review → Returns 404
  it("GET /api/reviews/:reviewid should return 404 (review not found)", async () => {
    const res = await request(app).get("/api/reviews/999");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  // Test 4: POST new review → Returns 201 and new review
  it("POST /api/reviews should create new review and return 201", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .send({
        userid: 1,
        content_type: "tv",
        content_id: 201,
        score: 9.0,
        comment: "Amazing!",
        mood: "excited",
        emoji: "🎉"
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("reviewid");
    expect(res.body.content_type).toBe("tv");
  });

  // Test 5: POST duplicate review → Returns 409 Conflict
  it("POST /api/reviews should return 409 (duplicate review)", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .send({
        userid: 1,
        content_type: "movie",
        content_id: 101,
        score: 9.5
      });
    expect(res.status).toBe(409);
  });

  // Test 6: POST missing required fields → Returns 400
  it("POST /api/reviews should return 400 (missing required fields)", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .send({ userid: 1, content_type: "movie" });
    expect(res.status).toBe(400);
  });

  // Test 7: PUT update review → Returns 200 and updated review
  it("PUT /api/reviews/:reviewid should update review and return 200", async () => {
    const res = await request(app)
      .put("/api/reviews/1")
      .send({ score: 9.5, comment: "Updated comment" });
    expect(res.status).toBe(200);
    expect(res.body.score).toBe(9.5);
    expect(res.body.comment).toBe("Updated comment");
  });

  // Test 8: DELETE review → Returns 204 No Content
  it("DELETE /api/reviews/:reviewid should soft delete review and return 204", async () => {
    const res = await request(app).delete("/api/reviews/1");
    expect(res.status).toBe(204);
    const getRes = await request(app).get("/api/reviews/1");
    expect(getRes.status).toBe(404);
  });
});