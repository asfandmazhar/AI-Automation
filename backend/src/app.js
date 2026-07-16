const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const routes = require("./routes");
const requestLogger = require("./middlewares/requestLogger.middleware");
const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/errorHandler.middleware");

const app = express();

// Security & parsing middleware
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Backend is running 🚀" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, status: "ok", uptime: process.uptime() });
});

// API routes (versioned)
app.use("/api/v1", routes);

// 404 + centralized error handling — must be registered last
app.use(notFound);
app.use(errorHandler);

module.exports = app;
