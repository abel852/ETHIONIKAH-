const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const { authenticate, authorize, requireActive, requireAdmin2FA } = require("../middleware/auth");
const adminAuth = [authenticate, authorize("admin"), requireAdmin2FA];

// Admin routes - require admin role
router.get("/admin/subscriptions", ...adminAuth, subscriptionController.getAllSubscriptions);
router.get("/admin/subscriptions/:id", ...adminAuth, subscriptionController.getSubscriptionById);
router.get("/admin/revenue", ...adminAuth, subscriptionController.getRevenueStats);
router.get("/admin/payments", ...adminAuth, subscriptionController.getAllPayments);
router.put("/admin/subscriptions/:id", ...adminAuth, subscriptionController.updateSubscription);
router.delete("/admin/subscriptions/:id", ...adminAuth, subscriptionController.cancelSubscription);

// User routes
router.get("/my", authenticate, requireActive, subscriptionController.getUserSubscription);
router.post("/", ...adminAuth, subscriptionController.createSubscription);
router.put("/:id", authenticate, requireActive, subscriptionController.updateSubscription);
router.delete("/:id", authenticate, requireActive, subscriptionController.cancelSubscription);

module.exports = router;
