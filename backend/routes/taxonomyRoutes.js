const express = require("express");
const {
  getCategories,
  createCategory,
  categorySchema,
} = require("../controllers/taxonomyController");
const { authenticateToken, requireRole } = require("../middlewares/auth");
const validateRequest = require("../middlewares/validate");

const router = express.Router();

router.get("/", getCategories);
router.post(
  "/",
  authenticateToken,
  requireRole(["admin", "author"]),
  validateRequest(categorySchema),
  createCategory,
);

module.exports = router;
