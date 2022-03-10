require("dotenv").config();
const { getLocals } = require("../utils/localsUtils");
const { LOCALS_KEYS } = require("../constants")
const { getAllStravaPages, fmtNotionObject, addNotionItem } = require("../utils/notionUtils")
const { getActivityById } = require("../utils/stravaUtils")

const { ACCESS_TOKEN } = LOCALS_KEYS

const getFallback = async (req, res) => {
  const stravaResponse = await getActivityById("6606840419", getLocals(req, ACCESS_TOKEN))
  console.log(`Testing getActivityById("6606840419", getLocals(req, ACCESS_TOKEN)`)
  const formattedNotionObject = fmtNotionObject(stravaResponse)
  console.log(`Testing addNotionItem: adding: ${JSON.stringify(formattedNotionObject)}`)
  addNotionItem(formattedNotionObject);
  const allStravaPages = await getAllStravaPages()
  const found = allStravaPages.filter(
    (activity) =>
      activity.properties.strava_id.rich_text[0].text.content == "6798333045"
  )[0]?.id;
  console.log("Testing getAllStravaPages() and searching for id 6798333045", found, JSON.stringify(allStravaPages));
  return res.status(200).json({ message: "hello from the notion route" });
};

module.exports = {
  getFallback,
};
