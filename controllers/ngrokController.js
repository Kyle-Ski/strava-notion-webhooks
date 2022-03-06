const ngrok = require("ngrok");

const connectNgrok = async (port) => {
  console.log(
    `webhook is listening on ${port}, connecting ngrok to the same..`
  );
  const url = await ngrok.connect({
    authtoken: process.env.NGROK_AUTH_TOKEN,
    addr: port,
  });
  console.log("url:", url);
  return;
};

module.exports = {
  connectNgrok,
};
