"use strict";
require("dotenv").config();

const express = require("express"),
  bodyParser = require("body-parser"),
  app = express().use(bodyParser.json());

const { connectNgrok } = require("./utils/ngrokUtils");
const { logNotionError } = require("./utils/notionUtils");
const { healthCheck } = require("./controllers/stravaController");
const { logRequests, refreshStravaToken } = require("./middleware");
const authRoutes = require("./routes/authRoutes");
const stravaRoutes = require("./routes/stravaRoutes");
const notionRoutes = require("./routes/notionRoutes");
const expressPort = 8080;

// Sets server port and connects ngrok to the same port
app.listen(
  process.env.PORT || expressPort,
  connectNgrok(
    expressPort,
    process.env.NGROK_AUTH_TOKEN,
    (url) => (app.locals.callbackUrl = url)
  )
);
app.use(logRequests);
app.get("/", async (req, res, next) => {
  console.log("ARE WE HERE??????????");
  const baseUrl = app?.locals?.callbackUrl;
  const returnJson = {
    message: "Hello from the root!",
    authRoutes: {
      exchangeTokens: {
        url: `${baseUrl}/auth/exchange_token`,
        example:
          "This is used as the callback URL to let Strava exchange tokens and validate our app.",
      },
    },
    stravaRoutes: {
      deleteCurrentSubscription: `${baseUrl}/strava/delete`,
      deleteSubscriptionById: `"${baseUrl}/strava/delete/SUBSCRIPTION_ID_TO_DELETE"`,
      subscribeToWebhook: `${baseUrl}/strava/subscribe`,
      testStravaWebhookEvent: {
        url: `"${baseUrl}/strava/test/webhook/STRAVA_EVENT_TO_TEST"`,
        example: `${baseUrl}/strava/webhook/WeightTraining`,
      },
      validateStravaSubscription: `${baseUrl}/strava/webhook`,
      viewSubscriptions: `${baseUrl}/strava/view`,
    },
    notionRoutes: {
      testUpdateRelations: {
        url: `"${baseUrl}/notion/test/relation/EVENT_TYPE"`,
        example: `${baseUrl}/notion/test/relation/Run`,
      },
      testLogToNotion: {
        url: `"${baseUrl}/notion/test/log/LOG_TITLE"`,
        example: `${baseUrl}/notion/test/relation/log-title-1`,
        additionalFunctionality:
          "You can include 'error' in the log title to test logNotionError(), otherwise it will use logNotionItem()",
      },
    },
  };
  res.status(200).json(returnJson);
});

app.use("/auth", authRoutes);
// We want this after auth since it depends on us being authed
app.use(refreshStravaToken);
app.use("/strava", stravaRoutes);
app.use("/notion", notionRoutes);

app.get("/health", async (req, res, next) => {
  console.log(
    "Checking application health...",
    app.locals.callbackUrl,
    typeof app.locals.access_token === "string"
  );
  healthCheck(
    app.locals.callbackUrl,
    app.locals.challengeId,
    res,
    app.locals.access_token
  );
  // What else could be checked?
  next();
});

app.use(notFound);
app.use(errorHandler);

function notFound(err, req, res, next) {
  res
    .status(404)
    .send({ error: "Not found!", status: 404, url: req.originalUrl });
}

function errorHandler(err, req, res, next) {
  console.error("errorHandler", err);
  const stack = process.env.NODE_ENV !== "production" ? err.stack : undefined;
  logNotionError(`errorHandler ERROR`, stack);
  res.status(500).send({ error: err.message, stack, url: req.originalUrl });
}
