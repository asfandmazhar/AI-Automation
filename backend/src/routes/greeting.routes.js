const express = require("express");
const { getHello } = require("../controllers/greeting.controller");

const router = express.Router();

router.get("/", getHello);

module.exports = router;
