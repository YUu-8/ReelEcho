// src/routes/auto/posts.route.js

import express from "express";

const router = express.Router();

const posts = [];

// GET /api/posts
// Return all posts.
router.get("/", (req, res) => {
  res.status(200).json(posts);
});

// POST /api/posts
// Create a new post (share) linked to a review.
router.post("/", (req, res) => {
  const { userid, content, reviewid } = req.body;

  // Basic validation
  if (!userid || !content || !reviewid) {
    return res.status(400).json({
      error: "Missing required fields (userid, content, reviewid)",
    });
  }

  const newPost = {
    id: posts.length + 1, // auto-incremented id
    userid,
    content,
    reviewid,
    // auto-generated post date
    post_date: new Date().toISOString(),
  };

  posts.push(newPost);
  return res.status(201).json(newPost);
});

// PUT /api/posts/:id
// Update the content of an existing post.
router.put("/:id", (req, res) => {
  const postId = Number(req.params.id);
  const { content } = req.body;

  if (!Number.isInteger(postId)) {
    return res.status(400).json({ error: "Invalid post id" });
  }

  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  if (!content) {
    return res.status(400).json({ error: "Missing content field" });
  }

  post.content = content;
  return res.status(200).json(post);
});

// DELETE /api/posts/:id
// Delete a post by id.
router.delete("/:id", (req, res) => {
  const postId = Number(req.params.id);

  if (!Number.isInteger(postId)) {
    return res.status(400).json({ error: "Invalid post id" });
  }

  const index = posts.findIndex((p) => p.id === postId);

  if (index === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  // Remove one element at index
  posts.splice(index, 1);

  // 204 No Content
  return res.status(204).send();
});

export default router;
