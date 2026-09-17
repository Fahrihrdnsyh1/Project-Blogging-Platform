const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const db = require("../config/database");
const { getJwtSecret } = require("../config/security");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

async function register(req, res, next) {
  try {
    const validated = registerSchema.parse(req.body);

    const [existing] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [validated.email],
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
        errors: [{ field: "email", message: "Email is already registered" }],
      });
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const role = "author";
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [validated.name, validated.email, passwordHash, role],
    );

    const user = {
      id: result.insertId,
      name: validated.name,
      email: validated.email,
      role,
    };

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user },
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const validated = loginSchema.parse(req.body);

    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      validated.email,
    ]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        errors: [{ field: "email", message: "Email or password is incorrect" }],
      });
    }

    const passwordMatches = await bcrypt.compare(
      validated.password,
      user.password_hash,
    );
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        errors: [
          { field: "password", message: "Email or password is incorrect" },
        ],
      });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: safeUser,
        token: generateToken(safeUser),
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login, registerSchema, loginSchema };
