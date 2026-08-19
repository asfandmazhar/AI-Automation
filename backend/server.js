import "dotenv/config";
import express from "express";
import connectDB from "./db/connectDB.js";
import authRoute from "./routes/auth.routes.js";
import roleRoute from "./routes/role.routes.js";
import serviceRoute from "./routes/service.routes.js";
import websiteRoute from "./routes/website.routes.js";
import notificationRoute from "./routes/notification.routes.js";
import appearanceRoute from "./routes/appearance.routes.js";
import securityRoute from "./routes/security.routes.js";
import apikeyRoute from "./routes/apikey.routes.js";
import logRoute from "./routes/log.routes.js";
import contentRoute from "./routes/content.routes.js";
import keywordRoute from "./routes/keyword.routes.js";
import backlinksRoute from "./routes/backlinks.routes.js";
import competitorRoute from "./routes/competitor.routes.js";
import cors from "cors";

const server = express();
server.use(express.json());
server.use(cors());

server.use("/api/v1/auth", authRoute);
server.use("/api/v1/roles", roleRoute);
server.use("/api/v1/services", serviceRoute);
server.use("/api/v1/websites", websiteRoute);
server.use("/api/v1/notifications", notificationRoute);
server.use("/api/v1/appearance", appearanceRoute);
server.use("/api/v1/security", securityRoute);
server.use("/api/v1/apikeys", apikeyRoute);
server.use("/api/v1/logs", logRoute);
server.use("/api/v1/content", contentRoute);
server.use("/api/v1/keywords", keywordRoute);
server.use("/api/v1/backlinks", backlinksRoute);
server.use("/api/v1/competitor", competitorRoute);

let PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  connectDB();
  console.log(`Listening on -> ${PORT}`);
});
