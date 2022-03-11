require("dotenv").config();

const { checkTimeExpired } = require("../utils/unitConversionUtils");
const { getLocals, setLocals } = require("../utils/localsUtils");
const { responseBuilder } = require("../utils/httpUtils");
const { LOCAL_KEYS } = require("../constants");

const { ACCESS_TOKEN, expires_at, refresh_token } = LOCAL_KEYS;

const logRequests = (req, res, next) => {
  // could I use this to re-auth if the token is old?
  if (!app?.locals?.stravaMiddleWareInitalized) {
    console.log(`
        First instance of our middleware: 
        ${req?.method}: "${req?.url}" 
        originalUrl: "${req?.originalUrl}"
    `);
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

const setNewCreds = async (
  req,
  newAccessToken,
  newExpireTime,
  newRefreshToken
) => {
  try {
    setLocals(req, ACCESS_TOKEN, newAccessToken);
    setLocals(req, expires_at, newExpireTime);
    setLocals(req, refresh_token, newRefreshToken);
    return true;
  } catch (e) {
    console.error("Error setting new credentials:", e);
    return false;
  }
};

const fetchNewTokens = (currentRefreshToken) => {
  const requestOptions = {
    body:
      `client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${currentRefreshToken}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  };
  const response = responseBuilder(
    "https://www.strava.com/oauth/token",
    "Error fetching new access tokens",
    requestOptions
  );
  return response
};

const refreshTokens = (req, res, next) => {
  let timeExpired = checkTimeExpired(getLocals(req, expires_at));
  console.log("Time expired?", timeExpired)
  let currentRefreshToken = getLocals(req, refresh_token)
  if (timeExpired) {
    const newCreds = fetchNewTokens(currentRefreshToken)
    console.log(`
        New Credentials:
        ${JSON.stringify(newCreds)}
    `)
    return next()
  }
  return next()
};

module.exports = {
  logRequests,
  refreshTokens,
};
