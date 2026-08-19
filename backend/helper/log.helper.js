import LogModel from "../Schema/Log.js";

export const createLog = async (req, { user, action, category, details, status = "success" }) => {
  try {
    await LogModel.create({
      user: user || null,
      action,
      category,
      details: details || "",
      ip: req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
      status,
    });
  } catch {}
};
