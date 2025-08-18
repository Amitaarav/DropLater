export function errorHandler(err, req, res, next) {
  console.error("Error:", err);

  // Default values
  let status = err.status || 500;
  let message = err.message || "Internal server error";
  let details = [];

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    status = 400;
    message = "Validation failed";
    details = err.errors.map(e => ({
      path: e.path.join("."),
      message: e.message,
    }));
  }

  // Handle MongoDB duplicate key (11000)
  if (err.code === 11000) {
    status = 400;
    message = "Duplicate value";
    details = [err.keyValue];
  }

  // Rate limiter errors
  if (err.name === "RateLimitError") {
    status = 429;
    message = "Too many requests, please try again later";
  }

  res.status(status).json({
    error: message,
    ...(details.length > 0 ? { details } : {}),
  });
}
