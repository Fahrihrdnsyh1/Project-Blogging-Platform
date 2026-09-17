const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { authenticateToken } = require("../middlewares/auth");

const router = express.Router();
const uploadDir =
  process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const extensionByMime = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    cb(null, `${crypto.randomUUID()}${extensionByMime[file.mimetype]}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };

    if (
      !allowedMimeTypes.includes(file.mimetype) ||
      allowedExtensions[ext] !== file.mimetype
    ) {
      const error = new Error(
        "Only valid JPG, PNG, and WEBP images are allowed",
      );
      error.statusCode = 400;
      error.errors = [
        { field: "image", message: "File type must be JPG, PNG, or WEBP" },
      ];
      return cb(error);
    }
    return cb(null, true);
  },
});

function hasValidImageSignature(buffer, mimeType) {
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  return (
    mimeType === "image/webp" &&
    buffer.subarray(0, 4).toString() === "RIFF" &&
    buffer.subarray(8, 12).toString() === "WEBP"
  );
}

router.post(
  "/",
  authenticateToken,
  upload.single("image"),
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
        errors: [{ field: "image", message: "Upload an image file" }],
      });
    }

    try {
      const fileBuffer = await fs.promises.readFile(req.file.path);
      if (!hasValidImageSignature(fileBuffer, req.file.mimetype)) {
        await fs.promises.unlink(req.file.path);
        return res.status(400).json({
          success: false,
          message: "Invalid image file",
          errors: [
            { field: "image", message: "File content is not a valid image" },
          ],
        });
      }

      const url = `http://localhost:5000/uploads/${req.file.filename}`;

      return res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        data: { url },
      });
    } catch (error) {
      if (req.file?.path) {
        await fs.promises.unlink(req.file.path).catch(() => undefined);
      }
      return next(error);
    }
  },
);

module.exports = router;
