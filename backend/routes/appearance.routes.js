import express from "express";
import { getAppearance, updateAppearance, resetAppearance } from "../controllers/appearance.controller.js";
import { verifyJWT, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAppearance);
router.post("/update", verifyJWT, isAdmin, updateAppearance);
router.post("/reset", verifyJWT, isAdmin, resetAppearance);

export default router;
