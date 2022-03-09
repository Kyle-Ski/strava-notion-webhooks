/**
 * Formats the Strava API Activity type into my corresponding Notion Category
 * @param {String} type Strava API response Activity Type
 * @returns String
 */
const fmtCategoryType = (type) => {
  let categoryType = "";
  console.log(`Formatting Category Type ${type}`);
  switch (type) {
    case "Hike":
      categoryType = "Hikes";
      return categoryType;
    default:
      categoryType = "Habits";
      return categoryType;
  }
};

/**
 *        const newNotionPage = {
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

   * Formats the strava.activities.get response into the correct shape for notion.pages.update()
   * @param {Object} update 
   * @param {String} stravaId 
   * @returns {Object} Ex: {
   *    page_id: NOTION_PAGE_ID,
   *    properties: {}
   * }
   */
const fmtUpdate = async (update, stravaId) => {
  const allStravaItems = await getAllStravaPages();
  const notionId = allStravaItems.find(
    (item) => item.properties.strava_id.rich_text[0].text.content == stravaId
  )?.id;
  let returnObj = { page_id: notionId, properties: {} };
  // {
  // Name: {
  //   title: [
  //     {
  //       text: {
  //         content: title,
  //       },
  //     },
  //   ],
  // },
  //   strava_id: {
  //     rich_text: [
  //       {
  //         text: {
  //           content: id,
  //         },
  //       },
  //     ],
  //   },
  //   Date: {
  //     date: {
  //       start: startDate,
  //     },
  //   },
  //   Distance: {
  //     number: distance,
  //   },
  //   // Day: {
  //   //   multi_select: {
  //   //     name: dayVariable // need to make this reflecting on what the actual day is
  //   //   }
  //   // },
  //   Category: {
  //     select: {
  //       name: categoryType, // Turn into constant?
  //     },
  //   },
  //   "Min Elevation": {
  //     number: minElevation,
  //   },
  //   "Average Speed": {
  //     number: averageSpeed,
  //   },
  //   "Max Heart Rate": {
  //     number: maxHeartRate,
  //   },
  //   "Max Elevation": {
  //     number: maxElevation,
  //   },
  //   "Elevation Gain": {
  //     number: elevationGain,
  //   },
  //   "Average Heart Rate": {
  //     number: averageHeartRate,
  //   },
  //   "Weight Category": {
  //     select: {
  //       name: weightCategoryType
  //     }
  //   },
  // },
  for (let key in update) {
    switch (key) {
      case "title":
        returnObj.properties["Name"] = {
          title: [{ text: { content: update[key] } }],
        };
    }
  }
  return returnObj;
};

/**
 * Formats the Strava API Activity type into my corresponding Notion Weight Category.
 * @param {String} type Strava API response Activity Type
 * @returns
 */
const fmtWeightCategoryType = (type) => {
  console.log(`Formatting Weight Category Type ${type}`);
  switch (type) {
    case "Alpine Ski":
    case "Backcountry Ski":
    case "Hike":
    case "Run":
      return "Cardio";
    case "Walk":
      return "Rest";
    case "Weight Training":
      return "Weights";
    default:
      return "Cardio";
  }
};

module.exports = {
  fmtCategoryType,
  fmtWeightCategoryType,
};
