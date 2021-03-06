require("dotenv").config();
const fetch = require("node-fetch");
const { LOCALS_KEYS } = require("../constants");
const { getLocals, setLocals } = require("../utils/localsUtils");
const { logNotionError } = require("../utils/notionUtils");


/**
 * Exchanges tokens from Strava's Oauth service, authorizing our app to access the user's data.
 * We will get our refresh_token and access_token from this exchange.
 * @param {number} code short lived code from strava used to get our tokens
 * @param {*} res 
 * @param {*} req 
 */
const fetchOauthToken = async (code, res, req) => {
  //https://www.strava.com/oauth/accept_application?client_id=78993&redirect_uri=BASE_URL:https%3A%2F%2F4c0a-65-156-41-108.ngrok.io%2Fauth%2Fexchange_token&response_type=code&scope=activity%3Aread%2Cread%2Cread_all
  // TODO the above url accepts the application and sends us to our app to exchange tokens, can we automate this? Should we?
  // let url = getLocals(req, LOCALS_KEYS.CALLBACK_URL)
  // let accpetApplicationUrl = `https://www.strava.com/oauth/accept_application?client_id=${process.env.CLIENT_ID}&redirect_uri=https%3A%2F%2F${url.split("https://")[1]}%2Fauth%2Fexchange_token&response_type=code&scope=activity%3Aread%2Cread%2Cread_all`
  // TODO should we use the response builder for this? probably..
  try {
    const bodyThing = `client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${code}&grant_type=authorization_code`;
    const request = await fetch("https://www.strava.com/api/v3/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyThing,
    });
    console.log("request ok?", request.ok, JSON.stringify(request));
    const response = await request.json();
    console.log("response:", response);
    // Set the app.locals for the authentication
    // TODO obfuscate these?
    setLocals(req, LOCALS_KEYS.EXPIRES_AT, response?.expires_at);
    setLocals(req, LOCALS_KEYS.REFRESH_TOKEN, response?.refresh_token);
    setLocals(req, LOCALS_KEYS.ACCESS_TOKEN, response?.access_token);
    res
      .status(200)
      .json({
        message: "exchanging tokens...",
        subscribeUrl: `${getLocals(
          req,
          LOCALS_KEYS.CALLBACK_URL
        )}/strava/subscribe`,
      });
    // return response;
  } catch (e) {
    console.error(
      "ERROR: error exchanging tokens with https://www.strava.com/api/v3/oauth/token",
      e
    );
    logNotionError("Error exchanging tokens with Strava", e)
    res
      .status(500)
      .json({
        message:
          "ERROR: error exchanging tokens with https://www.strava.com/api/v3/oauth/token",
      });
  }
};

/**
 * The fallback function for the "auth/" route
 * @param {Object} req 
 * @param {Object} res 
 * @param {Object} next 
 */
const getFallback = (req, res, next) => {
  res.status(200).json({ message: "Hello from the auth route" });
};

/**
 * Exchanges our tokens with Strava, authorizing our app to use the user's data.
 * @param {Object} req 
 * @param {Object} res 
 * @param {Object} next 
 * @returns 
 */
const exchangeTokens = (req, res, next) => {
  if (req.query.code) {
    return fetchOauthToken(req.query.code, res, req);
  } else {
    console.log("NO req.query.code");
    res
      .status(404)
      .json({ message: "ERROR: request query code from strava not found." });
  }
};

module.exports = {
  exchangeTokens,
  getFallback,
};
