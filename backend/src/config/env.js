require("dotenv").config({ quiet: true });

/**
 * Centralized environment configuration.
 * Import this instead of using `process.env` directly throughout the app,
 * so there is a single source of truth and fail-fast validation.
 */
const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hello_world_db",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
};

const requiredInProduction = ["mongodbUri"];

if (env.nodeEnv === "production") {
  const missing = requiredInProduction.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missing.join(", ")}`
    );
  }
}

module.exports = env;
