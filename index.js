"use strict";
require("dotenv").config();

const ngrok = require("ngrok");
const express = require("express"),
  bodyParser = require("body-parser"),
  app = express().use(bodyParser.json());

const { logObject } = require('./utils/jsUtils')
const { healthCheck } = require('./controllers/stravaController')
const authRoutes = require('./routes/authRoutes')
const stravaRoutes = require('./routes/stravaRoutes')
const notionRoutes = require('./routes/notionRoutes')
const expressPort = 8080

const connectNgrok = async (port) => {
  console.log(
    `webhook is listening on ${port}, connecting ngrok to the same..`
  );
  try {
    const url = await ngrok.connect({
      authtoken: process.env.NGROK_AUTH_TOKEN,
      addr: port,
    });
    app.locals.callbackUrl = url
    console.log("url:", url, `Auth URL: ${`https://www.strava.com/oauth/authorize?client_id=78993&response_type=code&redirect_uri=${url}/auth/exchange_token&approval_prompt=force&scope=read_all,read,activity:read`}`);
    return;
  
  } catch(e) {
    console.log("ERROR: error connecting ngrok:", e)
  }
};

// Sets server port and connects ngrok to the same port
app.listen(process.env.PORT || expressPort, connectNgrok(expressPort));

app.get("/", (req, res) => {
  console.log(`GET "/"`)
  res.status(200).json({message: "Hello! Looks like you found the root address!"})

  logObject(req)
  return
})

app.get("/health", async (req, res) => {
  console.log("Checking application health...", app.locals.callbackUrl, typeof app.locals.access_token === 'string')
  // healthCheck(app.locals.callbackUrl, app.locals.challengeId, res, app.locals.access_token)
  // What else could be checked?
  return
})

app.use('/auth', authRoutes)
app.use('/strava', stravaRoutes)
app.use('/notion', notionRoutes)
    