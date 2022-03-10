require("dotenv").config();
const { Client, LogLevel } = require("@notionhq/client");
const notion = new Client({
  auth: process.env.NOTION_KEY,
  logLevel: LogLevel.DEBUG,
});
const {
  metersPerSecToMph,
  metersToFeet,
  metersToMiles,
} = require("../utils/unitConversionUtils");

const stravaFilter = {
  and: [{ property: "strava_id", rich_text: { is_not_empty: true } }],
};

// Need to clean up this file and use updated functions
const getFallback = async (req, res) => {
  const testResponse = {
    resource_state: 3,
    athlete: { id: 46337708, resource_state: 1 },
    name: "Morning Hike",
    distance: 0,
    moving_time: 45,
    elapsed_time: 45,
    total_elevation_gain: 0,
    type: "Hike",
    id: 6797597132,
    start_date: "2022-03-09T15:12:21Z",
    start_date_local: "2022-03-09T08:12:21Z",
    timezone: "(GMT-07:00) America/Denver",
    utc_offset: -25200,
    location_city: null,
    location_state: null,
    location_country: null,
    achievement_count: 0,
    kudos_count: 0,
    comment_count: 0,
    athlete_count: 1,
    photo_count: 0,
    map: { id: "a6797597132", polyline: "", resource_state: 3 },
    trainer: true,
    commute: false,
    manual: false,
    private: false,
    visibility: "everyone",
    flagged: false,
    gear_id: "g8903359",
    start_latlng: [],
    end_latlng: [],
    start_latitude: null,
    start_longitude: null,
    average_speed: 0,
    max_speed: 0,
    average_temp: 29,
    has_heartrate: true,
    average_heartrate: 76.9,
    max_heartrate: 84,
    heartrate_opt_out: false,
    display_hide_heartrate_option: true,
    elev_high: 2770.4,
    elev_low: 2769,
    upload_id: 7230862425,
    upload_id_str: "7230862425",
    external_id: "garmin_push_8426963518",
    from_accepted_tag: false,
    pr_count: 0,
    total_photo_count: 0,
    has_kudoed: false,
    description: null,
    calories: 1,
    perceived_exertion: null,
    prefer_perceived_exertion: null,
    segment_efforts: [],
    laps: [
      {
        id: 22393914424,
        resource_state: 2,
        name: "Lap 1",
        activity: { id: 6797597132, resource_state: 1 },
        athlete: { id: 46337708, resource_state: 1 },
        elapsed_time: 45,
        moving_time: 45,
        start_date: "2022-03-09T15:12:21Z",
        start_date_local: "2022-03-09T08:12:21Z",
        distance: 0,
        start_index: 0,
        end_index: 8,
        total_elevation_gain: 0,
        average_speed: 0,
        max_speed: 0,
        device_watts: false,
        average_heartrate: 76.9,
        max_heartrate: 84,
        lap_index: 1,
        split: 1,
      },
    ],
    gear: {
      id: "g8903359",
      primary: true,
      name: "La Sportiva bushido II Two Two",
      nickname: "Two Two",
      resource_state: 2,
      retired: false,
      distance: 165386,
      converted_distance: 102.8,
    },
    photos: { primary: null, count: 0 },
    stats_visibility: [
      { type: "heart_rate", visibility: "everyone" },
      { type: "pace", visibility: "everyone" },
      { type: "power", visibility: "everyone" },
      { type: "speed", visibility: "everyone" },
      { type: "calories", visibility: "everyone" },
    ],
    hide_from_home: false,
    device_name: "Garmin Instinct Solar",
    embed_token: "6563330fc7f5692cd8889b3205286a7397ee2edc",
    private_note: null,
    available_zones: [],
  };
  const newItem = {
    title: testResponse?.name,
    id: JSON.stringify(testResponse?.id),
    startDate: testResponse?.start_date_local,
    distance: metersToMiles(testResponse?.distance),
    elevationGain: metersToFeet(testResponse?.total_elevation_gain),
    type: testResponse?.type,
    averageHeartRate: testResponse?.average_heartrate,
    maxHeartRate: testResponse?.max_heartrate,
    maxElevation: metersToFeet(testResponse?.elev_high),
    minElevation: metersToFeet(testResponse?.elev_low),
    averageSpeed: metersPerSecToMph(testResponse?.average_speed),
  };
  // addNotionItem(newItem);
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
  const found = responseArray.filter(
    (activity) =>
      activity.properties.strava_id.rich_text[0].text.content == "6798333045"
  )[0]?.id;
  console.log("all things?", found, JSON.stringify(responseArray));
  return res.status(200).json({ message: "hello from the notion route" });
};

function getDatabaseQueryConfig(
  cursor = null,
  pageSize = null,
  database_id = process.env.NOTION_DATABASE_ID
) {
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
}

async function addNotionItem({
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
}) {
  // Add destructuring?
  let categoryType = "";
  switch (type) {
    case "Hike":
      categoryType = "Hikes";
    default:
      categoryType = "Habits";
  }

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
            name: "Cardio", // Need to make this into switch case depending on strava activity?
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

module.exports = {
  getFallback,
  addNotionItem,
};
