/**
 * Formats Strava Activity type into the exercises done for the 
 * Notion relation "Exercises Done"
 * @param {String} type Strava API response Activity Type
 * @param {Array} inputArr Optional array to input, usefull for updating
 * where we don't want to override any of the old values.
 * @returns 
 */
const fmtActivityToExerciseDoneRelation = (type, inputArr) => {
  let previousExercises = inputArr
  let stretchRoutine = [
    "Cat Cow",
    "Asian Squat",
    "Downward Dog",
    "Front Neck Stretch",
    "Half Kneeling Thoracic Rotations",
    "Seal Stretch",
    "Tree Pose",
    "Wall Arm Raises",
    "Worlds Greatest Stretch",
  ]
  if (!inputArr.length > 0) {
    previousExercises = []
  }
  switch (type) {
    case "Hike":
      return [...new Set([...inputArr, "Hike"])];
    case "Run":
      return [...new Set([...inputArr, "Run"])];
    case "WeightTraining":
      return [... new Set([...inputArr, ...stretchRoutine])];
    default:
      return [...new Set([...inputArr])]
  }
};


/**
 * Formats the Strava API Activity type into my corresponding Notion Category
 * @param {String} type Strava API response Activity Type
 * @returns String
 */
const fmtCategoryType = (type) => {
  let categoryType = "";
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
  switch (type) {
    case "AlpineSki":
    case "BackcountrySki":
    case "Hike":
    case "Run":
      return "Cardio";
    case "Walk":
      return "Rest";
    case "WeightTraining":
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
