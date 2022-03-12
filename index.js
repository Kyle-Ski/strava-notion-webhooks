"use strict";
require("dotenv").config();

const express = require("express"),
  bodyParser = require("body-parser"),
  app = express().use(bodyParser.json());

const { logObject } = require("./utils/jsUtils");
const { connectNgrok } = require("./utils/ngrokUtils")
const { logNotionError } = require("./utils/notionUtils")
const { healthCheck } = require("./controllers/stravaController");
const { logRequests, refreshStravaToken } = require("./middleware")
const authRoutes = require("./routes/authRoutes");
const stravaRoutes = require("./routes/stravaRoutes");
const notionRoutes = require("./routes/notionRoutes");
const expressPort = 8080;

// Sets server port and connects ngrok to the same port
app.listen(process.env.PORT || expressPort, connectNgrok(expressPort, process.env.NGROK_AUTH_TOKEN, (url) => app.locals.callbackUrl = url));
app.use(logRequests);

app.get("/", (req, res, next) => {
  res
    .status(200)
    .json({ message: "Hello! Looks like you found the root address!" });

  logObject(req);
  next();
});

app.use("/auth", authRoutes);
// We want this after auth since it depends on us being authed 
app.use(refreshStravaToken)
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
  logNotionError(`errorHandler ERROR`, stack)
  res.status(500).send({ error: err.message, stack, url: req.originalUrl });
}
