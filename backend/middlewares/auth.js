const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
      errors: [{ field: "authorization", message: "Bearer token is required" }],
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key-here",
    );

    req.user = {
      id: decoded.id,
      role: decoded.role || "reader",
      email: decoded.email,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      errors: [{ field: "token", message: error.message }],
    });
  }
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        errors: [{ field: "user", message: "User not authenticated" }],
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
        errors: [
          { field: "role", message: `Role ${req.user.role} is not allowed` },
        ],
      });
    }

    return next();
  };
}

module.exports = { authenticateToken, requireRole };
