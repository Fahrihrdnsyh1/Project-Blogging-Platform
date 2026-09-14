function validateRequest(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const formattedErrors = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: formattedErrors,
      });
    }

    req.body = result.data;
    return next();
  };
}

module.exports = validateRequest;
