// test/posts.test.js

// Integration tests for /api/posts routes.
import request from "supertest";
import app from "../src/app.js";

describe("Posts API (/api/posts)", () => {
  it("GET /api/posts should return an array of posts", async () => {
    // At the beginning, the in-memory posts array is empty → still an array
    const res = await request(app).get("/api/posts");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/posts should create a new post with auto-generated post_date", async () => {
    const payload = {
      userid: 1,
      content: "My first shared post",
      reviewid: 42,
    };

    const res = await request(app).post("/api/posts").send(payload);

    expect(res.status).toBe(201);

    // New post should have id and post_date (auto-generated).
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("post_date");
    expect(typeof res.body.post_date).toBe("string");
    expect(res.body.content).toBe(payload.content);
  });

  it("POST /api/posts should return 400 when required fields are missing", async () => {
    // Missing reviewid
    const res = await request(app)
      .post("/api/posts")
      .send({ userid: 1, content: "no review id" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("PUT /api/posts/:id should update post content", async () => {
    // First create a post
    const createRes = await request(app).post("/api/posts").send({
      userid: 2,
      content: "Old content",
      reviewid: 99,
    });

    const createdId = createRes.body.id;

    // Then update it
    const updateRes = await request(app)
      .put(`/api/posts/${createdId}`)
      .send({ content: "Updated content" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.content).toBe("Updated content");
  });

  it("DELETE /api/posts/:id should remove the post", async () => {
    // Create another post to delete
    const createRes = await request(app).post("/api/posts").send({
      userid: 3,
      content: "To be deleted",
      reviewid: 100,
    });

    const createdId = createRes.body.id;

    const deleteRes = await request(app).delete(`/api/posts/${createdId}`);

    expect(deleteRes.status).toBe(204);

    // Optional check: GET should no longer find it
    const getRes = await request(app).get("/api/posts");
    const ids = getRes.body.map((p) => p.id);
    expect(ids).not.toContain(createdId);
  });
});
