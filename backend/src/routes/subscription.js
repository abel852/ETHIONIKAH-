const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const { authenticate, authorize } = require("../middleware/auth");

// Admin routes - require admin role
router.get("/admin/subscriptions", authenticate, authorize("admin"), subscriptionController.getAllSubscriptions);
router.get("/admin/subscriptions/:id", authenticate, authorize("admin"), subscriptionController.getSubscriptionById);
router.get("/admin/revenue", authenticate, authorize("admin"), subscriptionController.getRevenueStats);
router.get("/admin/payments", authenticate, authorize("admin"), subscriptionController.getAllPayments);
router.put("/admin/subscriptions/:id", authenticate, authorize("admin"), subscriptionController.updateSubscription);
router.delete("/admin/subscriptions/:id", authenticate, authorize("admin"), subscriptionController.cancelSubscription);

// User routes
router.get("/my", authenticate, subscriptionController.getUserSubscription);
router.post("/", authenticate, subscriptionController.createSubscription);
router.put("/:id", authenticate, subscriptionController.updateSubscription);
router.delete("/:id", authenticate, subscriptionController.cancelSubscription);

module.exports = router;
