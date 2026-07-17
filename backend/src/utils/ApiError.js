/**
 * Custom error class for predictable, operational errors
 * (bad input, not found, unauthorized, etc.) as opposed to
 * unexpected programming errors/bugs.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable error message
   * @param {any[]} [errors] - Optional array of granular error details
   */
  constructor(statusCode, message = "Something went wrong", errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad Request", errors = []) {
    return new ApiError(400, message, errors);
  }

  static notFound(message = "Resource Not Found") {
    return new ApiError(404, message);
  }

  static internal(message = "Internal Server Error") {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
