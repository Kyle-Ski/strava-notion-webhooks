const ngrok = require("ngrok");

const connectNgrok = async (port) => {
  console.log(
    `webhook is listening on ${port}, connecting ngrok to the same..`
  );
  try {
    const url = await ngrok.connect({
      authtoken: process.env.NGROK_AUTH_TOKEN,
      addr: port,
    });
    console.log("url:", url);
    return;
  
  } catch(e) {
    console.log("ERROR: error connecting ngrok:", e)
  }
};

module.exports = {
  connectNgrok,
};
