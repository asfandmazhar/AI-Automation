const mongoose = require("mongoose");
const env = require("./env");
const logger = require("../utils/logger");

mongoose.set("strictQuery", true);

/**
 * Establishes the MongoDB connection.
 * Intentionally does not crash the process on failure for this demo app —
 * the API stays up and serves non-DB routes even if MongoDB is unreachable.
 * In a real production service you likely want to fail fast instead.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
  }
};

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

module.exports = connectDB;
