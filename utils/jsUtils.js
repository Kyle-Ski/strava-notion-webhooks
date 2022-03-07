/**
 * Helps log out the request object 
 * @param {Object} req the req argument from a request
 */
const logObject = (req) => {
    for(let key in req.params) {
        console.log(`Logging key value pair for PARAMS--> ${key}: ${req.params[key]}`)
      }
      for(let key in req.body) {
        console.log(`Logging key value pair for BODY--> ${key}: ${req.body[key]}`)
      }
      for(let key in req.query) {
        console.log(`Logging key value pair for QUERY--> ${key}: ${req.query[key]}`)
      }
}

module.exports = {
    logObject,
}