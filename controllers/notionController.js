require("dotenv").config();
const {
  fmtNotionObject,
  logNotionError,
  logNotionItem,
  updateNotionPage,
  getPastExercises,
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
        example: `${baseUrl}/notion/test/relation/Run`,
      },
      testLogToNotion: {
        url: `"${baseUrl}/notion/test/log/LOG_TITLE"`,
        example: `${baseUrl}/notion/test/relation/log-title-1`,
        additionalFunctionality:
          "You can include 'error' in the log title to test logNotionError(), otherwise it will use logNotionItem()",
      },
    },
  };
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

const testNotionReccomendation = async (req, res, next) => {
  const numberDaysPast =
    typeof Number(req?.params?.day) == "number"
      ? Number(req?.params?.day)
      : false;
  if (!numberDaysPast) {
    res.status(400).json({ messge: "bad request, params must be a number" });
  }
  const pastExercises = await getPastExercises(numberDaysPast);
  const arrayThing = pastExercises?.results
    .map((result) => {
      return result.properties.all_areas_targeted_tags.rollup.array
        .map((exercise) =>
          exercise.multi_select.map((area) => {
            return { area: area.name, id: area.id };
          })
        )
        .flat(1);
    })
    .flat(1);
  console.log(`
    Past Exercises:
    ${JSON.stringify(arrayThing.length)}
  `);
  let stats = arrayThing.reduce((previousValue, currentValue, currentIndex) => {
    if (!previousValue[currentValue.area]) {
      previousValue[currentValue.area] = 1;
      return previousValue;
    }
    previousValue[currentValue.area] += 1;
    return previousValue;
  }, {});

  const findMaxesAndMins = (stats, numOfValues) => {
    let keys = Object.keys(stats)
    let values = Object.values(stats)
    let maxIndexArray = [];
    let minIndexArray = [];
    for (var i = 0; i < values.length; i++) {
        maxIndexArray.push(i); // add index to output array
        minIndexArray.push(i)
        if (maxIndexArray.length > numOfValues) {
            maxIndexArray.sort(function(a, b) { return values[b] - values[a]; }); // descending sort the output array
            maxIndexArray.pop(); // remove the last index (index of smallest element in output array)
        }
        if (minIndexArray.length > numOfValues) {
          minIndexArray.sort(function(a, b) { return values[a] - values[b]; }); // ascending sort the output array
          minIndexArray.pop(); // remove the last index (index of largest element in output array)
      }
    }
    let maxValues = maxIndexArray.map((exerciseIndex, i) => {
      return { [i]: keys[exerciseIndex], value: values[exerciseIndex] }
    })
    let minValues = minIndexArray.map((exerciseIndex, i) => {
      return { [i]: keys[exerciseIndex], value: values[exerciseIndex] }
    })
    return {maxValues: {...maxValues}, minValues: {...minValues}}
  };
  console.log(`
        Stats:
        ${JSON.stringify(findMaxesAndMins(stats))}
  `);
  const thingsToFormat = await fmtNotionObject({ reccomend: req?.params?.day });
  const response = await updateNotionPage(
    "48402d5bf851432c862998c5aa2a5531",
    thingsToFormat
  );
  if (!response) {
    res
      .status(500)
      .json({
        message: "Unable to test updating the reccomended activity property",
      });
    return next();
  }
  res
    .status(200)
    .json({
      message: `Areas Targeted for the past ${req?.params?.day} days`,
      "Areas Targeted Count": { ...findLowVals(stats) },
      "Areas to do next": {},
    });
};

const testNotionRelation = async (req, res, next) => {
  //https://www.notion.so/kalestew/Trip-to-the-PO-with-Otis-48402d5bf851432c862998c5aa2a5531
  //https://www.notion.so/kalestew/Trip-to-the-PO-with-Otis-48402d5bf851432c862998c5aa2a5531
  const eventTypeToTest = req?.params?.eventType
    ? req?.params?.eventType
    : "WeightTraining";
  const thingsToFormat = await fmtNotionObject({ type: eventTypeToTest }, true);
  if (!thingsToFormat) {
    res.status(200).json({ message: "relationArray.length !> 0" });
    return next();
  }
  const response = await updateNotionPage(
    "48402d5bf851432c862998c5aa2a5531",
    thingsToFormat
  ); //await updateRelations("48402d5bf851432c862998c5aa2a5531", ["Plank", "Fly"])
  if (!response) {
    res
      .status(500)
      .json({ message: "Unable to test updating a notion relation." });
    return next();
  }
  res
    .status(200)
    .json({ message: "Successfully tested updating notion relations!" });
};

module.exports = {
  getFallback,
  testLog,
  testNotionRelation,
  testNotionReccomendation,
};
