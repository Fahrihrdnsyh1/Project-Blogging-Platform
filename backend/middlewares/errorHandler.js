function errorHandler(err, req, res, next) {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "Image must be 2MB or smaller",
      errors: [{ field: "image", message: "Maximum file size is 2MB" }],
    });
  }

  if (err.statusCode && err.errors) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  console.error(err);

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: [],
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    errors: [{ field: "server", message: "Unexpected server error" }],
  });
}

module.exports = errorHandler;
