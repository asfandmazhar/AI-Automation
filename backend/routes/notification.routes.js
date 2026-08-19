import express from "express";
import { getPreferences, updatePreferences } from "../controllers/notification.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/preferences", verifyJWT, getPreferences);
router.post("/preferences", verifyJWT, updatePreferences);

export default router;
