const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const logger = require("../utils/logger");

/**
 * Centralized error-handling middleware. Must be registered last,
 * after all routes. Normalizes both operational (ApiError) and
 * unexpected errors into a consistent JSON response shape.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    error = new ApiError(statusCode, error.message || "Internal Server Error");
  }

  logger.error(`${req.method} ${req.originalUrl} -> ${error.statusCode} ${error.message}`);

  return res.status(error.statusCode).json({
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    ...(env.nodeEnv === "development" ? { stack: err.stack } : {}),
  });
};

module.exports = errorHandler;
