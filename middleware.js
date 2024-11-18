"use strict";
require("dotenv").config();

const { checkTimeExpired } = require("./utils/unitConversionUtils");
const supabase = require("./utils/supabaseClient");
const { responseBuilder } = require("./utils/httpUtils");
const { logNotionError, logNotionItem } = require("./utils/notionUtils");
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
 * Fetches a new access token from Strava using our refresh token
 * @param {String} currentRefreshToken The most recent refresh token from Supabase
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
 * If our current access token has expired, then let's fetch new ones and store them in Supabase.
 * @param {Object} req 
 * @param {Object} res 
 * @param {Object} next 
 * @returns 
 */
const refreshStravaToken = async (req, res, next) => {
  const userId = req.query.user_id; // Assuming user ID is passed in request
  try {
    // Fetch token from Supabase
    const { data, error } = await supabase
      .from("tokens")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      throw new Error(`Token retrieval error: ${error?.message || "No token found"}`);
    }

    // Check if the token is expired
    let timeExpired = checkTimeExpired(data.expires_at);
    console.log("Time expired?", timeExpired);

    if (timeExpired) {
      const newCreds = await fetchNewTokens(data.refresh_token);
      if (!newCreds?.status || !newCreds?.data || newCreds?.status !== 200) {
        console.error("Error refreshing the tokens...", JSON.stringify(newCreds));
        logNotionError("Error refreshing the tokens", newCreds);
        return next();
      }
      logNotionItem("Refresh Token Success", { message: "Setting new creds" });

      // Update Supabase with new tokens
      const { error: updateError } = await supabase
        .from("tokens")
        .update({
          access_token: newCreds.data.access_token,
          refresh_token: newCreds.data.refresh_token,
          expires_at: newCreds.data.expires_at,
        })
        .eq("user_id", userId);

      if (updateError) {
        throw new Error(`Supabase update error: ${updateError.message}`);
      }
      req.access_token = newCreds.data.access_token;
    } else {
      req.access_token = data.access_token;
    }

    next();
  } catch (error) {
    console.error("Error refreshing Strava token:", error);
    logNotionError("Error refreshing Strava token", error);
    res.status(500).json({ message: "Error refreshing Strava token.", details: error.message });
  }
};

module.exports = {
  logRequests,
  refreshStravaToken,
};
