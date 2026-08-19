import express from "express";
import {
  Signin,
  googleSignin,
  getProfile,
  updateProfile,
  updateProfilePicture,
  changePassword,
  getAllUsers,
  getTotalUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleStatus,
  impersonateUser,
} from "../controllers/auth.controller.js";
import { verifyJWT, isAdmin } from "../middleware/auth.middleware.js";
import { upload } from "../helper/cloudinary.js";

const router = express.Router();

// Auth
router.post("/signin", Signin);
router.post("/google", googleSignin);
// Profile (any authenticated user)
router.get("/profile", verifyJWT, getProfile);
router.post("/update-profile", verifyJWT, updateProfile);
router.post("/update-profile-picture", verifyJWT, upload.single("profilePicture"), updateProfilePicture);
router.post("/change-password", verifyJWT, changePassword);
// Admin: manage users (protected)
router.get("/get-all-users", verifyJWT, isAdmin, getAllUsers);
router.get("/total-users", verifyJWT, isAdmin, getTotalUsers);
router.post("/create-user", verifyJWT, isAdmin, createUser);
router.post("/update-user", verifyJWT, isAdmin, updateUser);
router.delete("/delete-user", verifyJWT, isAdmin, deleteUser);
router.post("/toggle-status", verifyJWT, isAdmin, toggleStatus);
router.post("/impersonate", verifyJWT, isAdmin, impersonateUser);

export default router;
