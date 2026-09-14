const express = require("express");
const {
  getPosts,
  getMyPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  postSchema,
  updatePostSchema,
} = require("../controllers/postController");
const { authenticateToken, requireRole } = require("../middlewares/auth");
const validateRequest = require("../middlewares/validate");

const router = express.Router();

router.get("/mine", authenticateToken, getMyPosts);
router.get("/", getPosts);
router.get("/:slug", getPostBySlug);
router.post(
  "/",
  authenticateToken,
  requireRole(["admin", "author"]),
  validateRequest(postSchema),
  createPost,
);
router.put(
  "/:id",
  authenticateToken,
  requireRole(["admin", "author"]),
  validateRequest(updatePostSchema),
  updatePost,
);
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["admin", "author"]),
  deletePost,
);

module.exports = router;
