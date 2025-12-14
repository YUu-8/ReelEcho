import Post from "../models/post.model.js";
import {
  isValidNumericId,
  validateCreatePostBody,
  validateUpdatePostBody,
} from "../utils/postValidation.js";

// GET /api/posts
export async function getAllPosts(req, res, next) {
  try {
    const posts = await Post.find({}).sort({ id: 1 }).lean();
    return res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
}

// GET /api/posts/:id
export async function getPostById(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidNumericId(id)) {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const post = await Post.findOne({ id: Number(id) }).lean();
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.status(200).json(post);
  } catch (err) {
    next(err);
  }
}

// POST /api/posts
export async function createPost(req, res, next) {
  try {
    const errMsg = validateCreatePostBody(req.body);
    if (errMsg) return res.status(400).json({ error: errMsg });

    const { userid, content, reviewid } = req.body;

    // Auto-increment numeric id
    const last = await Post.findOne({}).sort({ id: -1 }).select("id").lean();
    const nextId = last?.id ? last.id + 1 : 1;

    const created = await Post.create({
      id: nextId,
      userid: Number(userid),
      content: String(content).trim(),
      reviewid: Number(reviewid),
      post_date: new Date(), // auto-generated
    });

    // Return a clean JSON
    return res.status(201).json({
      id: created.id,
      userid: created.userid,
      content: created.content,
      reviewid: created.reviewid,
      post_date: created.post_date.toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/posts/:id
export async function updatePost(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidNumericId(id)) {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const errMsg = validateUpdatePostBody(req.body);
    if (errMsg) return res.status(400).json({ error: errMsg });

    const updated = await Post.findOneAndUpdate(
      { id: Number(id) },
      { content: String(req.body.content).trim() },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/posts/:id
export async function deletePost(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidNumericId(id)) {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const deleted = await Post.findOneAndDelete({ id: Number(id) }).lean();
    if (!deleted) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}
