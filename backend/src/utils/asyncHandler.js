/**
 * Wraps an async Express route handler so that any rejected promise
 * is forwarded to next(), letting the centralized error middleware
 * handle it instead of requiring try/catch in every controller.
 *
 * @param {Function} requestHandler
 * @returns {Function}
 */
const asyncHandler = (requestHandler) => (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).catch(next);
};

module.exports = asyncHandler;
