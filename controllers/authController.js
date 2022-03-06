require("dotenv").config();
const fetch = require("node-fetch");

const fetchOauthToken = async (clientId, code, res) => {
  try {
    const request = await fetch("https://www.strava.com/api/v3/oauth/token", {
      method: "POST",
      body: `client_id=${clientId}&client_secret=${process.env.CLIENT_SECRET}&code=${code}&grant_type=authorization_code`,
    });
    const response = await request.json();
    console.log("response:", response);
    res.status(200).json({message: "exchanging tokens..."})
    return response;
  } catch(e) {
    console.log("ERROR: error exchanging tokens with https://www.strava.com/api/v3/oauth/token", e)
    return res.status(500).json({message: "ERROR: error exchanging tokens with https://www.strava.com/api/v3/oauth/token"})
  }
};

const exchangeTokens = (req, res) => {
  console.log(`GET "/exchange_token"`);
  // TODO maybe make this into a logging function?
  for (let key in req.params) {
    console.log(`PARAMS: key: ${key}, value: ${req.params[key]}`);
  }
  for (let key in req.body) {
    console.log(`BODY: key: ${key}, value: ${req.body[key]}`);
  }
  for (let key in req.query) {
    console.log(`QUERY: key: ${key}, value: ${req.query[key]}`);
  }

  if (req.query.code) {
    fetchOauthToken("78993", req.query.code, res);
  } else {
    console.log("NO req.query.code");
    return res.status(404).json({message: "ERROR: request query code not found."})
  }
  return res
    .status(200)
    .json({ message: "Attempting to exchange tokens with my app?" });
};

module.exports = {
  exchangeTokens,
};
