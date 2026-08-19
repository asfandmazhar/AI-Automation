import ApiKeyModel from "../Schema/ApiKey.js";
import AIUsageModel from "../Schema/AIUsage.js";
import { createLog } from "../helper/log.helper.js";

export const createApiKey = async (req, res) => {
  try {
    const { provider, key } = req.body;

    if (!provider || !key || !key.trim()) {
      return res.send({
        success: false,
        message: "Provider and API key are required!",
      });
    }

    const existing = await ApiKeyModel.findOne({ provider });
    if (existing) {
      return res.send({
        success: false,
        message: `${provider} API key already exists!`,
      });
    }

    const apiKey = new ApiKeyModel({ provider, key: key.trim() });
    await apiKey.save();

    await createLog(req, {
      user: req.user,
      action: "Create API key",
      category: "api-key",
      details: `Created ${provider} API key`,
    });
    return res
      .status(200)
      .json({ success: true, message: "API key saved successfully!", apiKey });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllApiKeys = async (req, res) => {
  try {
    const apiKeys = await ApiKeyModel.find().sort({ createdAt: 1 });
    return res.status(200).json({ success: true, apiKeys });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateApiKey = async (req, res) => {
  try {
    const { _id, key, status } = req.body;

    if (!_id) {
      return res.send({ success: false, message: "API key ID is required!" });
    }

    const updateData = {};
    if (key !== undefined) updateData.key = key.trim();
    if (status !== undefined) updateData.status = status;

    const apiKey = await ApiKeyModel.findByIdAndUpdate(_id, updateData, {
      new: true,
    });

    if (!apiKey) {
      return res.send({ success: false, message: "API key not found!" });
    }

    await createLog(req, {
      user: req.user,
      action: "Update API key",
      category: "api-key",
      details: `Updated ${apiKey.provider} API key`,
    });
    return res
      .status(200)
      .json({
        success: true,
        message: "API key updated successfully!",
        apiKey,
      });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

async function fetchAllPages(url, headers) {
  const results = [];
  let nextPage = url;
  while (nextPage) {
    const res = await fetch(nextPage, { headers });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.data) results.push(...json.data);
    nextPage = json.has_more && json.next_page ? json.next_page : null;
  }
  return results;
}

export const getOpenAIUsage = async (req, res) => {
  try {
    const apiKey = await ApiKeyModel.findOne({
      provider: "openai",
      status: "Active",
    });
    if (!apiKey) {
      return res.send({
        success: false,
        message: "No active OpenAI API key found!",
      });
    }

    const headers = {
      Authorization: `Bearer ${apiKey.key}`,
      "Content-Type": "application/json",
    };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startTime = Math.floor(startOfMonth.getTime() / 1000);
    const endTime = Math.floor(now.getTime() / 1000);

    let completionsData = null;
    let costsData = null;
    let models = null;
    let subscription = null;

    const [completionsResult, costsResult, modelsResult, subResult] =
      await Promise.allSettled([
        fetchAllPages(
          `https://api.openai.com/v1/organization/usage/completions?start_time=${startTime}&end_time=${endTime}&bucket_width=1d&limit=31`,
          headers,
        ),
        fetchAllPages(
          `https://api.openai.com/v1/organization/costs?start_time=${startTime}&end_time=${endTime}&bucket_width=1d&limit=31`,
          headers,
        ),
        fetch("https://api.openai.com/v1/models", { headers }).then((r) =>
          r.ok ? r.json() : null,
        ),
        fetch("https://api.openai.com/v1/dashboard/billing/subscription", {
          headers,
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);

    if (completionsResult.status === "fulfilled")
      completionsData = completionsResult.value;
    if (costsResult.status === "fulfilled") costsData = costsResult.value;
    if (modelsResult.status === "fulfilled" && modelsResult.value)
      models = modelsResult.value.data || [];
    if (subResult.status === "fulfilled") subscription = subResult.value;

    let totalTokens = 0;
    let totalRequests = 0;
    const modelBreakdown = {};

    if (completionsData) {
      for (const bucket of completionsData) {
        for (const r of bucket.results || []) {
          const name = r.model || "Unknown";
          const tokens = (r.input_tokens || 0) + (r.output_tokens || 0);
          const requests = r.num_model_requests || 0;
          if (!modelBreakdown[name]) {
            modelBreakdown[name] = { tokens: 0, cost: 0, requests: 0 };
          }
          modelBreakdown[name].tokens += tokens;
          modelBreakdown[name].requests += requests;
          totalTokens += tokens;
          totalRequests += requests;
        }
      }
    }

    let totalUsage = 0;
    const dailySpend = [];
    const dailyCostMap = {};

    if (costsData) {
      for (const bucket of costsData) {
        const date = bucket.start_time
          ? new Date(bucket.start_time * 1000).toISOString().split("T")[0]
          : "";
        let dayCost = 0;
        for (const r of bucket.results || []) {
          const amount = r.amount?.value || 0;
          dayCost += amount;
          if (r.line_item) {
            const name = r.line_item.name || "Unknown";
            if (modelBreakdown[name]) {
              modelBreakdown[name].cost += amount;
            }
          }
        }
        totalUsage += dayCost;
        if (date) {
          if (!dailyCostMap[date]) dailyCostMap[date] = 0;
          dailyCostMap[date] += dayCost;
        }
      }

      const sortedDates = Object.keys(dailyCostMap).sort();
      for (const date of sortedDates) {
        dailySpend.push({
          date,
          cost: Math.round(dailyCostMap[date] * 10000) / 10000,
        });
      }
    }

    let localUsage = null;
    if (totalTokens === 0 && totalRequests === 0) {
      const [localStats, localDaily, localActions, allTimeStats] =
        await Promise.all([
          AIUsageModel.aggregate([
            { $match: { createdAt: { $gte: startOfMonth } } },
            {
              $group: {
                _id: "$model",
                totalTokens: { $sum: "$totalTokens" },
                promptTokens: { $sum: "$promptTokens" },
                completionTokens: { $sum: "$completionTokens" },
                requests: { $sum: 1 },
              },
            },
          ]),
          AIUsageModel.aggregate([
            { $match: { createdAt: { $gte: startOfMonth } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                tokens: { $sum: "$totalTokens" },
                requests: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ]),
          AIUsageModel.aggregate([
            { $match: { createdAt: { $gte: startOfMonth } } },
            {
              $group: {
                _id: "$action",
                count: { $sum: 1 },
                tokens: { $sum: "$totalTokens" },
              },
            },
          ]),
          AIUsageModel.aggregate([
            {
              $group: {
                _id: null,
                totalTokens: { $sum: "$totalTokens" },
                promptTokens: { $sum: "$promptTokens" },
                completionTokens: { $sum: "$completionTokens" },
                requests: { $sum: 1 },
                firstUsed: { $min: "$createdAt" },
              },
            },
          ]),
        ]);

      for (const row of localStats) {
        const name = row._id || "gpt-4o-mini";
        modelBreakdown[name] = {
          tokens: row.totalTokens,
          cost: 0,
          requests: row.requests,
        };
        totalTokens += row.totalTokens;
        totalRequests += row.requests;
      }

      for (const day of localDaily) {
        dailySpend.push({ date: day._id, cost: day.tokens / 1000000 });
      }

      const actionMap = {};
      for (const a of localActions) {
        actionMap[a._id] = { count: a.count, tokens: a.tokens };
      }

      localUsage = {
        source: "local",
        actions: actionMap,
        allTime: allTimeStats[0] || null,
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        keyMasked: `${apiKey.key.slice(0, 7)}****${apiKey.key.slice(-4)}`,
        accountName: subscription?.account_name || null,
        plan: subscription?.plan?.title || null,
        hardLimit: subscription?.hard_limit_usd || null,
        softLimit: subscription?.soft_limit_usd || null,
        hasPaymentMethod: subscription?.has_payment_method ?? null,
        localUsage,
        totalUsage: Math.round(totalUsage * 10000) / 10000,
        totalTokens,
        totalRequests,
        totalModels: models?.length || 0,
        modelBreakdown,
        dailySpend,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDataForSEOUsage = async (req, res) => {
  try {
    const apiKey = await ApiKeyModel.findOne({
      provider: "dataforseo",
      status: "Active",
    });
    if (!apiKey) {
      return res.send({
        success: false,
        message: "No active DataForSEO API key found!",
      });
    }

    const colonIdx = apiKey.key.indexOf(":");
    if (colonIdx === -1) {
      return res.send({
        success: false,
        message: "Invalid key format. Expected login:password",
      });
    }
    const login = apiKey.key.slice(0, colonIdx);
    const password = apiKey.key.slice(colonIdx + 1);
    const authHeader =
      "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
    const headers = {
      Authorization: authHeader,
      "Content-Type": "application/json",
    };

    let userData = null;

    try {
      const userRes = await fetch(
        "https://api.dataforseo.com/v3/appendix/user_data",
        {
          method: "GET",
          headers,
        },
      );
      const userJson = await userRes.json();
      if (
        userJson?.status_code === 20000 &&
        userJson?.tasks?.[0]?.result?.[0]
      ) {
        userData = userJson.tasks[0].result[0];
      } else {
        console.error(
          "DataForSEO user_data failed:",
          userRes.status,
          userJson?.status_message || "Unknown error",
        );
        return res.send({
          success: false,
          message:
            userJson?.status_message ||
            "Failed to fetch DataForSEO account data",
        });
      }
    } catch (err) {
      console.error("DataForSEO user_data error:", err.message);
      return res.send({
        success: false,
        message: "Could not connect to DataForSEO API",
      });
    }

    const money = userData.money || {};
    const totalCredits = money.total ?? 0;
    const balance = money.balance ?? 0;
    const totalSpent = totalCredits - balance;

    const seoActions = [
      "keyword-analysis",
      "competitor-analysis",
      "backlink-analysis",
    ];
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );

    const [seoByAction, seoDaily] = await Promise.all([
      AIUsageModel.aggregate([
        {
          $match: {
            action: { $in: seoActions },
            createdAt: { $gte: monthStart },
          },
        },
        { $group: { _id: "$action", requests: { $sum: 1 } } },
      ]),
      AIUsageModel.aggregate([
        {
          $match: {
            action: { $in: seoActions },
            createdAt: { $gte: monthStart },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            requests: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const labelMap = {
      "keyword-analysis": "Keyword Research",
      "competitor-analysis": "Competitor Analysis",
      "backlink-analysis": "Backlink Analysis",
    };
    const endpointBreakdown = {};
    let totalSeoRequests = 0;
    for (const row of seoByAction) {
      endpointBreakdown[labelMap[row._id] || row._id] = {
        requests: row.requests,
        cost: 0,
      };
      totalSeoRequests += row.requests;
    }
    const dailySpend = seoDaily.map((d) => ({
      date: d._id,
      cost: 0,
      requests: d.requests,
    }));

    return res.status(200).json({
      success: true,
      data: {
        keyMasked: `${login.slice(0, 3)}***:****`,
        login: userData.login || login,
        balance,
        totalSpent: totalSpent > 0 ? totalSpent : 0,
        rateLimit: userData.rate_limit ?? null,
        rateLimitUsed: userData.rate_limit_used ?? null,
        totalRequests: totalSeoRequests,
        totalCost: totalSpent > 0 ? totalSpent : 0,
        endpointBreakdown,
        dailySpend,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAIUsageStats = async (req, res) => {
  try {
    const { period = "month" } = req.query;
    const now = new Date();
    let startDate;
    if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const matchStage = { createdAt: { $gte: startDate } };

    const [byUser, byWebsite, totals] = await Promise.all([
      AIUsageModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$user",
            totalTokens: { $sum: "$totalTokens" },
            promptTokens: { $sum: "$promptTokens" },
            completionTokens: { $sum: "$completionTokens" },
            requests: { $sum: 1 },
            generates: {
              $sum: { $cond: [{ $eq: ["$action", "generate"] }, 1, 0] },
            },
            refines: {
              $sum: { $cond: [{ $eq: ["$action", "refine"] }, 1, 0] },
            },
            analyzes: {
              $sum: { $cond: [{ $eq: ["$action", "analyze"] }, 1, 0] },
            },
            humanizes: {
              $sum: { $cond: [{ $eq: ["$action", "humanize"] }, 1, 0] },
            },
            metas: { $sum: { $cond: [{ $eq: ["$action", "meta"] }, 1, 0] } },
            keywordAnalyzes: {
              $sum: {
                $cond: [{ $eq: ["$action", "keyword-analysis"] }, 1, 0],
              },
            },
            competitorAnalyzes: {
              $sum: {
                $cond: [{ $eq: ["$action", "competitor-analysis"] }, 1, 0],
              },
            },
            backlinkAnalyzes: {
              $sum: {
                $cond: [{ $eq: ["$action", "backlink-analysis"] }, 1, 0],
              },
            },
          },
        },
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
            name: { $ifNull: ["$userInfo.fullname", "Unknown User"] },
            email: { $ifNull: ["$userInfo.email", ""] },
            totalTokens: 1,
            promptTokens: 1,
            completionTokens: 1,
            requests: 1,
            generates: 1,
            refines: 1,
            analyzes: 1,
            humanizes: 1,
            metas: 1,
            keywordAnalyzes: 1,
            competitorAnalyzes: 1,
            backlinkAnalyzes: 1,
          },
        },
        { $sort: { totalTokens: -1 } },
      ]),
      AIUsageModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$website",
            totalTokens: { $sum: "$totalTokens" },
            promptTokens: { $sum: "$promptTokens" },
            completionTokens: { $sum: "$completionTokens" },
            requests: { $sum: 1 },
            generates: {
              $sum: { $cond: [{ $eq: ["$action", "generate"] }, 1, 0] },
            },
            refines: {
              $sum: { $cond: [{ $eq: ["$action", "refine"] }, 1, 0] },
            },
            analyzes: {
              $sum: { $cond: [{ $eq: ["$action", "analyze"] }, 1, 0] },
            },
            humanizes: {
              $sum: { $cond: [{ $eq: ["$action", "humanize"] }, 1, 0] },
            },
            metas: { $sum: { $cond: [{ $eq: ["$action", "meta"] }, 1, 0] } },
            keywordAnalyzes: {
              $sum: {
                $cond: [{ $eq: ["$action", "keyword-analysis"] }, 1, 0],
              },
            },
            competitorAnalyzes: {
              $sum: {
                $cond: [{ $eq: ["$action", "competitor-analysis"] }, 1, 0],
              },
            },
            backlinkAnalyzes: {
              $sum: {
                $cond: [{ $eq: ["$action", "backlink-analysis"] }, 1, 0],
              },
            },
          },
        },
        {
          $lookup: {
            from: "websites",
            localField: "_id",
            foreignField: "_id",
            as: "websiteInfo",
          },
        },
        { $unwind: { path: "$websiteInfo", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            name: { $ifNull: ["$websiteInfo.name", "Unknown Website"] },
            url: { $ifNull: ["$websiteInfo.url", ""] },
            totalTokens: 1,
            promptTokens: 1,
            completionTokens: 1,
            requests: 1,
            generates: 1,
            refines: 1,
            analyzes: 1,
            humanizes: 1,
            metas: 1,
            keywordAnalyzes: 1,
            competitorAnalyzes: 1,
            backlinkAnalyzes: 1,
          },
        },
        { $sort: { totalTokens: -1 } },
      ]),
      AIUsageModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalTokens: { $sum: "$totalTokens" },
            promptTokens: { $sum: "$promptTokens" },
            completionTokens: { $sum: "$completionTokens" },
            requests: { $sum: 1 },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        period,
        totals: totals[0] || {
          totalTokens: 0,
          promptTokens: 0,
          completionTokens: 0,
          requests: 0,
        },
        byUser,
        byWebsite,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteApiKey = async (req, res) => {
  try {
    const { _id } = req.query;

    const apiKey = await ApiKeyModel.findByIdAndDelete(_id);

    if (!apiKey) {
      return res.send({ success: false, message: "API key not found!" });
    }

    await createLog(req, {
      user: req.user,
      action: "Delete API key",
      category: "api-key",
      details: `Deleted ${apiKey.provider} API key`,
    });
    return res
      .status(200)
      .json({ success: true, message: "API key deleted successfully!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
