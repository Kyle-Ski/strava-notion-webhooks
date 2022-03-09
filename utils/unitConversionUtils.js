/**
 * Rounds input number to two decimals
 * @param {number} num 
 * @returns {number}
 */
const twoDecimals = (num) => {
    return Math.round((num + Number.EPSILON) * 100) / 100
}

/**
 * Converts meters per second to miles per hour
 * @param {number} metersPerSec 
 * @returns {number}
 */
 const metersPerSecToMph = (metersPerSec) => {
    return twoDecimals(metersPerSec * 2.237)
}

/**
 * Converts meters to miles rounded to two decimals.
 * @param {number} meters 
 */
const metersToMiles = (meters) => {
    return twoDecimals(meters / 1609)
}

/**
 * 
 * @param {number} meters 
 */
const metersToFeet = (meters) => {
    return twoDecimals(meters * 3.281)
}

module.exports = {
    twoDecimals,
    metersPerSecToMph,
    metersToFeet,
    metersToMiles,
}