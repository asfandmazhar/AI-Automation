const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const greetingService = require("../services/greeting.service");

/**
 * @route   GET /api/v1/hello
 * @desc    Returns a greeting message
 * @access  Public
 */
const getHello = asyncHandler(async (req, res) => {
  const { message, source } = await greetingService.getGreeting();

  return res
    .status(200)
    .json(new ApiResponse(200, { message, source }, "Greeting fetched successfully"));
});

module.exports = {
  getHello,
};
