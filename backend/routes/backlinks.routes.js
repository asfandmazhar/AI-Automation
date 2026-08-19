import express from "express";
import { analyzeBacklinks, aiAnalyzeBacklinks } from "../controllers/backlinks.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/analyze", verifyJWT, analyzeBacklinks);
router.post("/ai-analyze", verifyJWT, aiAnalyzeBacklinks);

export default router;
