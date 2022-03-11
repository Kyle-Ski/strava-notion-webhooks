"use strict";
require("dotenv").config();

const ngrok = require("ngrok");
const express = require("express"),
  bodyParser = require("body-parser"),
  app = express().use(bodyParser.json());

const { logObject } = require("./utils/jsUtils");
const { healthCheck } = require("./controllers/stravaController");
const authRoutes = require("./routes/authRoutes");
const stravaRoutes = require("./routes/stravaRoutes");
const notionRoutes = require("./routes/notionRoutes");
const expressPort = 8080;

const connectNgrok = async (port) => {
  console.log(
    `webhook is listening on ${port}, connecting ngrok to the same..`
  );
  try {
    const url = await ngrok.connect({
      authtoken: process.env.NGROK_AUTH_TOKEN,
      addr: port,
    });
    app.locals.callbackUrl = url;
    console.log(
      "url:",
      url.split("https://")[1],
      `Auth URL: ${`https://www.strava.com/oauth/authorize?client_id=78993&response_type=code&redirect_uri=${url}/auth/exchange_token&approval_prompt=force&scope=read_all,read,activity:read`}`
    );
    return;
  } catch (e) {
    console.error("ERROR: error connecting ngrok:", e);
    throw new Error("Error connecting index.js to ngrok:", e);
  }
};

const stravaMiddleWare = (req, res, next) => {
  // could I use this to re-auth if the token is old?
  if (!app?.locals?.stravaMiddleWareInitalized) {
    console.log(
      `First instance of our middleware: ${req?.method}: "${req?.url}"`
    );
    app.locals.stravaMiddleWareInitalized = true;
    return next();
  }
  console.log(`
    Using our middleware: 
    ${req?.method}: "${req?.url}"
    originalUrl: "${req?.originalUrl}"
  `);
  next();
};

// Sets server port and connects ngrok to the same port
app.listen(process.env.PORT || expressPort, connectNgrok(expressPort));
app.use(stravaMiddleWare);

app.get("/", (req, res, next) => {
  res
    .status(200)
    .json({ message: "Hello! Looks like you found the root address!" });

  logObject(req);
  next();
});

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

app.use("/auth", authRoutes);
app.use("/strava", stravaRoutes);
app.use("/notion", notionRoutes);

// app.use(notFound);
app.use(errorHandler);

// function notFound(err, req, res, next) {
//   res
//     .status(404)
//     .send({ error: "Not found!", status: 404, url: req.originalUrl });
// }

function errorHandler(err, req, res, next) {
  console.error("errorHandler", err);
  const stack = process.env.NODE_ENV !== "production" ? err.stack : undefined;
  res.status(500).send({ error: err.message, stack, url: req.originalUrl });
}
