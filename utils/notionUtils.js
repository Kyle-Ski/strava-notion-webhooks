require("dotenv").config();
const { fmtCategoryType, fmtWeightCategoryType } = require("./fmtUtils");
const { Client, LogLevel } = require("@notionhq/client");
const notion = new Client({
  auth: process.env.NOTION_KEY,
  logLevel: LogLevel.DEBUG,
});
const stravaFilter = {
  and: [{ property: "strava_id", rich_text: { is_not_empty: true } }],
};

/**
 * Used to create a query object that will be used to query a notion database (I know, but it's helpful)
 * ex:
 * let config = getDatabaseQueryConfig()
 * let thingYouWant = await notion.databases.query(config)
 * @param {String} cursor the next cursor id in the notion database
 * @param {String} pageSize the ammound of things we want returned on a page
 * @param {String} database_id the Notion Database ID, defaults to the Agenda 2.0 database ID
 * @returns {Object}
 */
const getDatabaseQueryConfig = (
  cursor = null,
  pageSize = null,
  database_id = process.env.NOTION_DATABASE_ID
) => {
  const config = {
    database_id,
  };

  if (cursor != null) {
    config["start_cursor"] = cursor;
  }

  if (pageSize != null) {
    config["page_size"] = pageSize;
  }

  return config;
};

/**
 * Create a Notion page by passing in a formatted Strava Activity object (TO BE CREATED AS A CONSTANT?)
 * @param {Object} itemToAdd the Strava activity we're going to use to create a Notion page
 */
async function addNotionItem(itemToAdd) {
  const {
    title,
    id,
    startDate,
    distance,
    elevationGain,
    type,
    averageHeartRate,
    maxHeartRate,
    maxElevation,
    minElevation,
    averageSpeed,
  } = itemToAdd;
  let categoryType = fmtCategoryType(type);
  let weightCategoryType = fmtWeightCategoryType(type);
  try {
    // if (strava_id === undefined) {
    //   throw new Error("Error Creating Notion Page in addNotionItem(): `strava_id` was undefined")
    // }
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        strava_id: {
          rich_text: [
            {
              text: {
                content: id,
              },
            },
          ],
        },
        Date: {
          date: {
            start: startDate,
          },
        },
        Distance: {
          number: distance,
        },
        // Day: {
        //   multi_select: {
        //     name: dayVariable // need to make this reflecting on what the actual day is
        //   }
        // },
        Category: {
          select: {
            name: categoryType, // Turn into constant?
          },
        },
        "Min Elevation": {
          number: minElevation,
        },
        "Average Speed": {
          number: averageSpeed,
        },
        "Max Heart Rate": {
          number: maxHeartRate,
        },
        "Max Elevation": {
          number: maxElevation,
        },
        "Elevation Gain": {
          number: elevationGain,
        },
        "Average Heart Rate": {
          number: averageHeartRate,
        },
        "Weight Category": {
          select: {
            name: weightCategoryType,
          },
        },
      },
    });
    console.log(response);
    console.log("Success! Entry added.");
  } catch (error) {
    console.error(`Error creating page with notion sdk: ${error.body}`);
  }
}

// Test curl to delete the subscription
// curl -X DELETE https://www.strava.com/api/v3/push_subscriptions/SUBSCRIPTION_ID \
//     -F client_id=CLIENT_ID \
//     -F client_secret=CLIENT_SECRET

/**
 * Deletes a notion page based on the strava id
 * @param {String} id The Strava id of the notion item we want to delete
 * @returns {Boolean} true if we found the notion id based on the strava id
 */
async function deleteNotionPage(id) {
  try {
    const allStravaNotionPages = await getAllStravaPages();
    //6797788852
    const notionIdToDelete = allStravaNotionPages.filter(
      (activity) =>
        activity.properties.strava_id.rich_text[0].text.content == id
    );
    if (notionIdToDelete.length > 0) {
      const response = await notion.pages.update({
        page_id: notionIdToDelete[0]?.id,
        archived: true,
      });
      console.log("response:", response);
      return true;
    } else {
      throw new Error(
        "Couldn't find notion id to delete with matching strava_id:",
        id
      );
    }
  } catch (e) {
    console.warn("Error listing all notion pages:", e);
    return false;
  }
}

/**
 * Gets all of the pages in the Agenda 2.0 database that have a strava_id property (this is what the stravaFilter is for)
 * @returns {Array} an array of Notion Page Objects
 */
async function getAllStravaPages() {
  const config = getDatabaseQueryConfig();
  config.filter = stravaFilter;
  let response = await notion.databases.query(config);
  let responseArray = [...response.results];
  while (response.has_more) {
    // continue to query if next_cursor is returned
    const config1 = getDatabaseQueryConfig(response.next_cursor);
    config1.filter = stravaFilter;
    response = await notion.databases.query(config1);
    responseArray = [...responseArray, ...response.results];
  }
  console.log("all things?", JSON.stringify(responseArray));
  return responseArray;
}

module.exports = {
  addNotionItem,
  deleteNotionPage,
  getAllStravaPages,
};
