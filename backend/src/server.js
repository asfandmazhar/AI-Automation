const app = require("./app");
const env = require("./config/env");
const connectDB = require("./config/db");
const logger = require("./utils/logger");

let server;

const startServer = async () => {
  // Connect to MongoDB in the background — do not block server startup on it.
  // db.js is designed to log and degrade gracefully if MongoDB is unreachable.
  connectDB();

  server = app.listen(env.port, () => {
    logger.info(`Server running in ${env.nodeEnv} mode on http://localhost:${env.port}`);
  });
};

// Fail loudly on programming errors instead of running in a corrupted state
process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  if (server) server.close(() => process.exit(0));
});

startServer();
