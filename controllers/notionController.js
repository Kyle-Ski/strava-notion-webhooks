require("dotenv").config();
const { Client, LogLevel } = require("@notionhq/client");
const res = require("express/lib/response");
const notion = new Client({
  auth: process.env.NOTION_KEY,
  logLevel: LogLevel.DEBUG,
});

const getFallback = (req, res) => {
  addItem("Testing...")
  return res.status(200).json({ message: "hello from the notion route" });
};

async function addItem(text) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        title: {
          title: [
            {
              text: {
                content: text,
              },
            },
          ],
        },
      },
    });
    console.log(response);
    console.log("Success! Entry added.");
  } catch (error) {
    console.error(`Error testing notion sdk: ${error.body}`);
    return res.status(500).json({message: `Error testing notion sdk...`})
  }
}

module.exports = {
  getFallback,
};
