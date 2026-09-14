const { z } = require("zod");
const db = require("../config/database");

const postSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().trim().min(1, "Content is required"),
  category_id: z.coerce
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .or(z.literal("")),
  tags: z.array(z.coerce.number().int().positive()).optional().default([]),
  featured_image: z.string().trim().nullable().optional(),
  status: z.enum(["draft", "published"]).optional().default("draft"),
});

const updatePostSchema = postSchema.partial();

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function getPosts(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const categorySlug = req.query.category ? String(req.query.category) : null;
    const tagSlug = req.query.tag ? String(req.query.tag) : null;
    const search = req.query.search ? String(req.query.search).trim() : null;

    let baseQuery = `
      SELECT DISTINCT p.*, c.name AS category_name, c.slug AS category_slug
      FROM posts p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN post_tags pt ON pt.post_id = p.id
      LEFT JOIN tags t ON t.id = pt.tag_id
      WHERE p.status = 'published'
    `;
    const values = [];

    if (categorySlug) {
      baseQuery += " AND c.slug = ?";
      values.push(categorySlug);
    }

    if (tagSlug) {
      baseQuery += " AND t.slug = ?";
      values.push(tagSlug);
    }

    if (search) {
      baseQuery += " AND (p.title LIKE ? OR p.content LIKE ?)";
      values.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await db.execute(
      `SELECT COUNT(DISTINCT p.id) AS totalItems ${baseQuery.replace(/SELECT DISTINCT p\.\*, c\.name AS category_name, c\.slug AS category_slug\s+FROM/i, "FROM")}`,
      values,
    );
    const totalItems = Number(countRows[0]?.totalItems || 0);

    const query = `${baseQuery} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    const allValues = [...values, limit, offset];
    const [rows] = await db.execute(query, allValues);

    const posts = await Promise.all(
      rows.map(async (post) => {
        const [tagRows] = await db.execute(
          "SELECT t.id, t.name, t.slug FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = ?",
          [post.id],
        );

        return {
          ...post,
          tags: tagRows,
        };
      }),
    );

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        currentPage: page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getMyPosts(req, res, next) {
  try {
    const [rows] = await db.execute(
      `
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM posts p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
      `,
      [req.user.id],
    );

    const posts = await Promise.all(
      rows.map(async (post) => {
        const [tagRows] = await db.execute(
          "SELECT t.id, t.name, t.slug FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = ?",
          [post.id],
        );

        return {
          ...post,
          tags: tagRows,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    return next(error);
  }
}

async function getPostBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const isNumericId = /^\d+$/.test(String(slug));

    const [rows] = await db.execute(
      isNumericId
        ? `
            SELECT p.*, c.name AS category_name, c.slug AS category_slug
            FROM posts p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.id = ?
          `
        : `
            SELECT p.*, c.name AS category_name, c.slug AS category_slug
            FROM posts p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.slug = ?
          `,
      isNumericId ? [Number(slug)] : [slug],
    );

    if (!rows[0]) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
        errors: [
          {
            field: isNumericId ? "id" : "slug",
            message: "Post with this identifier does not exist",
          },
        ],
      });
    }

    const post = rows[0];
    const [tagRows] = await db.execute(
      "SELECT t.id, t.name, t.slug FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = ?",
      [post.id],
    );

    post.tags = tagRows;

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    return next(error);
  }
}

async function createPost(req, res, next) {
  try {
    const validated = postSchema.parse(req.body);

    const title = validated.title.trim();
    const baseSlug = slugify(title) || "untitled-post";
    const slug = `${baseSlug}-${Date.now()}`;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const [result] = await connection.execute(
        `
          INSERT INTO posts (user_id, category_id, title, slug, content, featured_image, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          req.user.id,
          validated.category_id || null,
          title,
          slug,
          validated.content,
          validated.featured_image || null,
          validated.status || "draft",
        ],
      );

      const postId = result.insertId;

      if (validated.tags && validated.tags.length > 0) {
        const tagEntries = validated.tags.map((tagId) => [postId, tagId]);
        await connection.query(
          "INSERT INTO post_tags (post_id, tag_id) VALUES ?",
          [tagEntries],
        );
      }

      await connection.commit();

      const [created] = await connection.execute(
        "SELECT * FROM posts WHERE id = ?",
        [postId],
      );

      return res.status(201).json({
        success: true,
        message: "Post created successfully",
        data: created[0],
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    return next(error);
  }
}

async function updatePost(req, res, next) {
  try {
    const postId = Number(req.params.id);
    const [rows] = await db.execute("SELECT * FROM posts WHERE id = ?", [
      postId,
    ]);

    if (!rows[0]) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
        errors: [{ field: "id", message: "Post does not exist" }],
      });
    }

    const post = rows[0];
    const isAdmin = req.user.role === "admin";
    if (!isAdmin && post.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
        errors: [
          { field: "owner", message: "You can only update your own posts" },
        ],
      });
    }

    const validated = updatePostSchema.parse(req.body);
    const updates = [];
    const values = [];

    if (validated.title !== undefined) updates.push("title = ?");
    values.push(validated.title.trim());
    if (validated.content !== undefined) updates.push("content = ?");
    values.push(validated.content.trim());
    if (validated.category_id !== undefined) updates.push("category_id = ?");
    values.push(validated.category_id || null);
    if (validated.featured_image !== undefined)
      updates.push("featured_image = ?");
    values.push(validated.featured_image || null);
    if (validated.status !== undefined) updates.push("status = ?");
    values.push(validated.status);

    if (updates.length > 0) {
      values.push(postId);
      await db.execute(
        `UPDATE posts SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );
    }

    if (validated.tags !== undefined) {
      await db.execute("DELETE FROM post_tags WHERE post_id = ?", [postId]);
      if (validated.tags.length > 0) {
        const tagRows = validated.tags.map((tagId) => [postId, tagId]);
        await db.query("INSERT INTO post_tags (post_id, tag_id) VALUES ?", [
          tagRows,
        ]);
      }
    }

    const [updated] = await db.execute("SELECT * FROM posts WHERE id = ?", [
      postId,
    ]);

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: updated[0],
    });
  } catch (error) {
    return next(error);
  }
}

async function deletePost(req, res, next) {
  try {
    const postId = Number(req.params.id);
    const [rows] = await db.execute("SELECT * FROM posts WHERE id = ?", [
      postId,
    ]);

    if (!rows[0]) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
        errors: [{ field: "id", message: "Post does not exist" }],
      });
    }

    const post = rows[0];
    const isAdmin = req.user.role === "admin";
    if (!isAdmin && post.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
        errors: [
          { field: "owner", message: "You can only delete your own posts" },
        ],
      });
    }

    await db.execute("DELETE FROM posts WHERE id = ?", [postId]);

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      data: { id: postId },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getPosts,
  getMyPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  postSchema,
  updatePostSchema,
};
