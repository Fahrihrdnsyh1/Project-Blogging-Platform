const express = require("express");
const {
  getTags,
  createTag,
  tagSchema,
} = require("../controllers/taxonomyController");
const { authenticateToken, requireRole } = require("../middlewares/auth");
const validateRequest = require("../middlewares/validate");

const router = express.Router();

router.get("/", getTags);
router.post(
  "/",
  authenticateToken,
  requireRole(["admin", "author"]),
  validateRequest(tagSchema),
  createTag,
);

module.exports = router;
