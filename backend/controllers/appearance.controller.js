import AppearanceModel from "../Schema/Appearance.js";
import { createLog } from "../helper/log.helper.js";

export const getAppearance = async (req, res) => {
  try {
    let appearance = await AppearanceModel.findOne();

    if (!appearance) {
      appearance = await AppearanceModel.create({});
    }

    return res.status(200).json({
      success: true,
      appearance: {
        primary: appearance.primary,
        secondary: appearance.secondary,
        success: appearance.success,
        error: appearance.error,
        warning: appearance.warning,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAppearance = async (req, res) => {
  try {
    const { primary, secondary, success, error, warning } = req.body;

    const updateData = {};
    if (primary !== undefined) updateData.primary = primary;
    if (secondary !== undefined) updateData.secondary = secondary;
    if (success !== undefined) updateData.success = success;
    if (error !== undefined) updateData.error = error;
    if (warning !== undefined) updateData.warning = warning;

    let appearance = await AppearanceModel.findOne();

    if (appearance) {
      appearance = await AppearanceModel.findByIdAndUpdate(appearance._id, updateData, { new: true });
    } else {
      appearance = await AppearanceModel.create(updateData);
    }

    await createLog(req, { user: req.user, action: "Update appearance", category: "appearance", details: "Updated appearance settings" });
    return res.status(200).json({
      success: true,
      message: "Appearance updated successfully!",
      appearance: {
        primary: appearance.primary,
        secondary: appearance.secondary,
        success: appearance.success,
        error: appearance.error,
        warning: appearance.warning,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resetAppearance = async (req, res) => {
  try {
    let appearance = await AppearanceModel.findOne();

    if (appearance) {
      appearance = await AppearanceModel.findByIdAndUpdate(
        appearance._id,
        { primary: "", secondary: "", success: "", error: "", warning: "" },
        { new: true },
      );
    }

    await createLog(req, { user: req.user, action: "Reset appearance", category: "appearance", details: "Reset appearance to defaults" });
    return res.status(200).json({
      success: true,
      message: "Appearance reset to defaults!",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
