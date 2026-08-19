import express from "express";
import { getAllLogs, getLogStats, clearLogs } from "../controllers/log.controller.js";
import { verifyJWT, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/get-all", verifyJWT, isAdmin, getAllLogs);
router.get("/stats", verifyJWT, isAdmin, getLogStats);
router.delete("/clear", verifyJWT, isAdmin, clearLogs);

export default router;
