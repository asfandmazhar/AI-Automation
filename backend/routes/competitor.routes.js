import express from "express";
import { analyzeCompetitors, aiAnalyzeCompetitors } from "../controllers/competitor.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/analyze", verifyJWT, analyzeCompetitors);
router.post("/ai-analyze", verifyJWT, aiAnalyzeCompetitors);

export default router;
