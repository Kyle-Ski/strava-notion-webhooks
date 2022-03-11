const strava = require("strava-v3");

/**
 * Gets a Strava Activity by it's id
 * @param {String} id Strava Activity ID
 * @param {String} token Strava access_token
 * @returns {Promise} The Strava activity
 */
async function getActivityById(id, token) {
  try {
    const payload = await strava.activities.get({
      access_token: token,
      id,
    });
    return payload;
  } catch (e) {
    console.error(`
        getActivityById()
        Error getting strava activity by id: ${id}
        ERROR: ${e}
      `);
    return false;
  }
}

/**
 * Gets all of the activities for the Strava athlete (me in this case)
 * @param {String} token Strava access_token
 * @returns
 */
async function getAllActivities(token) {
  try {
    const payload = await strava.athlete.listActivities({
      access_token: token,
    });
    return payload;
  } catch (e) {
    console.error("Error listing all activities");
    return false;
  }
}

module.exports = {
  getActivityById,
  getAllActivities,
};
