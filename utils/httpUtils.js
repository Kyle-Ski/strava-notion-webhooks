const fetch = require("node-fetch");

/**
 * Throws error if the string passed doesn't meet our standards
 * @param {String} url The URL string we want to check
 * @param {String} method The HTTP method to add to the error message if any
 */
const checkUrl = (url, method) => {
    // "https://www.thi.co" = 18 characters so this way maybe?
    if (url?.length <= 17 && typeof url != "string") {
        console.warn(`Looks like you haven't supplied a propper url to your ${method} request. Url supplied: ${url}`)
        throw new Error(`Looks like you haven't supplied a propper url to your ${method} request. Url supplied: ${url}`)
    }
}

/**
 * Takes in an object to turn into the second argument of a fetch() request. It will use each of that object's
 * keys as the keys for the new object. If 'method' is not included, we assume it is a GET request.
 * @param {Object} options The HTTP Options object we want to pass ex: const requestOptions = {
    body,
    headers: {
      "Content-Type": "multipart/form-data",
    },
    method: "DELETE",
  };
 * @returns {Object} EX: {
    body: {//SOME DATA},
    method: "POST",
  }
 */
const buildFetchOptions = (options) => {
    
    let fetchOptions = {}

    if (options) {
        if (
            typeof options != 'object' ||
            Array.isArray(options) ||
            options === null
        ) {
            // We have options passed through, but they aren't an object. Fetch without for now but warn in console
            console.warn(`Not including this in the request, but it looks like you've supplied an incorrectly formatted "options" argument: ${options}`)
            // throw new Error(`Looks like you've supplied an incorrectly formatted "options" argument`)
        }

        for (let key in options) {
            fetchOptions[key] = options[key]
        }
    }

    if (fetchOptions?.method === undefined) {
        fetchOptions['method'] = "GET"
    }

    return fetchOptions
}

/**
 * 
 * @param {Object} res the response parameter from the route ex: app.use('/someRoute', (req, res) => {//some code})
 * @param {Object} response the response from the responseBuilder call
 * @param {String} messageToSend positive json message to send back to the requester
 * @returns HTTP response
 */
const sendResponse = (res, response, messageToSend) => {
    const messageBuilder = { message: messageToSend}
    if (response.status != 200) {
        messageBuilder.message = response.data;
      }
      return res.status(response.status).json(messageBuilder);
}

/**
 * 
 * @param {String} url The URL we want to fetch from
 * @param {String} errorMessage Message we should send to the requester uppon fetch fail
 * @param {Object} options The request options we want to include, if none are included; we'll assume it's a GET request
 * @returns {Object} Shape: {status: ResponseStatusCode<Number>, data: (either JSON or error String)} // how do I propperly do this lol?
 */
const responseBuilder = async (url, errorMessage, options = false) => {
    let fetchOptions = buildFetchOptions(options)
    // Make sure the url is a string and at least 18 characters
    checkUrl(url, fetchOptions.method)
    try {
        const response = await fetch(url, fetchOptions)

        if (!response.ok) {
            console.warn("responseBuilder response NOT ok:", response.status, response.ok)
            console.warn(`
            Error fetching ${url}
            options: ${JSON.stringify(fetchOptions)}
            status: ${response.status}
            `)
            const data = await response.json()
            // for (let key in data){
            //     console.log(`key: ${key}, value: ${data[key]}`)
            //     if(key == 'errors') {
            //         for(let key2 in data['errors']) {
            //             for (let key3 in data['errors'][key2]) {
            //                 console.log(`KEY: ${key3}, VALUE: ${data['errors'][key2][key3]}`)
            //             }
                        
            //         }
            //     }
            // }
            console.log("----->",JSON.stringify(data))
            return {status: response.status, data: errorMessage}
        }
        // As of now, I'm assuming we're ONLY going to be hiting things that return json
        const data = await response.json()
        return {status: 200, data}
    } catch(e) {
        console.warn("responseBuilder ERROR:", e)
        return {status: 500, data: `Internal server error attempting to ${fetchOptions.method} ${url}`}//res.status(500).json({message: `Internal server error attempting to ${fetchOptions.method} ${url}`})
    }
}

module.exports = {
    responseBuilder,
    sendResponse
}
