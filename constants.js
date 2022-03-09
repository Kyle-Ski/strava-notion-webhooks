const LOCALS_KEYS = {
  ACCESS_TOKEN: "access_token", // Strava short lived access token
  CALLBACK_URL: "callbackUrl", // ngrok url
  challengeId: "challengeId", // Id used to auth with Strava
  expires_at: "expires_at",
  refresh_token: "refresh_token", // Long lived refresh token
  stravaMiddleWareInitalized: "stravaMiddleWareInitalized",
  SUBSCRIPTION_ID: "subscriptionId", // Strava subscription id
};

const WEBHOOK_EVENTS = { // Strava webhook events
  create: "create",
  update: "update",
  delete: "delete",
};

const WEBHOOK_EVENT_TYPES = { // Strava webhook activity events
  activity: "activity",
  hike: "Hike"
};

/**
 * strava.activities.get({
    access_token: getLocals(req, LOCALS_KEYS.ACCESS_TOKEN),
    id: "6606840419",
  });
 */
const STRAVA_ACTIVITIES_GET = {
  
}

module.exports = {
  LOCALS_KEYS,
  WEBHOOK_EVENTS,
  WEBHOOK_EVENT_TYPES,
};
