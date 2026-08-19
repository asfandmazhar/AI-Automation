import { OAuth2Client } from "google-auth-library";
import WebsiteModel from "../Schema/Website.js";
import UserModel from "../Schema/User.js";
import { createLog } from "../helper/log.helper.js";

const GSC_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

const GA_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/analytics.edit",
  "https://www.googleapis.com/auth/userinfo.email",
];

function getOAuth2Client() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

export const createWebsite = async (req, res) => {
  try {
    const { name, url, customFields, status } = req.body;

    if (!name || !name.trim() || !url || !url.trim()) {
      return res.send({
        success: false,
        message: "Website name and URL are required!",
      });
    }

    const website = new WebsiteModel({
      name: name.trim(),
      url: url.trim(),
      customFields: customFields || [],
      status: status || "Active",
    });

    await website.save();

    await createLog(req, {
      user: req.user,
      action: "Create website",
      category: "website",
      details: `Created website: ${name} (${url})`,
    });
    return res.status(200).json({
      success: true,
      message: "Website created successfully!",
      website,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllWebsites = async (req, res) => {
  try {
    let { page = 1, query } = req.query;
    page = parseInt(page);
    const maxLimit = 10;
    let filter = {};

    const user = await UserModel.findById(req.user).populate("role", "name");
    const isAdminUser = user?.role?.name?.toLowerCase() === "admin";

    if (!isAdminUser) {
      const assignedIds = user?.websites || [];
      if (assignedIds.length === 0) {
        return res.status(200).json({ success: true, websites: [] });
      }
      filter._id = { $in: assignedIds };
    }

    if (query && query.trim() !== "") {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { url: { $regex: query, $options: "i" } },
      ];
    }

    const websites = await WebsiteModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * maxLimit)
      .limit(maxLimit);

    return res.status(200).json({ success: true, websites });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getWebsiteDetails = async (req, res) => {
  try {
    const { websiteId } = req.query;
    if (!websiteId) {
      return res.send({ success: false, message: "Website ID is required!" });
    }

    const website = await WebsiteModel.findById(websiteId).select(
      "-googleSearchConsole.accessToken -googleSearchConsole.refreshToken -googleSearchConsole.googleEmail -googleSearchConsole.expiryDate -googleSearchConsole.scopes -googleAnalytics.accessToken -googleAnalytics.refreshToken -googleAnalytics.googleEmail -googleAnalytics.expiryDate -googleAnalytics.scopes -createdAt -updatedAt"
    );

    if (!website) {
      return res.send({ success: false, message: "Website not found!" });
    }

    return res.status(200).json({ success: true, website });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWebsite = async (req, res) => {
  try {
    const { _id, name, url, customFields, status } = req.body;

    if (!_id) {
      return res.send({ success: false, message: "Website ID is required!" });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (url !== undefined) updateData.url = url.trim();
    if (customFields !== undefined) updateData.customFields = customFields;
    if (status !== undefined) updateData.status = status;

    const website = await WebsiteModel.findByIdAndUpdate(_id, updateData, {
      new: true,
    });

    if (!website) {
      return res.send({ success: false, message: "Website not found!" });
    }

    await createLog(req, {
      user: req.user,
      action: "Update website",
      category: "website",
      details: `Updated website: ${website.name}`,
    });
    return res.status(200).json({
      success: true,
      message: "Website updated successfully!",
      website,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTotalWebsites = async (req, res) => {
  try {
    const count = await WebsiteModel.countDocuments();
    return res.status(200).json({ success: true, count });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteWebsite = async (req, res) => {
  try {
    const { _id } = req.query;

    const website = await WebsiteModel.findByIdAndDelete(_id);

    if (!website) {
      return res.send({ success: false, message: "Website not found!" });
    }

    await createLog(req, {
      user: req.user,
      action: "Delete website",
      category: "website",
      details: `Deleted website: ${website.name}`,
    });
    return res
      .status(200)
      .json({ success: true, message: "Website deleted successfully!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Google Search Console OAuth ────────────────────

export const getGscAuthUrl = async (req, res) => {
  try {
    const { websiteId } = req.query;

    if (!websiteId) {
      return res.send({ success: false, message: "Website ID is required!" });
    }

    const website = await WebsiteModel.findById(websiteId);
    if (!website) {
      return res.send({ success: false, message: "Website not found!" });
    }

    const oauth2Client = getOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: GSC_SCOPES,
      state: websiteId,
    });

    return res.status(200).json({ success: true, url });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const handleGscCallback = async (req, res) => {
  try {
    const { code, state: websiteId } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    if (!code || !websiteId) {
      return res.redirect(`${frontendUrl}/admin/websites?gsc=error`);
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const userInfo = await oauth2Client.request({
      url: "https://www.googleapis.com/oauth2/v2/userinfo",
    });
    const googleEmail = userInfo.data.email;

    await WebsiteModel.findByIdAndUpdate(websiteId, {
      googleSearchConsole: {
        connected: true,
        googleEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scopes: GSC_SCOPES,
      },
    });

    await createLog(
      { headers: {}, connection: {} },
      {
        action: "Connect Google Search Console",
        category: "website",
        details: `Connected GSC (${googleEmail}) to website ID: ${websiteId}`,
      },
    );

    return res.redirect(
      `${frontendUrl}/admin/websites?gsc=success&websiteId=${websiteId}`,
    );
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/admin/websites?gsc=error`);
  }
};

export const disconnectGsc = async (req, res) => {
  try {
    const { websiteId } = req.body;

    if (!websiteId) {
      return res.send({ success: false, message: "Website ID is required!" });
    }

    const website = await WebsiteModel.findById(websiteId);
    if (!website) {
      return res.send({ success: false, message: "Website not found!" });
    }

    if (website.googleSearchConsole?.accessToken) {
      try {
        const oauth2Client = getOAuth2Client();
        await oauth2Client.revokeToken(website.googleSearchConsole.accessToken);
      } catch {}
    }

    const oldEmail = website.googleSearchConsole?.googleEmail || "";

    website.googleSearchConsole = {
      connected: false,
      googleEmail: "",
      accessToken: "",
      refreshToken: "",
      expiryDate: null,
      scopes: [],
      selectedProperty: "",
    };
    await website.save();

    await createLog(req, {
      user: req.user,
      action: "Disconnect Google Search Console",
      category: "website",
      details: `Disconnected GSC (${oldEmail}) from website: ${website.name}`,
    });

    return res
      .status(200)
      .json({ success: true, message: "Google Search Console disconnected!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getGscStatus = async (req, res) => {
  try {
    const { websiteId } = req.query;

    if (!websiteId) {
      return res.send({ success: false, message: "Website ID is required!" });
    }

    const website = await WebsiteModel.findById(websiteId);
    if (!website) {
      return res.send({ success: false, message: "Website not found!" });
    }

    const gsc = website.googleSearchConsole || {};
    return res.status(200).json({
      success: true,
      connected: gsc.connected || false,
      googleEmail: gsc.googleEmail || "",
      selectedProperty: gsc.selectedProperty || "",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

async function getAuthenticatedClient(website) {
  const oauth2Client = getOAuth2Client();
  const gsc = website.googleSearchConsole;

  if (!gsc.refreshToken) {
    throw new Error("Google connection expired. Please reconnect Google Search Console from Admin → Websites.");
  }

  oauth2Client.setCredentials({
    refresh_token: gsc.refreshToken,
  });

  oauth2Client.on("tokens", async (tokens) => {
    const update = {};
    if (tokens.access_token) update["googleSearchConsole.accessToken"] = tokens.access_token;
    if (tokens.expiry_date) update["googleSearchConsole.expiryDate"] = new Date(tokens.expiry_date);
    if (Object.keys(update).length) {
      await WebsiteModel.findByIdAndUpdate(website._id, { $set: update });
    }
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
  } catch {
    throw new Error("Google connection expired. Please reconnect Google Search Console from Admin → Websites.");
  }

  return oauth2Client;
}

export const getGscProperties = async (req, res) => {
  try {
    const { websiteId } = req.query;

    if (!websiteId) {
      return res.send({ success: false, message: "Website ID is required!" });
    }

    const website = await WebsiteModel.findById(websiteId);
    if (!website) {
      return res.send({ success: false, message: "Website not found!" });
    }

    if (!website.googleSearchConsole?.connected) {
      return res.send({
        success: false,
        message: "Google Search Console is not connected for this website!",
      });
    }

    const oauth2Client = await getAuthenticatedClient(website);

    const response = await oauth2Client.request({
      url: "https://www.googleapis.com/webmasters/v3/sites",
    });

    const properties = (response.data.siteEntry || []).map((entry) => ({
      siteUrl: entry.siteUrl,
      permissionLevel: entry.permissionLevel,
    }));

    return res.status(200).json({ success: true, properties });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const selectGscProperty = async (req, res) => {
  try {
    const { websiteId, propertyUrl } = req.body;

    if (!websiteId || !propertyUrl) {
      return res.send({
        success: false,
        message: "Website ID and property URL are required!",
      });
    }

    const website = await WebsiteModel.findById(websiteId);
    if (!website) {
      return res.send({ success: false, message: "Website not found!" });
    }

    if (!website.googleSearchConsole?.connected) {
      return res.send({
        success: false,
        message: "Google Search Console is not connected!",
      });
    }

    website.googleSearchConsole.selectedProperty = propertyUrl;
    await website.save();

    await createLog(req, {
      user: req.user,
      action: "Select GSC property",
      category: "website",
      details: `Selected GSC property "${propertyUrl}" for website: ${website.name}`,
    });

    return res.status(200).json({
      success: true,
      message: "Property selected successfully!",
      website,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Shared GSC helper ──────────────────────────────

async function loadGscClient(req) {
  const { websiteId } = req.query;
  if (!websiteId) return { error: "Website ID is required!" };

  const user = await UserModel.findById(req.user).populate("role", "name");
  const isAdminUser = user?.role?.name?.toLowerCase() === "admin";
  if (!isAdminUser) {
    const hasAccess = user?.websites?.some((id) => id.toString() === websiteId);
    if (!hasAccess) return { error: "Access denied!", status: 403 };
  }

  const website = await WebsiteModel.findById(websiteId);
  if (!website) return { error: "Website not found!" };

  if (
    !website.googleSearchConsole?.connected ||
    !website.googleSearchConsole?.selectedProperty
  ) {
    return {
      error: "Google Search Console is not connected or no property selected!",
    };
  }

  const client = await getAuthenticatedClient(website);
  const property = website.googleSearchConsole.selectedProperty;
  const analyticsUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`;

  return { client, property, analyticsUrl, website };
}

function gscDateRange(startDate, endDate) {
  const end = endDate || new Date().toISOString().split("T")[0];
  const start =
    startDate ||
    new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  return { start, end };
}

// ─── Overview (all dimensions + previous-period comparison) ──

export const getGscAnalytics = async (req, res) => {
  try {
    const result = await loadGscClient(req);
    if (result.error)
      return res
        .status(result.status || 200)
        .json({ success: false, message: result.error });

    const { client, analyticsUrl } = result;
    const { startDate, endDate, searchType } = req.query;
    const { start, end } = gscDateRange(startDate, endDate);

    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const durationMs = endMs - startMs;
    const prevEnd = new Date(startMs - 1 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const prevStart = new Date(startMs - 1 * 24 * 60 * 60 * 1000 - durationMs)
      .toISOString()
      .split("T")[0];

    const validSearchTypes = [
      "web",
      "image",
      "video",
      "news",
      "discover",
      "googleNews",
    ];
    const typeParam = validSearchTypes.includes(searchType)
      ? searchType
      : undefined;

    const baseData = { startDate: start, endDate: end };
    const prevBaseData = { startDate: prevStart, endDate: prevEnd };
    if (typeParam) {
      baseData.type = typeParam;
      prevBaseData.type = typeParam;
    }

    const [
      overviewRes,
      dailyRes,
      queriesRes,
      pagesRes,
      countriesRes,
      devicesRes,
      searchAppearanceRes,
      prevOverviewRes,
      searchTypeRes,
    ] = await Promise.all([
      client.request({
        url: analyticsUrl,
        method: "POST",
        data: { ...baseData },
      }),
      client.request({
        url: analyticsUrl,
        method: "POST",
        data: { ...baseData, dimensions: ["date"], rowLimit: 500 },
      }),
      typeParam === "discover" || typeParam === "googleNews"
        ? Promise.resolve({ data: {} })
        : client.request({
            url: analyticsUrl,
            method: "POST",
            data: { ...baseData, dimensions: ["query"], rowLimit: 50 },
          }),
      client.request({
        url: analyticsUrl,
        method: "POST",
        data: { ...baseData, dimensions: ["page"], rowLimit: 50 },
      }),
      client.request({
        url: analyticsUrl,
        method: "POST",
        data: { ...baseData, dimensions: ["country"], rowLimit: 50 },
      }),
      typeParam === "discover" || typeParam === "googleNews"
        ? Promise.resolve({ data: {} })
        : client.request({
            url: analyticsUrl,
            method: "POST",
            data: { ...baseData, dimensions: ["device"] },
          }),
      typeParam === "discover" || typeParam === "googleNews"
        ? Promise.resolve({ data: {} })
        : client
            .request({
              url: analyticsUrl,
              method: "POST",
              data: {
                ...baseData,
                dimensions: ["searchAppearance"],
                rowLimit: 20,
              },
            })
            .catch(() => ({ data: {} })),
      client
        .request({
          url: analyticsUrl,
          method: "POST",
          data: { ...prevBaseData },
        })
        .catch(() => ({ data: {} })),
      !typeParam
        ? Promise.all(
            ["web", "image", "video", "news", "discover", "googleNews"].map(
              (t) =>
                client
                  .request({
                    url: analyticsUrl,
                    method: "POST",
                    data: { startDate: start, endDate: end, type: t },
                  })
                  .then((r) => ({
                    type: t,
                    ...(r.data.rows?.[0] || {
                      clicks: 0,
                      impressions: 0,
                      ctr: 0,
                      position: 0,
                    }),
                  }))
                  .catch(() => null),
            ),
          )
        : Promise.resolve([]),
    ]);

    const ov = overviewRes.data.rows?.[0] || {
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
    };
    const prevOv = prevOverviewRes.data?.rows?.[0] || null;

    const searchTypes = (searchTypeRes || []).filter(
      (t) => t && (t.clicks > 0 || t.impressions > 0),
    );

    return res.status(200).json({
      success: true,
      overview: {
        clicks: ov.clicks,
        impressions: ov.impressions,
        ctr: ov.ctr,
        position: ov.position,
      },
      previousPeriod: prevOv
        ? {
            clicks: prevOv.clicks,
            impressions: prevOv.impressions,
            ctr: prevOv.ctr,
            position: prevOv.position,
          }
        : null,
      dailyData: (dailyRes.data.rows || []).map((r) => ({
        date: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      topQueries: (queriesRes.data.rows || []).map((r) => ({
        query: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      topPages: (pagesRes.data.rows || []).map((r) => ({
        page: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      countries: (countriesRes.data.rows || []).map((r) => ({
        country: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      devices: (devicesRes.data.rows || []).map((r) => ({
        device: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      searchAppearance: (searchAppearanceRes.data?.rows || []).map((r) => ({
        appearance: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      searchTypes,
      activeSearchType: typeParam || "all",
      dateRange: { startDate: start, endDate: end },
      previousDateRange: { startDate: prevStart, endDate: prevEnd },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Queries (paginated) ────────────────────────────

export const getGscQueries = async (req, res) => {
  try {
    const result = await loadGscClient(req);
    if (result.error)
      return res
        .status(result.status || 200)
        .json({ success: false, message: result.error });

    const { client, analyticsUrl } = result;
    const { startDate, endDate, page = 1, limit = 25 } = req.query;
    const { start, end } = gscDateRange(startDate, endDate);
    const rowLimit = Math.min(parseInt(limit) || 25, 100);
    const startRow = (Math.max(parseInt(page) || 1, 1) - 1) * rowLimit;

    const response = await client.request({
      url: analyticsUrl,
      method: "POST",
      data: {
        startDate: start,
        endDate: end,
        dimensions: ["query"],
        rowLimit,
        startRow,
      },
    });

    return res.status(200).json({
      success: true,
      queries: (response.data.rows || []).map((r) => ({
        query: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      page: Math.max(parseInt(page) || 1, 1),
      limit: rowLimit,
      dateRange: { startDate: start, endDate: end },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Pages (paginated) ──────────────────────────────

export const getGscPages = async (req, res) => {
  try {
    const result = await loadGscClient(req);
    if (result.error)
      return res
        .status(result.status || 200)
        .json({ success: false, message: result.error });

    const { client, analyticsUrl } = result;
    const { startDate, endDate, page = 1, limit = 25 } = req.query;
    const { start, end } = gscDateRange(startDate, endDate);
    const rowLimit = Math.min(parseInt(limit) || 25, 100);
    const startRow = (Math.max(parseInt(page) || 1, 1) - 1) * rowLimit;

    const response = await client.request({
      url: analyticsUrl,
      method: "POST",
      data: {
        startDate: start,
        endDate: end,
        dimensions: ["page"],
        rowLimit,
        startRow,
      },
    });

    return res.status(200).json({
      success: true,
      pages: (response.data.rows || []).map((r) => ({
        page: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      page: Math.max(parseInt(page) || 1, 1),
      limit: rowLimit,
      dateRange: { startDate: start, endDate: end },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Countries ──────────────────────────────────────

export const getGscCountries = async (req, res) => {
  try {
    const result = await loadGscClient(req);
    if (result.error)
      return res
        .status(result.status || 200)
        .json({ success: false, message: result.error });

    const { client, analyticsUrl } = result;
    const { startDate, endDate } = req.query;
    const { start, end } = gscDateRange(startDate, endDate);

    const response = await client.request({
      url: analyticsUrl,
      method: "POST",
      data: {
        startDate: start,
        endDate: end,
        dimensions: ["country"],
        rowLimit: 50,
      },
    });

    return res.status(200).json({
      success: true,
      countries: (response.data.rows || []).map((r) => ({
        country: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      dateRange: { startDate: start, endDate: end },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Devices ────────────────────────────────────────

export const getGscDevices = async (req, res) => {
  try {
    const result = await loadGscClient(req);
    if (result.error)
      return res
        .status(result.status || 200)
        .json({ success: false, message: result.error });

    const { client, analyticsUrl } = result;
    const { startDate, endDate } = req.query;
    const { start, end } = gscDateRange(startDate, endDate);

    const response = await client.request({
      url: analyticsUrl,
      method: "POST",
      data: { startDate: start, endDate: end, dimensions: ["device"] },
    });

    return res.status(200).json({
      success: true,
      devices: (response.data.rows || []).map((r) => ({
        device: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      dateRange: { startDate: start, endDate: end },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── URL Inspection ────────────────────────────────

export const getGscUrlInspection = async (req, res) => {
  try {
    const result = await loadGscClient(req);
    if (result.error)
      return res
        .status(result.status || 200)
        .json({ success: false, message: result.error });

    const { client, property } = result;
    const { inspectionUrl } = req.query;

    if (!inspectionUrl) {
      return res.send({
        success: false,
        message: "URL to inspect is required!",
      });
    }

    const response = await client.request({
      url: "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
      method: "POST",
      data: { inspectionUrl, siteUrl: property },
    });

    const r = response.data?.inspectionResult || {};
    const idx = r.indexStatusResult || {};
    const mob = r.mobileUsabilityResult || {};
    const rich = r.richResultsResult || {};

    return res.status(200).json({
      success: true,
      inspection: {
        inspectionUrl,
        indexStatus: idx.coverageState || "Unknown",
        verdict: idx.verdict || "UNKNOWN",
        robotsTxtState: idx.robotsTxtState || "Unknown",
        indexingState: idx.indexingState || "Unknown",
        lastCrawlTime: idx.lastCrawlTime || null,
        pageFetchState: idx.pageFetchState || "Unknown",
        crawledAs: idx.crawledAs || "Unknown",
        canonicalUrl: idx.googleCanonical || "",
        userCanonical: idx.userCanonical || "",
        referringUrls: idx.referringUrls || [],
        mobileUsability: mob.verdict || "UNKNOWN",
        mobileIssues: (mob.issues || []).map((i) => ({
          message: i.message,
          severity: i.severity,
        })),
        richResults: rich.verdict || "UNKNOWN",
        richResultItems: (rich.detectedItems || []).map((item) => ({
          type: item.richResultType || "",
          items: (item.items || []).map((i) => ({
            name: i.name,
            issues: i.issues || [],
          })),
        })),
      },
    });
  } catch (error) {
    const msg = error?.response?.data?.error?.message || error.message;
    return res.status(500).json({ success: false, message: msg });
  }
};

// ─── Sitemaps ──────────────────────────────────────

export const getGscSitemaps = async (req, res) => {
  try {
    const result = await loadGscClient(req);
    if (result.error)
      return res
        .status(result.status || 200)
        .json({ success: false, message: result.error });

    const { client, property } = result;

    const response = await client.request({
      url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/sitemaps`,
    });

    const sitemaps = (response.data.sitemap || []).map((s) => ({
      path: s.path,
      lastSubmitted: s.lastSubmitted || null,
      lastDownloaded: s.lastDownloaded || null,
      isPending: s.isPending || false,
      isSitemapsIndex: s.isSitemapsIndex || false,
      warnings: parseInt(s.warnings || "0"),
      errors: parseInt(s.errors || "0"),
      contents: (s.contents || []).map((c) => ({
        type: c.type,
        submitted: parseInt(c.submitted || "0"),
        indexed: parseInt(c.indexed || "0"),
      })),
    }));

    return res.status(200).json({ success: true, sitemaps });
  } catch (error) {
    const msg = error?.response?.data?.error?.message || error.message;
    return res.status(500).json({ success: false, message: msg });
  }
};

// ═══════════════════════════════════════════════════
// ─── Google Analytics GA4 ─────────────────────────
// ═══════════════════════════════════════════════════

function getGaOAuth2Client() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_GA_REDIRECT_URI,
  );
}

async function getGaAuthenticatedClient(website) {
  const oauth2Client = getGaOAuth2Client();
  const ga = website.googleAnalytics;

  if (!ga.refreshToken) {
    throw new Error("Google connection expired. Please reconnect Google Analytics from Admin → Websites.");
  }

  oauth2Client.setCredentials({
    refresh_token: ga.refreshToken,
  });

  oauth2Client.on("tokens", async (tokens) => {
    const update = {};
    if (tokens.access_token) update["googleAnalytics.accessToken"] = tokens.access_token;
    if (tokens.expiry_date) update["googleAnalytics.expiryDate"] = new Date(tokens.expiry_date);
    if (Object.keys(update).length) {
      await WebsiteModel.findByIdAndUpdate(website._id, { $set: update });
    }
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
  } catch {
    throw new Error("Google connection expired. Please reconnect Google Analytics from Admin → Websites.");
  }

  return oauth2Client;
}

// ─── GA4 OAuth ─────────────────────────────────────

export const getGaAuthUrl = async (req, res) => {
  try {
    const { websiteId } = req.query;

    if (!websiteId) {
      return res.send({ success: false, message: "Website ID is required!" });
    }

    const website = await WebsiteModel.findById(websiteId);
    if (!website) {
      return res.send({ success: false, message: "Website not found!" });
    }

    const oauth2Client = getGaOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: GA_SCOPES,
      state: websiteId,
    });

    return res.status(200).json({ success: true, url });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const handleGaCallback = async (req, res) => {
  try {
    const { code, state: websiteId } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    if (!code || !websiteId) {
      return res.redirect(`${frontendUrl}/admin/websites?ga=error`);
    }

    const oauth2Client = getGaOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const userInfo = await oauth2Client.request({
      url: "https://www.googleapis.com/oauth2/v2/userinfo",
    });
    const googleEmail = userInfo.data.email;

    await WebsiteModel.findByIdAndUpdate(websiteId, {
      googleAnalytics: {
        connected: true,
        googleEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scopes: GA_SCOPES,
      },
    });

    await createLog(
      { headers: {}, connection: {} },
      {
        action: "Connect Google Analytics",
        category: "website",
        details: `Connected GA4 (${googleEmail}) to website ID: ${websiteId}`,
      },
    );

    return res.redirect(
      `${frontendUrl}/admin/websites?ga=success&websiteId=${websiteId}`,
    );
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/admin/websites?ga=error`);
  }
};

export const disconnectGa = async (req, res) => {
  try {
    const { websiteId } = req.body;

    if (!websiteId) {
      return res.send({ success: false, message: "Website ID is required!" });
    }

    const website = await WebsiteModel.findById(websiteId);
    if (!website) {
      return res.send({ success: false, message: "Website not found!" });
    }

    if (website.googleAnalytics?.accessToken) {
      try {
        const oauth2Client = getGaOAuth2Client();
        await oauth2Client.revokeToken(website.googleAnalytics.accessToken);
      } catch {}
    }

    const oldEmail = website.googleAnalytics?.googleEmail || "";

    website.googleAnalytics = {
      connected: false,
      googleEmail: "",
      accessToken: "",
      refreshToken: "",
      expiryDate: null,
      scopes: [],
      selectedProperty: "",
    };
    await website.save();

    await createLog(req, {
      user: req.user,
      action: "Disconnect Google Analytics",
      category: "website",
      details: `Disconnected GA4 (${oldEmail}) from website: ${website.name}`,
    });

    return res
      .status(200)
      .json({ success: true, message: "Google Analytics disconnected!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getGaStatus = async (req, res) => {
  try {
    const { websiteId } = req.query;

    if (!websiteId) {
      return res.send({ success: false, message: "Website ID is required!" });
    }

    const website = await WebsiteModel.findById(websiteId);
    if (!website) {
      return res.send({ success: false, message: "Website not found!" });
    }

    const ga = website.googleAnalytics || {};
    return res.status(200).json({
      success: true,
      connected: ga.connected || false,
      googleEmail: ga.googleEmail || "",
      selectedProperty: ga.selectedProperty || "",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getGaProperties = async (req, res) => {
  try {
    const { websiteId } = req.query;

    if (!websiteId) {
      return res.send({ success: false, message: "Website ID is required!" });
    }

    const website = await WebsiteModel.findById(websiteId);
    if (!website) {
      return res.send({ success: false, message: "Website not found!" });
    }

    if (!website.googleAnalytics?.connected) {
      return res.send({
        success: false,
        message: "Google Analytics is not connected for this website!",
      });
    }

    const oauth2Client = await getGaAuthenticatedClient(website);
    const properties = [];
    const errors = [];

    // Try accountSummaries first
    try {
      let nextPageToken = null;
      do {
        const params = new URLSearchParams({ pageSize: "200" });
        if (nextPageToken) params.set("pageToken", nextPageToken);
        const response = await oauth2Client.request({
          url: `https://analyticsadmin.googleapis.com/v1beta/accountSummaries?${params}`,
        });
        for (const account of response.data.accountSummaries || []) {
          for (const prop of account.propertySummaries || []) {
            properties.push({
              propertyId: prop.property.replace("properties/", ""),
              displayName: prop.displayName,
              property: prop.property,
              account: account.displayName,
            });
          }
        }
        nextPageToken = response.data.nextPageToken || null;
      } while (nextPageToken);
    } catch (e) {
      errors.push("accountSummaries: " + (e.message || String(e)));
    }

    // Fallback: list accounts then properties individually
    if (properties.length === 0) {
      try {
        const accountsRes = await oauth2Client.request({
          url: "https://analyticsadmin.googleapis.com/v1beta/accounts?pageSize=200",
        });
        const accounts = accountsRes.data.accounts || [];
        if (accounts.length === 0) {
          errors.push("accounts: No GA accounts found for this Google account");
        }
        for (const account of accounts) {
          try {
            const propsRes = await oauth2Client.request({
              url: `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:${account.name}&pageSize=200`,
            });
            for (const prop of propsRes.data.properties || []) {
              properties.push({
                propertyId: prop.name.replace("properties/", ""),
                displayName: prop.displayName,
                property: prop.name,
                account: account.displayName,
              });
            }
          } catch (e2) {
            errors.push(`properties(${account.displayName}): ${e2.message || String(e2)}`);
          }
        }
      } catch (e) {
        errors.push("accounts: " + (e.message || String(e)));
      }
    }

    if (properties.length === 0 && errors.length > 0) {
      const hasApiDisabled = errors.some((e) => e.includes("not been used") || e.includes("not enabled") || e.includes("403"));
      return res.status(200).json({
        success: true,
        properties: [],
        hint: hasApiDisabled
          ? "The Google Analytics Admin API may not be enabled in your Google Cloud project. Go to Google Cloud Console → APIs & Services → Enable 'Google Analytics Admin API'."
          : "No GA4 properties found. Make sure the connected Google account has access to at least one GA4 property.",
        debug: errors,
      });
    }

    return res.status(200).json({ success: true, properties });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const selectGaProperty = async (req, res) => {
  try {
    const { websiteId, propertyId } = req.body;

    if (!websiteId || !propertyId) {
      return res.send({
        success: false,
        message: "Website ID and property ID are required!",
      });
    }

    const website = await WebsiteModel.findById(websiteId);
    if (!website) {
      return res.send({ success: false, message: "Website not found!" });
    }

    if (!website.googleAnalytics?.connected) {
      return res.send({
        success: false,
        message: "Google Analytics is not connected!",
      });
    }

    website.googleAnalytics.selectedProperty = propertyId;
    await website.save();

    await createLog(req, {
      user: req.user,
      action: "Select GA4 property",
      category: "website",
      details: `Selected GA4 property "${propertyId}" for website: ${website.name}`,
    });

    return res.status(200).json({
      success: true,
      message: "Property selected successfully!",
      website,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Shared GA4 helper ─────────────────────────────

async function loadGaClient(req) {
  const { websiteId } = req.query;
  if (!websiteId) return { error: "Website ID is required!" };

  const user = await UserModel.findById(req.user).populate("role", "name");
  const isAdminUser = user?.role?.name?.toLowerCase() === "admin";
  if (!isAdminUser) {
    const hasAccess = user?.websites?.some((id) => id.toString() === websiteId);
    if (!hasAccess) return { error: "Access denied!", status: 403 };
  }

  const website = await WebsiteModel.findById(websiteId);
  if (!website) return { error: "Website not found!" };

  if (
    !website.googleAnalytics?.connected ||
    !website.googleAnalytics?.selectedProperty
  ) {
    return {
      error: "Google Analytics is not connected or no property selected!",
    };
  }

  const client = await getGaAuthenticatedClient(website);
  const propertyId = website.googleAnalytics.selectedProperty;
  const reportUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

  return { client, propertyId, reportUrl, website };
}

// ─── GA4 Analytics Overview ────────────────────────

export const getGaAnalytics = async (req, res) => {
  try {
    const result = await loadGaClient(req);
    if (result.error)
      return res
        .status(result.status || 200)
        .json({ success: false, message: result.error });

    const { client, reportUrl } = result;
    const { startDate, endDate } = req.query;
    const { start, end } = gscDateRange(startDate, endDate);

    // Previous period
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const durationMs = endMs - startMs;
    const prevEnd = new Date(startMs - 1 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const prevStart = new Date(startMs - 1 * 24 * 60 * 60 * 1000 - durationMs)
      .toISOString()
      .split("T")[0];

    const overviewMetrics = [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "engagementRate" },
      { name: "averageSessionDuration" },
      { name: "eventCount" },
      { name: "bounceRate" },
      { name: "newUsers" },
    ];

    const [
      overviewRes,
      prevRes,
      dailyRes,
      channelsRes,
      pagesRes,
      devicesRes,
      countriesRes,
      browsersRes,
    ] = await Promise.all([
      client.request({
        url: reportUrl,
        method: "POST",
        data: {
          dateRanges: [{ startDate: start, endDate: end }],
          metrics: overviewMetrics,
        },
      }),
      client
        .request({
          url: reportUrl,
          method: "POST",
          data: {
            dateRanges: [{ startDate: prevStart, endDate: prevEnd }],
            metrics: overviewMetrics,
          },
        })
        .catch(() => ({ data: {} })),
      client.request({
        url: reportUrl,
        method: "POST",
        data: {
          dateRanges: [{ startDate: start, endDate: end }],
          dimensions: [{ name: "date" }],
          metrics: [
            { name: "activeUsers" },
            { name: "sessions" },
            { name: "screenPageViews" },
            { name: "engagementRate" },
            { name: "averageSessionDuration" },
          ],
          orderBys: [{ dimension: { dimensionName: "date" } }],
          limit: 500,
        },
      }),
      client.request({
        url: reportUrl,
        method: "POST",
        data: {
          dateRanges: [{ startDate: start, endDate: end }],
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
          metrics: [
            { name: "activeUsers" },
            { name: "sessions" },
            { name: "engagementRate" },
          ],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: 15,
        },
      }),
      client.request({
        url: reportUrl,
        method: "POST",
        data: {
          dateRanges: [{ startDate: start, endDate: end }],
          dimensions: [{ name: "pagePath" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "activeUsers" },
            { name: "averageSessionDuration" },
          ],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 25,
        },
      }),
      client.request({
        url: reportUrl,
        method: "POST",
        data: {
          dateRanges: [{ startDate: start, endDate: end }],
          dimensions: [{ name: "deviceCategory" }],
          metrics: [
            { name: "activeUsers" },
            { name: "sessions" },
            { name: "engagementRate" },
          ],
        },
      }),
      client.request({
        url: reportUrl,
        method: "POST",
        data: {
          dateRanges: [{ startDate: start, endDate: end }],
          dimensions: [{ name: "country" }],
          metrics: [
            { name: "activeUsers" },
            { name: "sessions" },
            { name: "engagementRate" },
          ],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: 30,
        },
      }),
      client.request({
        url: reportUrl,
        method: "POST",
        data: {
          dateRanges: [{ startDate: start, endDate: end }],
          dimensions: [{ name: "browser" }],
          metrics: [{ name: "activeUsers" }, { name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: 10,
        },
      }),
    ]);

    function parseOverview(data) {
      const row = data?.rows?.[0];
      if (!row) return null;
      const m = row.metricValues || [];
      return {
        activeUsers: parseInt(m[0]?.value || "0"),
        sessions: parseInt(m[1]?.value || "0"),
        pageViews: parseInt(m[2]?.value || "0"),
        engagementRate: parseFloat(m[3]?.value || "0"),
        avgSessionDuration: parseFloat(m[4]?.value || "0"),
        eventCount: parseInt(m[5]?.value || "0"),
        bounceRate: parseFloat(m[6]?.value || "0"),
        newUsers: parseInt(m[7]?.value || "0"),
      };
    }

    function parseDimensionRows(data, dimKey) {
      return (data?.rows || []).map((row) => {
        const dim = row.dimensionValues?.[0]?.value || "";
        const m = row.metricValues || [];
        return { [dimKey]: dim, values: m.map((v) => v.value) };
      });
    }

    const overview = parseOverview(overviewRes.data);
    const previousPeriod = parseOverview(prevRes.data);

    const dailyData = (dailyRes.data?.rows || []).map((row) => {
      const raw = row.dimensionValues?.[0]?.value || "";
      const m = row.metricValues || [];
      const date =
        raw.length === 8
          ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
          : raw;
      return {
        date,
        activeUsers: parseInt(m[0]?.value || "0"),
        sessions: parseInt(m[1]?.value || "0"),
        pageViews: parseInt(m[2]?.value || "0"),
        engagementRate: parseFloat(m[3]?.value || "0"),
        avgSessionDuration: parseFloat(m[4]?.value || "0"),
      };
    });

    const channels = (channelsRes.data?.rows || []).map((row) => {
      const m = row.metricValues || [];
      return {
        channel: row.dimensionValues?.[0]?.value || "",
        users: parseInt(m[0]?.value || "0"),
        sessions: parseInt(m[1]?.value || "0"),
        engagementRate: parseFloat(m[2]?.value || "0"),
      };
    });

    const topPages = (pagesRes.data?.rows || []).map((row) => {
      const m = row.metricValues || [];
      return {
        pagePath: row.dimensionValues?.[0]?.value || "",
        pageViews: parseInt(m[0]?.value || "0"),
        users: parseInt(m[1]?.value || "0"),
        avgDuration: parseFloat(m[2]?.value || "0"),
      };
    });

    const devices = (devicesRes.data?.rows || []).map((row) => {
      const m = row.metricValues || [];
      return {
        device: row.dimensionValues?.[0]?.value || "",
        users: parseInt(m[0]?.value || "0"),
        sessions: parseInt(m[1]?.value || "0"),
        engagementRate: parseFloat(m[2]?.value || "0"),
      };
    });

    const countries = (countriesRes.data?.rows || []).map((row) => {
      const m = row.metricValues || [];
      return {
        country: row.dimensionValues?.[0]?.value || "",
        users: parseInt(m[0]?.value || "0"),
        sessions: parseInt(m[1]?.value || "0"),
        engagementRate: parseFloat(m[2]?.value || "0"),
      };
    });

    const browsers = (browsersRes.data?.rows || []).map((row) => {
      const m = row.metricValues || [];
      return {
        browser: row.dimensionValues?.[0]?.value || "",
        users: parseInt(m[0]?.value || "0"),
        sessions: parseInt(m[1]?.value || "0"),
      };
    });

    return res.status(200).json({
      success: true,
      overview,
      previousPeriod,
      dailyData,
      channels,
      topPages,
      devices,
      countries,
      browsers,
      dateRange: { startDate: start, endDate: end },
      previousDateRange: { startDate: prevStart, endDate: prevEnd },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
