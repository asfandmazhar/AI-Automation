import express from "express";
import {
  createService,
  getAllServices,
  updateService,
  deleteService,
} from "../controllers/service.controller.js";
import { verifyJWT, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/get-all", verifyJWT, getAllServices);
router.post("/create", verifyJWT, isAdmin, createService);
router.post("/update", verifyJWT, isAdmin, updateService);
router.delete("/delete", verifyJWT, isAdmin, deleteService);

export default router;
