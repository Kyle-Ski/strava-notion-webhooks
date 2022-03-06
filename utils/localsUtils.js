/**
 * Checks to see if the key that we are checking exists in req.app.locals, if it does, we send it back.
 * Otherwise, we're going to return false.
 * @param {Object} req the request object from express
 * @param {String} key the key of the thing we are trying to retrieve from req.app.locals
 * @returns 
 */
const getLocals = (req, key) => {
    if (!req?.app?.locals[key]) {
        return false
    }
    return req.app.locals[key]
}

/**
 * Allows us to set the value of some key in req.app.locals.
 * If the value is undefined, return false with a console warn.
 * @param {Object} req the request object from express
 * @param {String} key the key of the thing we are trying to add to req.app.locals
 * @param {any} value whatever we wish to set as the value in req.app.locals
 * @returns {Boolean}
 */
const setLocals = (req, key, value) => {
    console.log("SETTING LOCALS:", key, value)
    if (value != undefined) {
        req.app.locals[key] = value
        return true
    } 
    console.warn("Looks like you're trying to set a locals value to undefined.", key)
    return false
}

module.exports = {
    getLocals,
    setLocals,
}