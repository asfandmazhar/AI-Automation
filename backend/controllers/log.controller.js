import LogModel from "../Schema/Log.js";

export const getAllLogs = async (req, res) => {
  try {
    let { page = 1, category, status, query, period } = req.query;
    page = parseInt(page);
    const maxLimit = 20;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;

    if (period && period !== "all") {
      const now = new Date();
      let startDate;
      if (period === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === "week") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      if (startDate) filter.createdAt = { $gte: startDate };
    }

    if (query && query.trim()) {
      filter.$or = [
        { action: { $regex: query, $options: "i" } },
        { details: { $regex: query, $options: "i" } },
      ];
    }

    const total = await LogModel.countDocuments(filter);
    const logs = await LogModel.find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "fullname email profilePicture role status",
        populate: { path: "role", select: "name" },
      })
      .skip((page - 1) * maxLimit)
      .limit(maxLimit);

    return res.status(200).json({
      success: true,
      logs,
      total,
      pages: Math.ceil(total / maxLimit),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLogStats = async (req, res) => {
  try {
    const total = await LogModel.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await LogModel.countDocuments({ createdAt: { $gte: today } });
    const failedCount = await LogModel.countDocuments({ status: "failed" });

    const [byCategory, activeUsers] = await Promise.all([
      LogModel.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      LogModel.aggregate([
        { $match: { user: { $ne: null } } },
        { $group: { _id: "$user", count: { $sum: 1 }, lastAction: { $max: "$createdAt" } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            count: 1,
            lastAction: 1,
            name: { $ifNull: ["$userInfo.fullname", "Unknown"] },
            email: { $ifNull: ["$userInfo.email", ""] },
            profilePicture: { $ifNull: ["$userInfo.profilePicture", ""] },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      stats: { total, todayCount, failedCount, byCategory, activeUsers },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const clearLogs = async (req, res) => {
  try {
    await LogModel.deleteMany({});
    return res.status(200).json({ success: true, message: "All logs cleared!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
