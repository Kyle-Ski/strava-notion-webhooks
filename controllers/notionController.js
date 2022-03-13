require("dotenv").config();
const { getLocals } = require("../utils/localsUtils");
const { LOCALS_KEYS } = require("../constants");
const {
  getAllStravaPages,
  fmtNotionObject,
  addNotionItem,
  logNotionError,
  logNotionItem,
} = require("../utils/notionUtils");
const { getActivityById } = require("../utils/stravaUtils");

const { ACCESS_TOKEN } = LOCALS_KEYS;

/**
 * The fallback function for the "notion/" route.
 * @param {Object} req
 * @param {Object} res
 * @param {Object} next
 */
const getFallback = async (req, res, next) => {
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
    res.status(200).json({ message: "Test log success!" });
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

module.exports = {
  getFallback,
  testLog,
};
