const { z } = require("zod");
const db = require("../config/database");

const createCommentSchema = z.object({
  post_id: z.coerce.number().int().positive("Post id is required"),
  content: z.string().trim().min(1, "Comment content is required"),
  parent_id: z.coerce
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .or(z.literal("")),
});

const updateCommentSchema = z.object({
  content: z.string().trim().min(1, "Comment content is required"),
});

function buildNestedComments(rows) {
  const map = new Map();
  const roots = [];

  rows.forEach((row) => {
    map.set(row.id, { ...row, children: [] });
  });

  rows.forEach((row) => {
    const comment = map.get(row.id);
    if (row.parent_id && map.has(row.parent_id)) {
      map.get(row.parent_id).children.push(comment);
    } else {
      roots.push(comment);
    }
  });

  return roots;
}

async function getCommentsByPost(req, res, next) {
  try {
    const postId = Number(req.params.postId);

    const [rows] = await db.execute(
      `
        SELECT c.*, u.name AS user_name
        FROM comments c
        JOIN users u ON u.id = c.user_id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
      `,
      [postId],
    );

    return res.status(200).json({
      success: true,
      data: buildNestedComments(rows),
    });
  } catch (error) {
    return next(error);
  }
}

async function createComment(req, res, next) {
  try {
    const validated = createCommentSchema.parse(req.body);

    if (validated.parent_id) {
      const [parentRows] = await db.execute(
        "SELECT id, post_id FROM comments WHERE id = ?",
        [validated.parent_id],
      );
      if (!parentRows[0]) {
        return res.status(400).json({
          success: false,
          message: "Invalid parent comment",
          errors: [
            { field: "parent_id", message: "Parent comment does not exist" },
          ],
        });
      }

      if (parentRows[0].post_id !== validated.post_id) {
        return res.status(400).json({
          success: false,
          message: "Invalid parent comment",
          errors: [
            {
              field: "parent_id",
              message: "Parent comment does not belong to this post",
            },
          ],
        });
      }
    }

    const [result] = await db.execute(
      "INSERT INTO comments (post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)",
      [
        validated.post_id,
        req.user.id,
        validated.parent_id || null,
        validated.content,
      ],
    );

    const [rows] = await db.execute("SELECT * FROM comments WHERE id = ?", [
      result.insertId,
    ]);

    return res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: rows[0],
    });
  } catch (error) {
    return next(error);
  }
}

async function updateComment(req, res, next) {
  try {
    const commentId = Number(req.params.id);
    const [rows] = await db.execute("SELECT * FROM comments WHERE id = ?", [
      commentId,
    ]);

    if (!rows[0]) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
        errors: [{ field: "id", message: "Comment does not exist" }],
      });
    }

    const comment = rows[0];
    if (req.user.role !== "admin" && comment.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
        errors: [
          { field: "owner", message: "You can only update your own comments" },
        ],
      });
    }

    const validated = updateCommentSchema.parse(req.body);
    await db.execute("UPDATE comments SET content = ? WHERE id = ?", [
      validated.content,
      commentId,
    ]);

    const [updatedRows] = await db.execute(
      "SELECT * FROM comments WHERE id = ?",
      [commentId],
    );

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: updatedRows[0],
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteComment(req, res, next) {
  try {
    const commentId = Number(req.params.id);
    const [rows] = await db.execute("SELECT * FROM comments WHERE id = ?", [
      commentId,
    ]);

    if (!rows[0]) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
        errors: [{ field: "id", message: "Comment does not exist" }],
      });
    }

    const comment = rows[0];
    if (req.user.role !== "admin" && comment.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
        errors: [
          { field: "owner", message: "You can only delete your own comments" },
        ],
      });
    }

    await db.execute("DELETE FROM comments WHERE id = ?", [commentId]);

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      data: { id: commentId },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getCommentsByPost,
  createComment,
  updateComment,
  deleteComment,
  createCommentSchema,
  updateCommentSchema,
};
