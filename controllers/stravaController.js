require("dotenv").config();
const FormData = require("form-data");
const fetch = require("node-fetch");

var challengeId = "";
const callbackUrl = "";

// Test curl to delete the subscription
// curl -X DELETE https://www.strava.com/api/v3/push_subscriptions/SUBSCRIPTION_ID \
//     -F client_id=CLIENT_ID \
//     -F client_secret=CLIENT_SECRET

const deleteSubscription = async (subscriptionId = challengeId) => {
  console.log("Deleting subscription...", challengeId, subscriptionId);
  const body = new FormData();
  body.append("client_id", process.env.CLIENT_ID);
  body.append("", "\\");
  body.append("client_secret", process.env.CLIENT_SECRET);

  try {
    const request = await fetch(
      `https://www.strava.com/api/v3/push_subscriptions/${subscriptionId}`,
      {
        body,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        method: "DELETE",
      }
    );
  
    const response = await request.json();
    console.log("DELETE RESPONSE:", response);
    return res.status(200).json({ message: "Delete successfull?" });
  } catch(e) {
    console.log(`ERROR: error fetching https://www.strava.com/api/v3/push_subscriptions/${subscriptionId}, 
    
    ${e}`)
    return res.status(500).json({ message: "error deleting subscription" });
  }
};

const getFallback = (req, res) => {
  return res.status(200).json({ message: "hello from the strava route" });
};

const postWebhookSubscription = async () => {
  // Test curl to subscribe to the /webhook GET route
  //   curl -X POST \
  //     https://www.strava.com/api/v3/push_subscriptions \
  //     -F client_id=CLIENT_ID \
  //     -F client_secret=CLIENT_SECRET \
  //     -F callback_url=https://BASE_URL/strava/webhook \
  //     -F verify_token=VERIFY_TOKEN
  const body = new FormData();
  body.append("client_id", process.env.CLIENT_ID);
  body.append("", "\\");
  body.append("client_secret", process.env.CLIENT_SECRET);
  body.append("", "\\");
  body.append("callback_url", `${callbackUrl}/strava/webhook`);
  body.append("", "\\");
  body.append("verify_token", process.env.VERIFY_TOKEN);

  try {
    fetch("https://www.strava.com/api/v3/push_subscriptions", {
      body,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      method: "POST",
    });
    return;
  } catch(e) {
    
  }
};

// Creates the endpoint for our webhook, supposed to be hit when an activity is created
const recieveWebhookEvent = (req, res) => {
  console.log("webhook event received!", req.query, req.body);
  return res.status(200).send("EVENT_RECEIVED");
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
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  // Parses the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Verifies that the mode and token sent are valid
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      challengeId = challenge;
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
const validateSubscription = async (callbackUrl, challenge) => {
  const request = await fetch(
    `${callbackUrl}?hub.verify_token=${process.env.VERIFY_TOKEN}&hub.challenge=${challenge}&hub.mode=subscribe`
  );
  const response = await request.json();
  console.log("Validate Subscription response:", response);
  return response;
};

const viewSubscription = async () => {
  // Test curl to view the subscription
  //   curl -G https://www.strava.com/api/v3/push_subscriptions \
  //       -d client_id=CLIENT_ID \
  //       -d client_secret=CLIENT_SECRET
  const request = await fetch(
    "https://www.strava.com/api/v3/push_subscriptions",
    {
      body: `client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "GET",
    }
  );

  const response = await request.json();
  return;
};

module.exports = {
  deleteSubscription,
  getFallback,
  postWebhookSubscription,
  recieveWebhookEvent,
  subscribeToWebhook,
  validateSubscription,
  viewSubscription,
};
