import express from "express";
import {
  createWebsite,
  getAllWebsites,
  getTotalWebsites,
  getWebsiteDetails,
  updateWebsite,
  deleteWebsite,
  getGscAuthUrl,
  handleGscCallback,
  disconnectGsc,
  getGscStatus,
  getGscProperties,
  selectGscProperty,
  getGscAnalytics,
  getGscQueries,
  getGscPages,
  getGscCountries,
  getGscDevices,
  getGscUrlInspection,
  getGscSitemaps,
  getGaAuthUrl,
  handleGaCallback,
  disconnectGa,
  getGaStatus,
  getGaProperties,
  selectGaProperty,
  getGaAnalytics,
} from "../controllers/website.controller.js";
import { verifyJWT, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/get-all", verifyJWT, getAllWebsites);
router.get("/details", verifyJWT, getWebsiteDetails);
router.get("/total", verifyJWT, isAdmin, getTotalWebsites);
router.post("/create", verifyJWT, isAdmin, createWebsite);
router.post("/update", verifyJWT, isAdmin, updateWebsite);
router.delete("/delete", verifyJWT, isAdmin, deleteWebsite);

// Google Search Console OAuth (admin)
router.get("/gsc/auth-url", verifyJWT, isAdmin, getGscAuthUrl);
router.get("/gsc/callback", handleGscCallback);
router.get("/gsc/status", verifyJWT, isAdmin, getGscStatus);
router.get("/gsc/properties", verifyJWT, isAdmin, getGscProperties);
router.post("/gsc/select-property", verifyJWT, isAdmin, selectGscProperty);
router.post("/gsc/disconnect", verifyJWT, isAdmin, disconnectGsc);

// Google Search Console data (ownership checked inline)
router.get("/gsc/analytics", verifyJWT, getGscAnalytics);
router.get("/gsc/queries", verifyJWT, getGscQueries);
router.get("/gsc/pages", verifyJWT, getGscPages);
router.get("/gsc/countries", verifyJWT, getGscCountries);
router.get("/gsc/devices", verifyJWT, getGscDevices);
router.get("/gsc/url-inspection", verifyJWT, getGscUrlInspection);
router.get("/gsc/sitemaps", verifyJWT, getGscSitemaps);

// Google Analytics GA4 OAuth (admin)
router.get("/ga/auth-url", verifyJWT, isAdmin, getGaAuthUrl);
router.get("/ga/callback", handleGaCallback);
router.get("/ga/status", verifyJWT, isAdmin, getGaStatus);
router.get("/ga/properties", verifyJWT, isAdmin, getGaProperties);
router.post("/ga/select-property", verifyJWT, isAdmin, selectGaProperty);
router.post("/ga/disconnect", verifyJWT, isAdmin, disconnectGa);

// Google Analytics GA4 data (ownership checked inline)
router.get("/ga/analytics", verifyJWT, getGaAnalytics);

export default router;
