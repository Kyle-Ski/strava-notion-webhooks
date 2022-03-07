const LOCALS_KEYS = {
  access_token: "access_token",
  callbackUrl: "callbackUrl",
  challengeId: "challengeId",
  expires_at: "expires_at",
  refresh_token: "refresh_token",
  stravaMiddleWareInitalized: "stravaMiddleWareInitalized",
  subscriptionId: "subscriptionId",
};

const WEBHOOK_EVENTS = {
  create: "create",
  update: "update",
  delete: "delete",
};

const WEBHOOK_EVENT_TYPES = {
  activity: "activity",
};

module.exports = {
  LOCALS_KEYS,
  WEBHOOK_EVENTS,
  WEBHOOK_EVENT_TYPES,
};
