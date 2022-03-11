require("dotenv").config();
const {
  celciusToF,
  dateToDayOfWeek,
  metersPerSecToMph,
  metersToFeet,
  metersToMiles,
  secondsToTime,
} = require("./unitConversionUtils");
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
 * Formats the strava.activities.get response into the correct shape for notion.pages.update()
 * @param {Object} stravaObject
 * @returns {Object} Ex: {
 *    page_id: NOTION_PAGE_ID,
 *    properties: {}
 * }
 */
const fmtNotionObject = (stravaObject) => {
  console.log("Attempting to format the object:", JSON.stringify(stravaObject))
  let returnObj = { parent: { database_id: process.env.NOTION_DATABASE_ID }, properties: {} };
  for (let key in stravaObject) {
    switch (key) {
      case "id":
      case "object_id":
        returnObj.properties["strava_id"] = {
          rich_text: [{ text: { content: JSON.stringify(stravaObject[key]) } }]
        }
        continue
      case "title":
      case "name":
        returnObj.properties["Name"] = {
          title: [{ text: { content: stravaObject[key] } }],
        };
        continue
      case "moving_time":
        returnObj.properties["Moving Time"] = {
          rich_text: [{ text: { content: secondsToTime(stravaObject[key]) } }],
        };
        continue
      case "elapsed_time":
        returnObj.properties["Elapsed Time"] = {
          rich_text: [{ text: { content: secondsToTime(stravaObject[key]) } }],
        };
        continue
      case "total_elevation_gain":
        returnObj.properties["Elevation Gain"] = {
          number: metersToFeet(stravaObject[key]),
        };
        continue
      case "start_date_local":
        returnObj.properties["Date"] = { date: { start: stravaObject[key] } };
        returnObj.properties["Day"] = {
          multi_select: [{ name: dateToDayOfWeek(stravaObject[key]) }],
        };
        continue
      case "average_speed":
        returnObj.properties["Average Speed"] = {
          number: metersPerSecToMph(stravaObject[key]),
        };
        continue
      case "max_speed":
        returnObj.properties["Max Speed"] = {
          number: metersPerSecToMph(stravaObject[key]),
        };
        continue
      case "average_temp":
        returnObj.properties["Average Temp"] = {
          rich_text: [
            {
              text: {
                content: `${celciusToF(stravaObject[key])}°F | ${stravaObject[key]}°C`,
              },
            },
          ],
        };
        continue
      case "average_heartrate":
        returnObj.properties["Average Heart Rate"] = { number: stravaObject[key] };
        continue
      case "max_heartrate":
        returnObj.properties["Max Heart Rate"] = { number: stravaObject[key] };
        continue
      case "elev_high":
        returnObj.properties["Max Elevation"] = {
          number: metersToFeet(stravaObject[key]),
        };
        continue
      case "elev_low":
        returnObj.properties["Min Elevation"] = {
          number: metersToFeet(stravaObject[key]),
        };
        continue
      case "type":
        returnObj.properties["Category"] = {
          select: { name: fmtCategoryType(stravaObject[key]) },
        };
        returnObj.properties["Weight Category"] = {
          select: { name: fmtWeightCategoryType(stravaObject[key]) },
        };
        continue
      case "distance":
        returnObj.properties["Distance"] = {
          number: metersToMiles(stravaObject[key]),
        };
        continue
    }
  }
  if (returnObj?.properties?.Name !== undefined) {
    const { Name } = returnObj.properties
    console.log("we're in here...", JSON.stringify(Name))
    if(Name?.title?.text?.content?.toLowerCase()?.includes("dog") || Name?.title?.text?.content?.toLowerCase()?.includes("otis")) {
      console.log("We should make this a dog walk")
      returnObj.properties["Sub Category"] = {
        multi_select: [{ name: "Dog Walk" }],
      }

    }
  }
  
  returnObj["parent"] = { database_id: process.env.NOTION_DATABASE_ID };
  console.log("Created Object ------->", JSON.stringify(returnObj));
  return returnObj;
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
  try {
    // if (strava_id === undefined) {
    //   throw new Error("Error Creating Notion Page in addNotionItem(): `strava_id` was undefined")
    // }
    console.log(" addNotionItem --->", JSON.stringify(itemToAdd));
    const response = await notion.pages.create(itemToAdd);
    console.log("response:", response);
    console.log("Success! Entry added.");
    return response
  } catch (error) {
    console.error(`Error creating page with notion sdk: ${error.body}`);
    return false
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
    console.error("Error listing all notion pages:", e);
    return false;
  }
}

async function updateNotionPage(notionId, updateObject) {
  try {
    updateObject.page_id = notionId
    console.log(`Attempting to update ${JSON.stringify(notionId)} with ${JSON.stringify(updateObject)}`)
    const response = await notion.pages.update(updateObject)
    console.log(`Update response: ${JSON.stringify(response)}`)
    return response
  } catch(e) {
    console.error(`Error attempting to update ${JSON.stringify(notionId)}. ERROR: ${JSON.stringify(e)}`)
    return false
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
  if (!response?.results) {
    console.warn("Error getting all strava pages from the Notion database", JSON.stringify(response))
    return false
  }
  let responseArray = [...response.results];
  while (response.has_more) {
    // continue to query if next_cursor is returned
    const config1 = getDatabaseQueryConfig(response.next_cursor);
    config1.filter = stravaFilter;
    response = await notion.databases.query(config1);
    responseArray = [...responseArray, ...response.results];
  }
  return responseArray;
}

module.exports = {
  addNotionItem,
  fmtNotionObject,
  deleteNotionPage,
  getAllStravaPages,
  updateNotionPage,
};
