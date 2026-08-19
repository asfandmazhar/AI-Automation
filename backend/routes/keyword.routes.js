import express from "express";
import { researchKeyword, analyzeKeywords } from "../controllers/keyword.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/research", verifyJWT, researchKeyword);
router.post("/ai-analyze", verifyJWT, analyzeKeywords);

export default router;
