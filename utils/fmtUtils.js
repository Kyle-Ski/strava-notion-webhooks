/**
 * Formats Strava Activity type into the exercises done for the 
 * Notion relation "Exercises Done"
 * @param {String} type Strava API response Activity Type
 * @returns 
 */
const fmtActivityToExerciseDoneRelation = (type) => {
  switch (type) {
    case "Hike":
      return ["Hike"];
    case "Run":
      return ["Run"];
    case "Weight Training":
      return [
        "Cat Cow",
        "Asian Squat",
        "Downward Dog",
        "Front Neck Stretch",
        "Half Kneeling Thoracic Rotations",
        "Seal Stretch",
        "Tree Pose",
        "Wall Arm Raises",
        "Worlds Greatest Stretch",
      ];
    default:
      return []
  }
};


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
  fmtActivityToExerciseDoneRelation,
  fmtCategoryType,
  fmtWeightCategoryType,
};
