import express from "express";
import {
  createApiKey,
  getAllApiKeys,
  updateApiKey,
  deleteApiKey,
  getOpenAIUsage,
  getDataForSEOUsage,
  getAIUsageStats,
} from "../controllers/apikey.controller.js";
import { verifyJWT, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/get-all", verifyJWT, isAdmin, getAllApiKeys);
router.get("/openai-usage", verifyJWT, isAdmin, getOpenAIUsage);
router.get("/dataforseo-usage", verifyJWT, isAdmin, getDataForSEOUsage);
router.get("/ai-usage-stats", verifyJWT, isAdmin, getAIUsageStats);
router.post("/create", verifyJWT, isAdmin, createApiKey);
router.post("/update", verifyJWT, isAdmin, updateApiKey);
router.delete("/delete", verifyJWT, isAdmin, deleteApiKey);

export default router;
