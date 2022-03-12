const express = require("express");
const router = express.Router();
const controller = require("../controllers/notionController");

router.get("/", controller.getFallback);
router.get("/test-log/:logTitle", controller.testLog)

module.exports = router;
