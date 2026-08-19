import express from "express";
import {
  createRole,
  getAllRoles,
  updateRole,
  deleteRole,
} from "../controllers/role.controller.js";
import { verifyJWT, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/get-all", verifyJWT, getAllRoles);
router.post("/create", verifyJWT, isAdmin, createRole);
router.post("/update", verifyJWT, isAdmin, updateRole);
router.delete("/delete", verifyJWT, isAdmin, deleteRole);

export default router;
