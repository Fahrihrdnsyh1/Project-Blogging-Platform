const express = require("express");
const { register, login } = require("../controllers/authController");
const validateRequest = require("../middlewares/validate");
const {
  registerSchema,
  loginSchema,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", validateRequest(registerSchema), register);
router.post("/login", validateRequest(loginSchema), login);

module.exports = router;
