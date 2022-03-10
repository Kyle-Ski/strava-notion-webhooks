require("dotenv").config();
const FormData = require("form-data");
const {
  LOCALS_KEYS,
  WEBHOOK_EVENTS,
  WEBHOOK_EVENT_TYPES,
} = require("../constants");
const { getLocals, setLocals } = require("../utils/localsUtils");
const { responseBuilder, sendResponse } = require("../utils/httpUtils");
const {
  metersPerSecToMph,
  metersToFeet,
  metersToMiles,
} = require("../utils/unitConversionUtils");
const { addNotionItem, deleteNotionPage, fmtNotionObject } = require("../utils/notionUtils");
const { getActivityById } = require("../utils/stravaUtils");

const { ACCESS_TOKEN, CALLBACK_URL, SUBSCRIPTION_ID } = LOCALS_KEYS;

const deleteSubscription = async (req, res) => {
  const subscriptionId = getLocals(req, SUBSCRIPTION_ID);
  console.log("Deleting subscription...", subscriptionId);
  const body = new FormData();
  body.append("client_id", process.env.CLIENT_ID);
  body.append("", "\\");
  body.append("client_secret", process.env.CLIENT_SECRET);
  const requestOptions = {
    body,
    method: "DELETE",
  };

  const response = await responseBuilder(
    `https://www.strava.com/api/v3/push_subscriptions/${subscriptionId}`,
    `Error deleting subscription: ${subscriptionId}`,
    requestOptions
  );

  sendResponse(res, response, { message: "Delete successfull?" });
};

const getFallback = async (req, res) => {
  const payload = await getActivityById(
    "6606840419",
    getLocals(req, LOCALS_KEYS.ACCESS_TOKEN)
  );
  console.log("GET /", payload);
  if (!payload) {
    return sendResponse(
      res,
      { status: 500 },
      { message: "Error getting strava activity for '/'" }
    );
  }
  return sendResponse(
    res,
    { status: 200 },
    { message: "hello from the strava route" }
  );
};

const postWebhookSubscription = async (req, res) => {
  const baseUrl = getLocals(req, CALLBACK_URL);
  // Test curl to subscribe to the /webhook GET route
  //   curl -X POST \
  //     https://www.strava.com/api/v3/push_subscriptions \
  //     -F client_id=CLIENT_ID \
  //     -F client_secret=CLIENT_SECRET \
  //     -F callback_url=https://BASE_URL/strava/webhook \
  //     -F verify_token=VERIFY_TOKEN
  const body = new FormData();
  const callback = `${baseUrl}/strava/webhook`;
  const token = getLocals(req, ACCESS_TOKEN);
  body.append("client_id", process.env.CLIENT_ID);
  body.append("client_secret", process.env.CLIENT_SECRET);
  body.append("callback_url", callback);
  body.append("verify_token", token);

  const requestOptions = {
    body,
    method: "POST",
  };

  const response = await responseBuilder(
    "https://www.strava.com/api/v3/push_subscriptions",
    "Error attempting to subscribe to the webhook.",
    requestOptions
  );
  console.log("SUBSCRIBE RESPONSE:", response);
  if (response.status == 200 && response?.data?.id != undefined) {
    setLocals(req, SUBSCRIPTION_ID, response?.data?.id);
    sendResponse(res, response, {
      message: "Subscription Sucess!",
      deleteSubscription: `${getLocals(
        req,
        LOCALS_KEYS.CALLBACK_URL
      )}/strava/subscribe/delete`,
    });
  } else {
    console.warn(`Error subscribing to webhook, Status: ${response.status}`);
  }
};

/* Webhook event example:
{
  aspect_type: 'delete',
  event_time: 1646695506,
  object_id: 6789384442,
  object_type: 'activity',
  owner_id: 46337708,
  subscription_id: 213604,
  updates: {}
}*/
/**
 * Creates the endpoint for our webhook, supposed to be hit when an activity is created
 * @param {Object} req req object from the route
 * @param {Object} res res object from the route
 * @returns
 */
const recieveWebhookEvent = async (req, res) => {
  const token = getLocals(req, LOCALS_KEYS.ACCESS_TOKEN);
  console.log("webhook event received!", req.query, req.body);
  switch (req?.body?.object_type) {
    case WEBHOOK_EVENT_TYPES.activity:
      switch (req?.body?.aspect_type) {
        case WEBHOOK_EVENTS.create:
          // Create Notion page, check to see we haven't already
          const payload = await getActivityById(req.body.object_id, token);
          const newNotionPage = {
            // we should use fmtUpdate()?
            title: payload?.name,
            id: JSON.stringify(payload?.id),
            startDate: payload?.start_date_local,
            distance: metersToMiles(payload?.distance),
            elevationGain: metersToFeet(payload?.total_elevation_gain),
            type: payload?.type,
            averageHeartRate: payload?.average_heartrate,
            maxHeartRate: payload?.max_heartrate,
            maxElevation: metersToFeet(payload?.elev_high),
            minElevation: metersToFeet(payload?.elev_low),
            averageSpeed: metersPerSecToMph(payload?.average_speed),
          };
          addNotionItem(payload);
          console.log("Attempting to add:", newNotionPage);
          // console.log("Created Activity:", JSON.stringify(payload));
          return sendResponse(
            res,
            { status: 200 },
            { message: "EVENT_RECEIEVED" }
          );
        case WEBHOOK_EVENTS.update:
          // Update Notion page, check to see we havent already
          // Updates will be contained in req.body.updates
          const updatedActivity = await getActivityById(
            req?.body?.object_id,
            token
          );
          console.log("---->", JSON.stringify(updatedActivity));
          const thingsToUpdate = await fmtNotionObject(updatedActivity);
          console.log("Updated Activity:", JSON.stringify(thingsToUpdate));
          return sendResponse(
            res,
            { status: 200 },
            { message: "EVENT_RECEIEVED" }
          );
        case WEBHOOK_EVENTS.delete:
          const allThings = await deleteNotionPage(req?.body?.object_id);
          console.log(
            "Delete Activity:",
            JSON.stringify(req?.body),
            JSON.stringify(allThings)
          );
          // Delete Notion Page, check to see we haven't already
          return sendResponse(
            res,
            { status: 200 },
            { message: "EVENT_RECEIEVED" }
          );
        default:
          console.warn(
            `WARNING: Unexpected strava aspect_type: ${req?.body?.aspect_type}`
          );
          return sendResponse(
            res,
            { status: 200 },
            { message: "EVENT_RECEIEVED" }
          );
      }
    default:
      console.warn(
        `Warning: Unexpected strava object_type: ${req?.body?.object_type}`
      );
      return sendResponse(
        res,
        { status: 200 },
        { message: "EVENT_RECEIEVED, unexpected object type" }
      );
  }
};

// test POST to our callback URL to see if it responds with 200
//   curl -X POST \
//    https://BASE_URL/strava/webhook \
//    -H ‘Content-Type: application/json’ \
//    -d ‘{
//         “aspect_type”: “create”,
//         “event_time”: 1549560669,
//         “object_id”: 666,
//         “object_type”: “activity”,
//         “owner_id”: 78993,
//         “subscription_id”: 213539
//       }’

const subscribeToWebhook = (req, res) => {
  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = getLocals(req, LOCALS_KEYS.ACCESS_TOKEN);
  // Parses the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Verifies that the mode and token sent are valid
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      setLocals(req, LOCALS_KEYS.challengeId, challenge);
      console.log("WEBHOOK_VERIFIED", challenge);
      return res.json({ "hub.challenge": challenge });
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      return res.sendStatus(403);
    }
  }
};

/**
 * Validate Subscription
 * curl -G https://BASEURL.ngrok.io/strava/webhook?hub.verify_token=VERIFY_TOKEN&hub.challenge=CHALLENGE_CODE&hub.mode=subscribe
 */
const healthCheck = async (callbackUrl, challenge, res, access_token) => {
  // Test fetch to open free api
  // const response = await responseBuilder(
  //   `https://www.7timer.info/bin/astro.php?lon=113.2&lat=23.1&ac=0&unit=metric&output=json&tzshift=0`,
  //   "Error while checking health of the app"
  // );
  const response = await responseBuilder(
    `${callbackUrl}?hub.verify_token=${access_token}&hub.challenge=${challenge}&hub.mode=subscribe`,
    "Error while checking health of the app"
  );
  console.log("Health Check response:", response);
  const healthCheckMessage = "Health check complete, everything looking ok.";
  return sendResponse(res, response, { message: healthCheckMessage });
};

const viewSubscription = async (req, res) => {
  // Test curl to view the subscription
  // curl -G https://www.strava.com/api/v3/push_subscriptions \
  //     -d client_id=CLIENT_ID \
  //     -d client_secret=CLIENT_SECRET
  const access_token = getLocals(req, LOCALS_KEYS.ACCESS_TOKEN);
  const requestOptions = {
    body: `client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&verify_token=${access_token}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  };
  const response = responseBuilder(
    `https://www.strava.com/api/v3/push_subscriptions?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&verify_token=${access_token}`,
    `Error while trying to view the subscriptions.`
  );
  console.log("view ------->", JSON.stringify(response));
  if (!response?.status) {
    console.log("HERE:");
    return sendResponse(res, { status: 200 }, { message: "no subscriptions" });
  }
  return sendResponse(res, response, { message: response.data });
};

module.exports = {
  deleteSubscription,
  getFallback,
  postWebhookSubscription,
  recieveWebhookEvent,
  subscribeToWebhook,
  healthCheck,
  viewSubscription,
};
