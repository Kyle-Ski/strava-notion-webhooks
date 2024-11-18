"use strict";
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");

const { logNotionError } = require("./utils/notionUtils");
const { healthCheck } = require("./controllers/stravaController");
const { logRequests, refreshStravaToken } = require("./middleware");
const authRoutes = require("./routes/authRoutes");
const stravaRoutes = require("./routes/stravaRoutes");
const notionRoutes = require("./routes/notionRoutes");

const app = express();
app.use(bodyParser.json());
app.use(logRequests);

// Root route for basic health and info
app.get("/", async (req, res) => {
  const baseUrl = process.env.BASE_URL;
  res.status(200).json({
    message: "Hello from the root!",
    authRoutes: {
      exchangeTokens: {
        url: `${baseUrl}/auth/exchange_token`,
        example: "Callback URL for Strava to exchange tokens.",
      },
    },
    stravaRoutes: {
      deleteCurrentSubscription: `${baseUrl}/strava/delete`,
      deleteSubscriptionById: `${baseUrl}/strava/delete/SUBSCRIPTION_ID_TO_DELETE`,
      subscribeToWebhook: `${baseUrl}/strava/subscribe`,
      testStravaWebhookEvent: {
        url: `${baseUrl}/strava/test/webhook/STRAVA_EVENT_TO_TEST`,
        example: `${baseUrl}/strava/webhook/WeightTraining`,
      },
      validateStravaSubscription: `${baseUrl}/strava/webhook`,
      viewSubscriptions: `${baseUrl}/strava/view`,
    },
    notionRoutes: {
      testUpdateRelations: {
        url: `${baseUrl}/notion/test/relation/EVENT_TYPE`,
        example: `${baseUrl}/notion/test/relation/Run`,
      },
      testLogToNotion: {
        url: `${baseUrl}/notion/test/log/LOG_TITLE`,
        example: `${baseUrl}/notion/test/relation/log-title-1`,
        additionalFunctionality:
          "You can include 'error' in the log title to test logNotionError().",
      },
    },
  });
});

// Auth Routes
app.use("/auth", authRoutes);
// Middleware to refresh Strava Token
app.use(refreshStravaToken);
// Strava Routes
app.use("/strava", stravaRoutes);
// Notion Routes
app.use("/notion", notionRoutes);

// Health check route
app.get("/health", async (req, res, next) => {
  console.log(
    "Checking application health...",
    process.env.BASE_URL,
    typeof app.locals.access_token === "string"
  );
  healthCheck(
    process.env.BASE_URL,
    app.locals.challengeId,
    res,
    app.locals.access_token
  );
  next();
});

// Not Found handler
function notFound(req, res, next) {
  res.status(404).send({ error: "Not found!", status: 404, url: req.originalUrl });
}
app.use(notFound);

// Error handler
function errorHandler(err, req, res, next) {
  console.error("errorHandler", err);
  const stack = process.env.NODE_ENV !== "production" ? err.stack : undefined;
  logNotionError(`errorHandler ERROR`, stack);
  res.status(500).send({ error: err.message, stack, url: req.originalUrl });
}
app.use(errorHandler);

// Export the app for Vercel
module.exports = app;
