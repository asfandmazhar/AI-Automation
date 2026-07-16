const express = require("express");
const greetingRoutes = require("./greeting.routes");

const router = express.Router();

/**
 * Mount all feature routers here. Keeps app.js clean and makes
 * the full API surface discoverable from one file.
 */
router.use("/hello", greetingRoutes);

module.exports = router;
