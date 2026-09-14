const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { authenticateToken } = require("../middlewares/auth");

const router = express.Router();
const uploadDir =
  process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const basename = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    const uniqueName = `${Date.now()}-${basename}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error("Only JPG, JPEG, PNG, and WEBP images are allowed"));
    }
    return cb(null, true);
  },
});

router.post("/", authenticateToken, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Image file is required",
      errors: [{ field: "image", message: "Upload an image file" }],
    });
  }

  const url = `http://localhost:5000/uploads/${req.file.filename}`;

  return res.status(200).json({
    success: true,
    message: "Image uploaded successfully",
    data: { url },
  });
});

module.exports = router;
