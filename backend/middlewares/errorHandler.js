function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.statusCode && err.errors) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

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
