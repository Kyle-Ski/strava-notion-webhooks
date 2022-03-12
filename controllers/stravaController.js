require("dotenv").config();
const FormData = require("form-data");
const {
  LOCALS_KEYS,
  WEBHOOK_EVENTS,
  WEBHOOK_EVENT_TYPES,
} = require("../constants");
const { getLocals, setLocals } = require("../utils/localsUtils");
const { responseBuilder } = require("../utils/httpUtils");
const {
  addNotionItem,
  deleteNotionPage,
  fmtNotionObject,
  updateNotionPage,
  getAllStravaPages,
} = require("../utils/notionUtils");
const { getActivityById } = require("../utils/stravaUtils");

const {
  ACCESS_TOKEN,
  CALLBACK_URL,
  SUBSCRIPTION_ID,
  challengeId,
} = LOCALS_KEYS;


/**
 * Deletes a subscription to our strava webhook by it's subscription id.
 * @param {number} subscriptionId subscription id to delete
 * @param {Object} res The response object from the route
 * @returns 
 */
const deleteSubscriptionById = async (subscriptionId, res) => {
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
  console.log("DELETE RESPONSE:", JSON.stringify(response))
  return response
}

/**
 * Deletes the current subscription to our webhook, in this case it's always ours that is stored in locals.
 * @param {Object} req 
 * @param {Object} res 
 * @param {Object} next 
 * @returns 
 */
const deleteSubscription = async (req, res, next) => {
  const subscriptionId = getLocals(req, SUBSCRIPTION_ID);
  const deleteResponse = await deleteSubscriptionById(subscriptionId, res)
  res.status(deleteResponse?.status).json({ message: `${deleteResponse?.data} ${subscriptionId}` });
  return next()
};

/**
 * Deletes a subscription to our webhook by that subscription's id.
 * @param {Object} req 
 * @param {Object} res 
 * @param {Object} next 
 */
const deleteSubscriptionByIdGET = async (req, res, next) => {
  if (typeof Number(req?.params?.id) == 'number') {
    const deleteResponse = await deleteSubscriptionById(req.params.id, res)
    res.status(deleteResponse?.status).json({ message: `${deleteResponse?.data} ${req.params.id}` });
  } else {
    console.warn("ERROR THE ID ISNT A NUMBER", req?.params?.id)
    res.status(400).json({ message: `Bad request, ${req.params.id} is not a number`})
  }
}

/**
 * The fallback function for the "notion/" route. It will also test out a few things.
 * 1. Tests out Strava getActivityById(6606840419)
 * @param {Object} req 
 * @param {Object} res 
 * @param {Object} next 
 */
const getFallback = async (req, res, next) => {
  const payload = await getActivityById(
    "6606840419",
    getLocals(req, ACCESS_TOKEN)
  );
  console.log("GET /", payload);
  if (!payload) {
    res.status(500).json({ message: "Error getting strava activity for '/'" });
    return next();
  }
  res
    .status(200)
    .json({ message: "hello from the strava route!", testGet: { ...payload } });
};

/**
 * This function recieves subscription requests to my (Kyle's) strava. It let's Strava know 
 * what url it should send webhook events to (callback_url).
 * @param {Object} req 
 * @param {Object} res 
 * @param {Object} next 
 * @returns 
 */
const postWebhookSubscription = async (req, res, next) => {
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
  if ((response.status == 200 || response.status == 201) && response?.data?.id != undefined) {
    setLocals(req, SUBSCRIPTION_ID, response?.data?.id);
    res
      .status(200)
      .json({
        message: "Subscription Sucess!",
        deleteSubscription: `${getLocals(
          req,
          CALLBACK_URL
        )}/strava/subscribe/delete`,
        testWebhookCreate: `${getLocals(
          req,
          CALLBACK_URL
        )}/strava/test/webhook/create`,
      });
  } else {
    if (response?.data?.field == "subscription" && response?.data?.code == "already exists") {
      res.status(400).json({ message: "Error subscribing to the webhook.", deleteUrl: `${getLocals(req, CALLBACK_URL)}/strava/subscribe/view`})
      return next()
    }
    console.warn(`Error subscribing to webhook, response: ${JSON.stringify(response)}`);
    res.status(500).json({ message: "Error subscribing to the webhook."})
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
const recieveWebhookEvent = async (req, res, next) => {
  const token = getLocals(req, ACCESS_TOKEN);
  console.log("webhook event received!", req.query, req.body);
  switch (req?.body?.object_type) {
    case WEBHOOK_EVENT_TYPES.activity:
      switch (req?.body?.aspect_type) {
        case WEBHOOK_EVENTS.create:
          // Create Notion page, check to see we haven't already
          const payload = await getActivityById(req.body.object_id, token);
          if (!payload) {
            res.status(200).json({ message: "EVENT_RECEIEVED" });
            return next();
          }
          const formattedNotionObject = fmtNotionObject(payload);
          addNotionItem(formattedNotionObject);
          res.status(200).json({ message: "EVENT_RECEIEVED" });
          return next();
        case WEBHOOK_EVENTS.update:
          // Update Notion page, check to see we havent already
          // Updates will be contained in req.body.updates
          const updatedActivity = await getActivityById(
            req?.body?.object_id,
            token
          );
          if (!updatedActivity) {
            res.status(200).json({ message: "EVENT_RECEIEVED" });
            return next();
          }

          const thingsToUpdate = fmtNotionObject(updatedActivity);
          const allStravaPages = await getAllStravaPages();
          if (!allStravaPages) {
            res.status(200).json({ message: "EVENT_RECEIEVED" });
            return next();
          }
          const notionId = allStravaPages.find((item) => {
            return (
              item.properties.strava_id.rich_text[0].text.content ==
              thingsToUpdate.properties.strava_id.rich_text[0].text.content
            );
          })?.id;
          console.log("Notion thing:", JSON.stringify(notionId));
          // updateNotionPage("615e955ef7c14182a13e091e3b62d89e", )
          updateNotionPage(notionId, thingsToUpdate);
          console.log("Updated Activity:", JSON.stringify(thingsToUpdate));
          res.status(200).json({ message: "EVENT_RECEIEVED" });
          return next();
        case WEBHOOK_EVENTS.delete:
          const allThings = await deleteNotionPage(req?.body?.object_id);
          console.log(
            "Delete Activity:",
            JSON.stringify(req?.body),
            JSON.stringify(allThings)
          );
          // Delete Notion Page, check to see we haven't already
          res.status(200).json({ message: "EVENT_RECEIEVED" });
          return next();
        default:
          console.warn(
            `WARNING: Unexpected strava aspect_type: ${req?.body?.aspect_type}`
          );
          res.status(200).json({ message: "EVENT_RECEIEVED" });
          return next();
      }
    default:
      console.warn(
        `Warning: Unexpected strava object_type: ${req?.body?.object_type}`
      );
      res.status(200).json({ message: "EVENT_RECEIEVED" });
      return next();
  }
};

/**
 * Tests out our "strava/webhook" POST route by sending a fake event with an actual Strava activity ID,
 * so that we can test the entire functionality of the webhook.
 * @param {Object} req 
 * @param {Object} res 
 * @param {Object} next 
 */
const testWebhookEvent = async (req, res, next) => {
  const eventToTest = req.params.event;
  const timeStamp = Math.round(new Date().getTime() / 1000);
  const subscriptionId = getLocals(req, SUBSCRIPTION_ID);
  console.log(
    `Testing Webhook Event: ${eventToTest}, ${timeStamp}, ${subscriptionId}`
  );
  const body = {
    name: `test webhook event ${eventToTest}`,
    aspect_type: eventToTest,
    event_time: timeStamp,
    object_id: 6606840419, // Morning Hike Sun Jan 30th 2022
    object_type: "activity",
    owner_id: 78993,
    subscription_id: subscriptionId,
  };

  if (eventToTest == WEBHOOK_EVENTS.update) {
    body["updates"] = { name: "Updated name test" };
  }
  console.log(`Date and sub id: ${(timeStamp, subscriptionId)}`);

  const requestOptions = {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  };
  const response = await responseBuilder(
    `${getLocals(req, CALLBACK_URL)}/strava/webhook`,
    `Error Testing webhook event: ${JSON.stringify(req.params)}`,
    requestOptions
  );
  console.log(`Test Response: ${JSON.stringify(response)}`);
  res.status(response.status).json({
    message: `${response.data.message} test webhook event ${eventToTest}`,
  });
};

/**
 * Subscribes our app to the webhook so that when we recieve POST requests to "strava/webhook"
 * Our app will do it's magic.
 * @param {Object} req 
 * @param {Object} res 
 * @param {Object} next 
 * @returns 
 */
const subscribeToWebhook = (req, res, next) => {
  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = getLocals(req, ACCESS_TOKEN);
  // Parses the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Verifies that the mode and token sent are valid
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      setLocals(req, challengeId, challenge);
      console.log("WEBHOOK_VERIFIED", challenge);
      return res.json({ "hub.challenge": challenge });
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      return res.sendStatus(403);
    }
  }
};

/**
 * 
 * Validates the Subscription to our webhook
 * curl -G https://BASEURL.ngrok.io/strava/webhook?hub.verify_token=VERIFY_TOKEN&hub.challenge=CHALLENGE_CODE&hub.mode=subscribe
 * @param {Object} req 
 * @param {Object} res 
 * @param {Object} next 
 */
const healthCheck = async (req, res, next) => {
  // Test fetch to open free api
  // const response = await responseBuilder(
  //   `https://www.7timer.info/bin/astro.php?lon=113.2&lat=23.1&ac=0&unit=metric&output=json&tzshift=0`,
  //   "Error while checking health of the app"
  // );
  const callbackUrl = getLocals(req, CALLBACK_URL);
  const challenge = getLocals(req, challengeId);
  const access_token = getLocals(req, ACCESS_TOKEN);
  const response = await responseBuilder(
    `${callbackUrl}?hub.verify_token=${access_token}&hub.challenge=${challenge}&hub.mode=subscribe`,
    "Error while checking health of the app"
  );
  console.log("Health Check response:", response);
  res.status(response.status).json({ message: { ...response?.data } });
  
};

/**
 * Checks what is subscribed to our Strava webhook, if there is something, we can show links (for now)
 * that will let us delete a subscription.
 * @param {Object} req 
 * @param {Object} res 
 * @param {Object} next 
 * @returns 
 */
const viewSubscription = async (req, res, next) => {
  // Test curl to view the subscription
  // curl -G https://www.strava.com/api/v3/push_subscriptions \
  //     -d client_id=CLIENT_ID \
  //     -d client_secret=CLIENT_SECRET
  const response = await responseBuilder(
    `https://www.strava.com/api/v3/push_subscriptions?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}`,
    `Error while trying to view the subscriptions.`,
  );
  console.log("view ------->", JSON.stringify(response));
  let message = { ...response }
  if (response.status == 200) {
    let callbackUrl = getLocals(req, CALLBACK_URL)
    let deleteUrls = response.data.map(item => { 
      let objKey = `Delete Subscription ${item.id}`
      return { [objKey]: `${callbackUrl}/strava/subscribe/delete/${item.id}` }
    })
    message["You can delete subscriptions here"] = deleteUrls
  }
  res.status(response.status).json({ message });
  return next()
};

module.exports = {
  deleteSubscription,
  deleteSubscriptionByIdGET,
  getFallback,
  postWebhookSubscription,
  recieveWebhookEvent,
  subscribeToWebhook,
  healthCheck,
  viewSubscription,
  testWebhookEvent,
};
