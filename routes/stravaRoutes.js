const express = require("express");
const router = express.Router();
const controller = require("../controllers/stravaController");

router.get("/", controller.getFallback);
router.get("/webhook", controller.subscribeToWebhook);
router.post("/webhook", controller.recieveWebhookEvent);
router.get("/subscribe", controller.postWebhookSubscription);
router.get("/subscribe/view", controller.viewSubscription);
router.get('/subscribe/delete', controller.deleteSubscription)

module.exports = router;
