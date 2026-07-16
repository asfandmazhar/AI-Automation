/* eslint-disable no-console */
const env = require("../config/env");

const timestamp = () => new Date().toISOString();

const logger = {
  info: (message) => console.log(`[INFO]  ${timestamp()} - ${message}`),
  warn: (message) => console.warn(`[WARN]  ${timestamp()} - ${message}`),
  error: (message) => console.error(`[ERROR] ${timestamp()} - ${message}`),
  debug: (message) => {
    if (env.nodeEnv !== "production") {
      console.debug(`[DEBUG] ${timestamp()} - ${message}`);
    }
  },
};

module.exports = logger;
