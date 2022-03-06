const express = require("express");
const router = express.Router();
const controller = require("../controllers/authController");

router.get("/exchange_token", controller.exchangeTokens);

module.exports = router;
