require("dotenv").config();
const fetch = require("node-fetch");
const { LOCALS_KEYS } = require("../constants")
const { getLocals, setLocals } = require("../utils/localsUtils")
const { responseBuilder } = require("../utils/httpUtils")
const { logObject } = require("../utils/jsUtils")

const fetchOauthToken = async (code, res, req) => {
  // TODO should we use the response builder for this? probably..
  // const requestOptions = {
  //   method: "POST",
  //   body: `client_id=${clientId}&client_secret=${process.env.CLIENT_SECRET}&code=${code}&grant_type=authorization_code`,
  // }
  // const errorMessage = "ERROR: error exchanging tokens with https://www.strava.com/api/v3/oauth/token"
  // const response = responseBuilder("https://www.strava.com/api/v3/oauth/token", res, errorMessage, requestOptions)
  // console.log("response:", response)
  try {
    const bodyThing = `client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${code}&grant_type=authorization_code`
    console.log(":::::::::::", bodyThing,)
    const request = await fetch("https://www.strava.com/api/v3/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: bodyThing,
    });
    const response = await request.json();
    console.log("response:", response);
    // Set the app.locals for the authentication
    // TODO obfuscate these? Maybe create a getter and setter?
    setLocals(req, LOCALS_KEYS.expires_at, response?.expires_at)
    setLocals(req, LOCALS_KEYS.refresh_token, response?.refresh_token)
    setLocals(req, LOCALS_KEYS.access_token, response?.access_token)
    res.status(200).json({message: "exchanging tokens..."})
    return response;
  } catch(e) {
    console.log("ERROR: error exchanging tokens with https://www.strava.com/api/v3/oauth/token", e)
    return res.status(500).json({message: "ERROR: error exchanging tokens with https://www.strava.com/api/v3/oauth/token"})
  }
};

const exchangeTokens = (req, res) => {
  console.log(`GET "/exchange_token"`);
  // Log out the request just in case
  logObject(req)
  if (req.query.code) {
    return fetchOauthToken(req.query.code, res, req);
  } else {
    console.log("NO req.query.code");
    return res.status(404).json({message: "ERROR: request query code not found."})
  }
};

module.exports = {
  exchangeTokens,
};
