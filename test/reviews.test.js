import { describe, it, expect } from "vitest"; // 手动导入测试所需变量
import request from "supertest";
import app from "../src/app.js";

// 测试套件：Review API 所有接口
describe("Reviews API (/api/reviews)", () => {
  // 测试 1：GET 所有评论 → 返回 200 和数组
  it("GET /api/reviews 应返回 200 和评论数组", async () => {
    const res = await request(app).get("/api/reviews");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // 测试 2：GET 单个存在的评论 → 返回 200 和评论详情
  it("GET /api/reviews/:reviewid 应返回存在的评论", async () => {
    const res = await request(app).get("/api/reviews/1");
    expect(res.status).toBe(200);
    expect(res.body.reviewid).toBe(1);
  });

  // 测试 3：GET 不存在的评论 → 返回 404
  it("GET /api/reviews/:reviewid 应返回 404（评论不存在）", async () => {
    const res = await request(app).get("/api/reviews/999");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  // 测试 4：POST 新增评论 → 返回 201 和新评论
  it("POST /api/reviews 应创建新评论并返回 201", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .send({
        userid: 1,
        content_type: "tv",
        content_id: 201,
        score: 9.0,
        comment: "太精彩了！",
        mood: "excited",
        emoji: "🎉"
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("reviewid");
    expect(res.body.content_type).toBe("tv");
  });

  // 测试 5：POST 重复评论 → 返回 409 冲突
  it("POST /api/reviews 应返回 409（重复评论）", async () => {
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

  // 测试 6：POST 缺少必填字段 → 返回 400
  it("POST /api/reviews 应返回 400（缺少必填字段）", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .send({ userid: 1, content_type: "movie" });
    expect(res.status).toBe(400);
  });

  // 测试 7：PUT 更新评论 → 返回 200 和更新后的评论
  it("PUT /api/reviews/:reviewid 应更新评论并返回 200", async () => {
    const res = await request(app)
      .put("/api/reviews/1")
      .send({ score: 9.5, comment: "更新后的评论" });
    expect(res.status).toBe(200);
    expect(res.body.score).toBe(9.5);
    expect(res.body.comment).toBe("更新后的评论");
  });

  // 测试 8：DELETE 删除评论 → 返回 204 无内容
  it("DELETE /api/reviews/:reviewid 应软删除评论并返回 204", async () => {
    const res = await request(app).delete("/api/reviews/1");
    expect(res.status).toBe(204);
    const getRes = await request(app).get("/api/reviews/1");
    expect(getRes.status).toBe(404);
  });
});