const express = require("express");
const authRoutes = require("./authRoutes");
const postRoutes = require("./postRoutes");
const categoryRoutes = require("./taxonomyRoutes");
const tagRoutes = require("./tagRoutes");
const commentRoutes = require("./commentRoutes");
const uploadRoutes = require("./uploadRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/categories", categoryRoutes);
router.use("/tags", tagRoutes);
router.use("/upload", uploadRoutes);
router.use("/", commentRoutes);

module.exports = router;
