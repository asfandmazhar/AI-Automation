import NotificationPreference from "../Schema/NotificationPreference.js";

export const getPreferences = async (req, res) => {
  try {
    let prefs = await NotificationPreference.findOne({ user: req.user });

    if (!prefs) {
      prefs = await NotificationPreference.create({ user: req.user });
    }

    return res.status(200).json({
      success: true,
      preferences: {
        email: prefs.email,
        apiAlerts: prefs.apiAlerts,
        weeklyReport: prefs.weeklyReport,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const { email, apiAlerts, weeklyReport } = req.body;

    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (apiAlerts !== undefined) updateData.apiAlerts = apiAlerts;
    if (weeklyReport !== undefined) updateData.weeklyReport = weeklyReport;

    const prefs = await NotificationPreference.findOneAndUpdate(
      { user: req.user },
      updateData,
      { new: true, upsert: true },
    );

    return res.status(200).json({
      success: true,
      message: "Preferences updated successfully!",
      preferences: {
        email: prefs.email,
        apiAlerts: prefs.apiAlerts,
        weeklyReport: prefs.weeklyReport,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
