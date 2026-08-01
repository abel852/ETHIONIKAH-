const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { saveSubscription, removeSubscription, initWebPush } = require("../utils/pushService");

// Get VAPID public key (no auth needed — public key)
router.get("/vapid-public-key", (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(503).json({ error: "Push notifications not configured" });
  }
  res.json({ publicKey });
});

// Subscribe to push notifications
router.post("/subscribe", authenticate, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: "Invalid subscription" });
    }
    const result = await saveSubscription(req.user.userId, subscription);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// Unsubscribe from push notifications
router.post("/unsubscribe", authenticate, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: "Endpoint required" });
    }
    await removeSubscription(req.user.userId, endpoint);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
});

module.exports = router;
