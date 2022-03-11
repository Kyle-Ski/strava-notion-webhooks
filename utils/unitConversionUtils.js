/**
 * Rounds input number to two decimals
 * @param {number} num
 * @returns {number}
 */
const twoDecimals = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Converts degrees celcius to freedom units
 * @param {number} celcius Temp in celcius
 * @returns
 */
const celciusToF = (celcius) => {
  return twoDecimals(celcius * (9 / 5) + 32);
};

/**
 * Allows us to check and see if a unix timestamp has passed, if it has (or if it is the time) return true,
 * otherwise return false.
 * @param {number} unixTime The time we want to check
 */
const checkTimeExpired = (unixTime) => {
  console.log(`Checking now: ${new Date()} vs ${new Date(unixTime * 1000)}`)
  let now = new Date() / 1000
  if (unixTime < now) {
    return true
  } else {
    return false
  }
}

/**
 * Converts date to the day of the week.
 * @param {String} date Zulu date in string format Ex: "2022-01-30T09:58:22Z"
 */
const dateToDayOfWeek = (date) => {
  const numDay = new Date(date).getUTCDay();
  switch (numDay) {
    case 0:
      return "Sunday";
    case 1:
      return "Monday";
    case 2:
      return "Tuesday";
    case 3:
      return "Wednesday";
    case 4:
      return "Thursday";
    case 5:
      return "Friday";
    case 6:
      return "Saturday";
    default:
      return false
  }
};

/**
 * Converts meters per second to miles per hour
 * @param {number} metersPerSec
 * @returns {number}
 */
const metersPerSecToMph = (metersPerSec) => {
  return twoDecimals(metersPerSec * 2.237);
};

/**
 * Converts meters to miles rounded to two decimals.
 * @param {number} meters
 */
const metersToMiles = (meters) => {
  return twoDecimals(meters / 1609);
};

/**
 *
 * @param {number} meters
 */
const metersToFeet = (meters) => {
  return twoDecimals(meters * 3.281);
};

/**
 * Converts time in seconds to "HH:MM:SS" format
 * @param {number} seconds time in second
 * @returns {String}
 */
const secondsToTime = (seconds) => {
  return new Date(seconds * 1000)
    .toISOString()
    .slice(11)
    .split(".")[0];
};

module.exports = {
  celciusToF,
  checkTimeExpired,
  dateToDayOfWeek,
  twoDecimals,
  metersPerSecToMph,
  metersToFeet,
  metersToMiles,
  secondsToTime,
};
