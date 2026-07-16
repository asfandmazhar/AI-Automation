const mongoose = require("mongoose");
const Greeting = require("../models/greeting.model");
const logger = require("../utils/logger");

const DEFAULT_MESSAGE = "Hello, World!";

/**
 * Returns a greeting message.
 * If MongoDB is connected, it fetches (and lazily seeds) a Greeting
 * document. If the DB is unavailable, it gracefully falls back to a
 * static default so the endpoint remains resilient.
 */
const getGreeting = async () => {
  const isDbConnected = mongoose.connection.readyState === 1;

  if (!isDbConnected) {
    logger.warn("DB not connected — serving default greeting");
    return { message: DEFAULT_MESSAGE, source: "default" };
  }

  let greeting = await Greeting.findOne().sort({ createdAt: 1 });

  if (!greeting) {
    greeting = await Greeting.create({ message: DEFAULT_MESSAGE });
    logger.info("Seeded default greeting document");
  }

  return { message: greeting.message, source: "database" };
};

module.exports = {
  getGreeting,
};
