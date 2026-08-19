import express from "express";
import {
  generateContent,
  refineContent,
  analyzeContent,
  humanizeContent,
  generateMetaData,
  getContentHistory,
  getContentById,
  deleteContent,
} from "../controllers/content.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/generate", verifyJWT, generateContent);
router.post("/refine", verifyJWT, refineContent);
router.post("/analyze", verifyJWT, analyzeContent);
router.post("/humanize", verifyJWT, humanizeContent);
router.post("/meta", verifyJWT, generateMetaData);
router.get("/history", verifyJWT, getContentHistory);
router.get("/get", verifyJWT, getContentById);
router.delete("/delete", verifyJWT, deleteContent);

export default router;
