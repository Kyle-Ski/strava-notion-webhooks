require("dotenv").config();

const { checkTimeExpired } = require("./utils/unitConversionUtils");
const { getLocals, setLocals } = require("./utils/localsUtils");
const { responseBuilder } = require("./utils/httpUtils");
const { logNotionError, logNotionItem } = require("./utils/notionUtils")
const { LOCALS_KEYS } = require("./constants");

const {
  ACCESS_TOKEN,
  EXPIRES_AT,
  REFRESH_TOKEN,
} = LOCALS_KEYS;

/**
 * Used at the top level of the app, logs out the req.method, req.url, and req.originalUrl
 * @param {Object} req 
 * @param {Object} res 
 * @param {Object} next 
 */
const logRequests = (req, res, next) => {
  console.log(`
      Using our logging middleware: 
      ${req?.method}: "${req?.url}"
      originalUrl: "${req?.originalUrl}"
    `);
  next();
};

/**
 * Sets new access token, expiration time, and new refresh token to our app.locals
 * @param {Object} newCredentials { access_token, expires_at, refresh_token }
 * @param {Object} req The req object from the route
 * @returns 
 */
const setNewCreds = async (newCredentials, req) => {
  console.log("Setting new creds:", newCredentials);
  const { access_token, expires_at, refresh_token } = newCredentials;
  try {
    setLocals(req, ACCESS_TOKEN, access_token);
    setLocals(req, EXPIRES_AT, expires_at);
    setLocals(req, REFRESH_TOKEN, refresh_token);
    return true;
  } catch (e) {
    console.error("Error setting new credentials:", e);
    logNotionError("Error setting new credentials:", e)
    return false;
  }
};

/**
 * Fetches a new access token from strava using our refresh token
 * @param {String} currentRefreshToken The most recent refresh token from app.locals
 * @returns 
 */
const fetchNewTokens = async (currentRefreshToken) => {
  const requestOptions = {
    body: `client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${currentRefreshToken}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  };
  const response = await responseBuilder(
    "https://www.strava.com/oauth/token",
    "Error fetching new access tokens",
    requestOptions
  );
  return response;
};

/**
 * Checks to see if we need to refresh our access token before any other requests are made.
 * If our current access token has expired, then let's fetch new ones and set them to app.locals
 * @param {Object} req 
 * @param {Object} res 
 * @param {Object} next 
 * @returns 
 */
const refreshStravaToken = async (req, res, next) => {
  let timeExpired = checkTimeExpired(getLocals(req, EXPIRES_AT));
  console.log("Time expired?", timeExpired);
  let currentRefreshToken = getLocals(req, REFRESH_TOKEN);
  if (timeExpired && currentRefreshToken) {
    const newCreds = await fetchNewTokens(currentRefreshToken);
    if (!newCreds?.status || !newCreds?.data || newCreds?.status !== 200) {
      console.error("Error refreshing the tokens...", JSON.stringify(newCreds));
      logNotionError("Error refreshing the tokens", newCreds)
      return next();
    }
    logNotionItem("Refresh Token Success", { message: "setting new creds" })
    setNewCreds(newCreds.data, req);
    return next();
  }

  if(!currentRefreshToken) {
    let errMessage = "Error refreshing the tokens, no refresh_token present"
    logNotionError(errMessage, {message: "no refresh_token present"})
    console.error(errMessage)
    return next()
  }
  console.log("Time hasn't expired, so let's just keep on doing things");
  return next();
};

module.exports = {
  logRequests,
  refreshStravaToken,
};
