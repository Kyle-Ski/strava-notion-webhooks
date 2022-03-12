require("dotenv").config();
const { getLocals } = require("../utils/localsUtils");
const { LOCALS_KEYS } = require("../constants")
const { getAllStravaPages, fmtNotionObject, addNotionItem, logNotionError } = require("../utils/notionUtils")
const { getActivityById } = require("../utils/stravaUtils")

const { ACCESS_TOKEN } = LOCALS_KEYS

/**
 * The fallback function for the "notion/" route. It will also test out a few things.
 * 1. Tests out Strava getActivityById()
 * 2. Tests formatting the^ Strava object
 * 3. Tests adding that^ item to our notion database
 * 4. Tests getting all pages in our notion db that have a strava_id
 * @param {Object} req 
 * @param {Object} res 
 * @param {Object} next 
 */
const getFallback = async (req, res, next) => {
  const stravaResponse = await getActivityById("6606840419", getLocals(req, ACCESS_TOKEN))
  console.log(`Testing getActivityById("6606840419", getLocals(req, ACCESS_TOKEN)`)
  const formattedNotionObject = fmtNotionObject(stravaResponse)
  console.log(`Testing addNotionItem: adding: ${JSON.stringify(formattedNotionObject)}`)
  const addedItem = addNotionItem(formattedNotionObject);
  if (!addedItem) {
    return res.status(500).json({ message: "Error adding item" })
  }
  const allStravaPages = await getAllStravaPages()
  const found = allStravaPages.filter(
    (activity) =>
      activity.properties.strava_id.rich_text[0].text.content == "6798333045"
  )[0]?.id;
  console.log("Testing getAllStravaPages() and searching for id 6798333045", found, JSON.stringify(allStravaPages));
  return res.status(200).json({ message: "hello from the notion route" });
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
  const response = await logNotionError(`TEST TITLE: ${req?.params.logTitle}`, "Here's a test error log in notion for you")
  if(!response) {
    res.status(500).json({ message: "Error testing a log to notion" })
    return next()
  }
  console.log("Testing Notion Error Log", JSON.stringify(response))
  res.status(200).json({ message: "Test log success!" })
}

module.exports = {
  getFallback,
  testLog,
};
