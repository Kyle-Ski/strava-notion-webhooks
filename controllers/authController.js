require("dotenv").config();
const fetch = require("node-fetch");
const { LOCALS_KEYS } = require("../constants");
const { getLocals, setLocals } = require("../utils/localsUtils");
const { logNotionError } = require("../utils/notionUtils");

/**
 * Exchanges tokens from Strava's Oauth service, authorizing our app to access the user's data.
 * @param {number} code - short-lived code from Strava used to get our tokens.
 * @param {*} res - Express response object.
 * @param {*} req - Express request object.
 */
const fetchOauthToken = async (code, res, req) => {
  try {
    const bodyParams = new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: code,
      grant_type: "authorization_code",
    });

    const request = await fetch("https://www.strava.com/api/v3/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams.toString(),
    });

    if (!request.ok) {
      throw new Error(`Failed to exchange tokens. Status: ${request.status}`);
    }

    const response = await request.json();
    console.log("Strava OAuth response:", response);

    // Set token information - Consider moving tokens to a database if needed for persistent state
    setLocals(req, LOCALS_KEYS.EXPIRES_AT, response?.expires_at);
    setLocals(req, LOCALS_KEYS.REFRESH_TOKEN, response?.refresh_token);
    setLocals(req, LOCALS_KEYS.ACCESS_TOKEN, response?.access_token);

    res.status(200).json({
      message: "Successfully exchanged tokens.",
      subscribeUrl: `${getLocals(req, LOCALS_KEYS.CALLBACK_URL)}/strava/subscribe`,
    });

  } catch (error) {
    console.error("Error exchanging tokens with Strava API:", error);
    logNotionError("Error exchanging tokens with Strava", error);
    res.status(500).json({
      message: "Error exchanging tokens with Strava API.",
      details: error.message,
    });
  }
};

/**
 * Fallback function for the "auth/" route.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Object} next - Express next middleware function.
 */
const getFallback = (req, res, next) => {
  res.status(200).json({ message: "Hello from the auth route" });
};

/**
 * Exchanges our tokens with Strava, authorizing our app to use the user's data.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Object} next - Express next middleware function.
 * @returns 
 */
const exchangeTokens = (req, res, next) => {
  if (req.query.code) {
    return fetchOauthToken(req.query.code, res, req);
  } else {
    console.log("No request query code found.");
    res.status(400).json({ message: "Error: Request query code from Strava not found." });
  }
};

module.exports = {
  exchangeTokens,
  getFallback,
};
