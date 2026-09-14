const { z } = require("zod");
const db = require("../config/database");

const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
});

const tagSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required"),
});

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function getCategories(req, res, next) {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM categories ORDER BY name ASC",
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
}

async function getTags(req, res, next) {
  try {
    const [rows] = await db.execute("SELECT * FROM tags ORDER BY name ASC");
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const body = categorySchema.parse(req.body);
    const slug = slugify(body.name);

    const [existing] = await db.execute(
      "SELECT id FROM categories WHERE slug = ?",
      [slug],
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
        errors: [
          { field: "name", message: "Category with this name already exists" },
        ],
      });
    }

    const [result] = await db.execute(
      "INSERT INTO categories (name, slug) VALUES (?, ?)",
      [body.name, slug],
    );
    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: { id: result.insertId, name: body.name, slug },
    });
  } catch (error) {
    return next(error);
  }
}

async function createTag(req, res, next) {
  try {
    const body = tagSchema.parse(req.body);
    const slug = slugify(body.name);

    const [existing] = await db.execute("SELECT id FROM tags WHERE slug = ?", [
      slug,
    ]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Tag already exists",
        errors: [
          { field: "name", message: "Tag with this name already exists" },
        ],
      });
    }

    const [result] = await db.execute(
      "INSERT INTO tags (name, slug) VALUES (?, ?)",
      [body.name, slug],
    );
    return res.status(201).json({
      success: true,
      message: "Tag created successfully",
      data: { id: result.insertId, name: body.name, slug },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getCategories,
  getTags,
  createCategory,
  createTag,
  categorySchema,
  tagSchema,
};
