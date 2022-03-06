require("dotenv").config();
const FormData = require("form-data");
const fetch = require("node-fetch");
const { LOCALS_KEYS } = require("../constants")
const { getLocals, setLocals } = require("../utils/localsUtils")
const { responseBuilder, sendResponse } = require("../utils/httpUtils");

// Test curl to delete the subscription
// curl -X DELETE https://www.strava.com/api/v3/push_subscriptions/SUBSCRIPTION_ID \
//     -F client_id=CLIENT_ID \
//     -F client_secret=CLIENT_SECRET

const deleteSubscription = async (req, res) => {
  const subscriptionId = getLocals(req, LOCALS_KEYS.subscriptionId)
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

  sendResponse(res, response, "Delete successfull?");
};

const getFallback = (req, res) => {
  return sendResponse(res, { status: 200 }, "hello from the strava route");
};

const postWebhookSubscription = async (req, res) => {
  const baseUrl = getLocals(req, LOCALS_KEYS.callbackUrl)
  // Test curl to subscribe to the /webhook GET route
  //   curl -X POST \
  //     https://www.strava.com/api/v3/push_subscriptions \
  //     -F client_id=CLIENT_ID \
  //     -F client_secret=CLIENT_SECRET \
  //     -F callback_url=https://BASE_URL/strava/webhook \
  //     -F verify_token=VERIFY_TOKEN
  const body = new FormData();
  const callback = `${baseUrl}/strava/webhook`
  const token = getLocals(req, LOCALS_KEYS.access_token)
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
  console.log("SUBSCRIBE RESPONSE:", response)
  if (response.status == 200 && response?.data?.id != undefined) {
    setLocals(req, LOCALS_KEYS.subscriptionId, response?.data?.id)
  }
  sendResponse(res, response, "Does I need to be sendng this response?");
};

// Creates the endpoint for our webhook, supposed to be hit when an activity is created
const recieveWebhookEvent = (req, res) => {
  console.log("webhook event received!", req.query, req.body);
  return sendResponse(res, { status: 200 }, "EVENT_RECEIEVED");
};

// test POST to our callback URL to see if it responds with 200
//   curl -X POST \
//    https://8765-65-156-41-108.ngrok.io/strava/webhook \
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
  const VERIFY_TOKEN = getLocals(req, LOCALS_KEYS.access_token)
  // Parses the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Verifies that the mode and token sent are valid
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      setLocals(req, LOCALS_KEYS.challengeId, challenge)
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
  return sendResponse(res, response, healthCheckMessage);
};

const viewSubscription = async (req, res) => {
  // Test curl to view the subscription
  //   curl -G https://www.strava.com/api/v3/push_subscriptions \
  //       -d client_id=CLIENT_ID \
  //       -d client_secret=CLIENT_SECRET
  const requestOptions = {
    body: `client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "GET",
  };
  const response = responseBuilder(
    "https://www.strava.com/api/v3/push_subscriptions",
    `Error while trying to view the subscriptions.`,
    requestOptions
  );
  return sendResponse(res, response, response.data);
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
