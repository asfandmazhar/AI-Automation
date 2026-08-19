import express from "express";
import { getSettings, updateSettings, forceLogoutAll } from "../controllers/security.controller.js";
import { verifyJWT, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", verifyJWT, getSettings);
router.post("/update", verifyJWT, isAdmin, updateSettings);
router.post("/force-logout", verifyJWT, isAdmin, forceLogoutAll);

export default router;
