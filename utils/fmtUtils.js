/**
 * Formats the Strava API Activity type into my corresponding Notion Category
 * @param {String} type Strava API response Activity Type
 * @returns String
 */
const fmtCategoryType = (type) => {
  let categoryType = "";
  // console.log(`Formatting Category Type ${type}`);
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
 * Formats the Strava API Activity type into my corresponding Notion Weight Category.
 * @param {String} type Strava API response Activity Type
 * @returns
 */
const fmtWeightCategoryType = (type) => {
  // console.log(`Formatting Weight Category Type ${type}`);
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
