const ngrok = require("ngrok");

const connectNgrok = async (port, ngrokAuthToken, setLocalsUrl) => {
    console.log(
      `webhook is listening on ${port}, connecting ngrok to the same..`
    );
    try {
      const url = await ngrok.connect({
        authtoken: ngrokAuthToken,
        addr: port,
      });
      setLocalsUrl(url);
      console.log(
        "url:",
        url.split("https://")[1],
        `Auth URL: ${`https://www.strava.com/oauth/authorize?client_id=78993&response_type=code&redirect_uri=${url}/auth/exchange_token&approval_prompt=force&scope=read_all,read,activity:read`}`
      );
      return;
    } catch (e) {
      console.error("ERROR: error connecting ngrok:", e);
      throw new Error("Error connecting index.js to ngrok:", e);
    }
  };
  
  module.exports = {
      connectNgrok
  }