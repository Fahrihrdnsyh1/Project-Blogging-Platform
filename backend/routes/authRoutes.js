const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, login } = require("../controllers/authController");
const validateRequest = require("../middlewares/validate");
const {
  registerSchema,
  loginSchema,
} = require("../controllers/authController");

const router = express.Router();

const createAuthRateLimiter = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return res.status(429).json({
        success: false,
        message: "Too many authentication attempts",
        errors: [
          {
            field: "rateLimit",
            message: "Please try again later",
          },
        ],
      });
    },
  });

const registerRateLimiter = createAuthRateLimiter();
const loginRateLimiter = createAuthRateLimiter();

router.post(
  "/register",
  registerRateLimiter,
  validateRequest(registerSchema),
  register,
);
router.post("/login", loginRateLimiter, validateRequest(loginSchema), login);

module.exports = router;
