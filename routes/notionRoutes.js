const express = require("express");
const router = express.Router();
const controller = require("../controllers/notionController");

router.get("/", controller.getFallback);

module.exports = router;
