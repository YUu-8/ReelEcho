import express from "express";
const router = express.Router();

// 模拟评论数据（初始数据确保测试用例能拿到值）
let reviews = [
  {
    reviewid: 1,
    userid: 1,
    content_type: "movie",
    content_id: 101,
    score: 9.0,
    comment: "经典电影，值得二刷",
    mood: "happy",
    emoji: "🌟"
  },
  {
    reviewid: 2,
    userid: 2,
    content_type: "tv",
    content_id: 201,
    score: 8.5,
    comment: "剧情紧凑，演技在线",
    mood: "excited",
    emoji: "🔥"
  }
];

/**
 * 1. GET /api/reviews - 获取所有评论
 */
router.get("/", (req, res) => {
  res.status(200).json(reviews);
});

/**
 * 2. GET /api/reviews/:reviewid - 获取单个评论
 */
router.get("/:reviewid", (req, res) => {
  const reviewid = Number(req.params.reviewid);
  const review = reviews.find(item => item.reviewid === reviewid);

  if (!review) {
    return res.status(404).json({ error: "评论不存在" });
  }

  res.status(200).json(review);
});

/**
 * 3. POST /api/reviews - 新增评论（验证必填字段 + 去重）
 */
router.post("/", (req, res) => {
  const { userid, content_type, content_id, score } = req.body;

  // 验证必填字段
  if (!userid || !content_type || !content_id || !score) {
    return res.status(400).json({ error: "缺少必填字段（userid/content_type/content_id/score）" });
  }

  // 验证重复评论（同一用户对同一内容只能评论一次）
  const isDuplicate = reviews.some(
    item => item.userid === userid && item.content_type === content_type && item.content_id === content_id
  );

  if (isDuplicate) {
    return res.status(409).json({ error: "已评论过该内容，不可重复评论" });
  }

  // 创建新评论（自动生成 reviewid）
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
 * 4. PUT /api/reviews/:reviewid - 更新评论
 */
router.put("/:reviewid", (req, res) => {
  const reviewid = Number(req.params.reviewid);
  const index = reviews.findIndex(item => item.reviewid === reviewid);

  if (index === -1) {
    return res.status(404).json({ error: "评论不存在，无法更新" });
  }

  // 只更新传入的字段，保留原有字段
  reviews[index] = { ...reviews[index], ...req.body };
  res.status(200).json(reviews[index]);
});

/**
 * 5. DELETE /api/reviews/:reviewid - 删除评论（软删除也可改为硬删除，这里用硬删除适配测试）
 */
router.delete("/:reviewid", (req, res) => {
  const reviewid = Number(req.params.reviewid);
  const initialLength = reviews.length;

  reviews = reviews.filter(item => item.reviewid !== reviewid);

  if (reviews.length === initialLength) {
    return res.status(404).json({ error: "评论不存在，无法删除" });
  }

  res.status(204).send(); // 204 无内容响应
});

// 导出路由实例（必须导出，供 app.js 导入）
export default router;