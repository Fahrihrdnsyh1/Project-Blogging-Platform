const express = require("express");
const {
  getCommentsByPost,
  createComment,
  updateComment,
  deleteComment,
  createCommentSchema,
  updateCommentSchema,
} = require("../controllers/commentController");
const { authenticateToken } = require("../middlewares/auth");
const validateRequest = require("../middlewares/validate");

const router = express.Router();

router.get("/posts/:postId/comments", getCommentsByPost);
router.post(
  "/comments",
  authenticateToken,
  validateRequest(createCommentSchema),
  createComment,
);
router.put(
  "/comments/:id",
  authenticateToken,
  validateRequest(updateCommentSchema),
  updateComment,
);
router.delete("/comments/:id", authenticateToken, deleteComment);

module.exports = router;
