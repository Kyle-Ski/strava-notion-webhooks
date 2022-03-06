"use strict";
require("dotenv").config();

// TODO capture these upon first creation
const callbackUrl = ``
const challengeId = ``

const express = require("express"),
  bodyParser = require("body-parser"),
  app = express().use(bodyParser.json());

const { validateSubscription } = require('./controllers/stravaController')
const { connectNgrok } = require('./controllers/ngrokController')
const authRoutes = require('./routes/authRoutes')
const stravaRoutes = require('./routes/stravaRoutes')
const notionRoutes = require('./routes/notionRoutes')
const expressPort = 8080

// Sets server port and connects ngrok to the same port
app.listen(process.env.PORT || expressPort, connectNgrok(expressPort));

app.get("/", (req, res) => {
  console.log(`GET "/"`)
  res.status(200).json({message: "Hello! Looks like you found the root address!"})

  //TODO maybe make this into a logging function?
  for(let key in req.params) {
    console.log(`PARAMS: key: ${key}, value: ${req.params[key]}`)
  }
  for(let key in req.body) {
    console.log(`BODY: key: ${key}, value: ${req.body[key]}`)
  }
  for(let key in req.query) {
    console.log(`QUERY: key: ${key}, value: ${req.query[key]}`)
  }
  return
})

app.get("/health", (req, res) => {
  console.log("Checking application health...")
  validateSubscription(callbackUrl, challengeId)
  //What else could be checked?
  res.status(200).json({message: "Health check complete, app running."})
})

app.use('/auth', authRoutes)
app.use('/strava', stravaRoutes)
app.use('/notion', notionRoutes)

// https://www.strava.com/oauth/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=NGROK_CALLBACK_URL/auth/exchange_token&approval_prompt=force&scope=read_all,read,activity:read
    