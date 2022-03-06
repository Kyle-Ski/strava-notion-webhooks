require("dotenv").config();
const fetch = require("node-fetch");

const fetchOauthToken = async (clientId, code) => {
  const request = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    body: `client_id=${clientId}&client_secret=${process.env.CLIENT_SECRET}&code=${code}&grant_type=authorization_code`,
  });
  const response = await request.json();
  console.log("response:", response);
  return response;
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
    fetchOauthToken("78993", req.query.code);
  } else {
    console.log("NO req.query.code");
  }
  return res
    .status(200)
    .json({ message: "Attempting to exchange tokens with my app?" });
};

module.exports = {
  exchangeTokens,
};
