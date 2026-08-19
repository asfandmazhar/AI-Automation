import SecurityModel from "../Schema/Security.js";
import { createLog } from "../helper/log.helper.js";

export const getSettings = async (req, res) => {
  try {
    let settings = await SecurityModel.findOne();

    if (!settings) {
      settings = await SecurityModel.create({});
    }

    return res.status(200).json({
      success: true,
      settings: {
        loginAlerts: settings.loginAlerts,
        sessionTimeout: settings.sessionTimeout,
        forceLogoutAt: settings.forceLogoutAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { loginAlerts, sessionTimeout } = req.body;

    const updateData = {};
    if (loginAlerts !== undefined) updateData.loginAlerts = loginAlerts;
    if (sessionTimeout !== undefined) updateData.sessionTimeout = sessionTimeout;

    let settings = await SecurityModel.findOne();

    if (settings) {
      settings = await SecurityModel.findByIdAndUpdate(settings._id, updateData, { new: true });
    } else {
      settings = await SecurityModel.create(updateData);
    }

    await createLog(req, { user: req.user, action: "Update security settings", category: "security", details: "Updated security settings" });
    return res.status(200).json({
      success: true,
      message: "Security settings updated successfully!",
      settings: {
        loginAlerts: settings.loginAlerts,
        sessionTimeout: settings.sessionTimeout,
        forceLogoutAt: settings.forceLogoutAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const forceLogoutAll = async (req, res) => {
  try {
    let settings = await SecurityModel.findOne();
    const now = new Date();

    if (settings) {
      settings = await SecurityModel.findByIdAndUpdate(settings._id, { forceLogoutAt: now }, { new: true });
    } else {
      settings = await SecurityModel.create({ forceLogoutAt: now });
    }

    await createLog(req, { user: req.user, action: "Force logout all users", category: "security", details: "Forced logout of all users" });
    return res.status(200).json({
      success: true,
      message: "All users have been logged out!",
      forceLogoutAt: now,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
