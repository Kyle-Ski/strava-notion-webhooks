require("dotenv").config();
const {
  fmtNotionObject,
  logNotionError,
  logNotionItem,
  updateNotionPage,
} = require("../utils/notionUtils");

/**
 * The fallback function for the "notion/" route.
 * @param {Object} req
 * @param {Object} res
 * @param {Object} next
 */
const getFallback = async (req, res, next) => {
  let respObj = {
    message: "Hello from the Notion route!",
    stravaRoutes: {
      deleteCurrentSubscription: `${baseUrl}/strava/delete`,
      deleteSubscriptionById: `"${baseUrl}/strava/delete/SUBSCRIPTION_ID_TO_DELETE"`,
      subscribeToWebhook: `${baseUrl}/strava/subscribe`,
      testStravaWebhookEvent: {
        url: `"${baseUrl}/strava/test/webhook/STRAVA_EVENT_TO_TEST"`,
        example: `${baseUrl}/strava/webhook/WeightTraining`,
      },
      validateStravaSubscription: `${baseUrl}/strava/webhook`,
      viewSubscriptions: `${baseUrl}/strava/view`,
    },
    notionRoutes: {
      testUpdateRelations: {
        url: `"${baseUrl}/notion/test/relation/EVENT_TYPE"`,
        example: `${baseUrl}/notion/test/relation/Run`
      },
      testLogToNotion: {
        url: `"${baseUrl}/notion/test/log/LOG_TITLE"`,
        example: `${baseUrl}/notion/test/relation/log-title-1`,
        additionalFunctionality: "You can include 'error' in the log title to test logNotionError(), otherwise it will use logNotionItem()"
      }
    },
  }
  return res.status(200).json(respObj);
};

/**
 * Tests out logging something to our Error page in notion.
 * The endpoint is "notion/test-log/TEST_TITLE"
 * @param {Object} req
 * @param {Object} res
 * @param {Object} next
 * @returns
 */
const testLog = async (req, res, next) => {
  if (req?.params.logTitle.includes("error")) {
    const response = await logNotionError(
      `TEST ERROR: ${req?.params.logTitle}`,
      "Here's a test error log in notion for you"
    );
    if (!response) {
      res.status(500).json({ message: "Error testing an error log to notion" });
      return next();
    }
    console.log("Testing Notion Error Log", JSON.stringify(response));
    res.status(200).json({ message: "Test error log success!" });
    return next();
  }
  const response = await logNotionItem(
    `TEST TITLE: ${req?.params.logTitle}`,
    "Here's a test log in notion for you"
  );
  if (!response) {
    res.status(500).json({ message: "Error testing a log to notion" });
    return next();
  }
  console.log("Testing Notion Log", JSON.stringify(response));
  res.status(200).json({ message: "Test log success!" });
};

const testNotionRelation = async (req, res, next) => {
  //https://www.notion.so/kalestew/Trip-to-the-PO-with-Otis-48402d5bf851432c862998c5aa2a5531
  //https://www.notion.so/kalestew/Trip-to-the-PO-with-Otis-48402d5bf851432c862998c5aa2a5531
  const eventTypeToTest = req?.params?.eventType ? req?.params?.eventType : "WeightTraining"
  const thingsToFormat = await fmtNotionObject({type: eventTypeToTest }, true)
  if (!thingsToFormat) {
    res.status(200).json({ message: "relationArray.length !> 0"})  
    return next()
  }
  const response = await updateNotionPage("48402d5bf851432c862998c5aa2a5531", thingsToFormat)//await updateRelations("48402d5bf851432c862998c5aa2a5531", ["Plank", "Fly"])
  if (!response) {
    res.status(500).json({ message: "Unable to test updating a notion relation."})
    return next()
  }  
  res.status(200).json({ message: "Successfully tested updating notion relations!"})  
}

module.exports = {
  getFallback,
  testLog,
  testNotionRelation,
};
