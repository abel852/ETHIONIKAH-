const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/membershipPlanController");
const { authenticate, authorize, requireAdmin2FA } = require("../middleware/auth");
const auth = [authenticate, authorize("admin"), requireAdmin2FA];

// Membership Plans - Admin CRUD
router.get("/membership-plans", ...auth, ctrl.getMembershipPlans);
router.post("/membership-plans", ...auth, ctrl.createMembershipPlan);
router.put("/membership-plans/:id", ...auth, ctrl.updateMembershipPlan);
router.delete("/membership-plans/:id", ...auth, ctrl.deleteMembershipPlan);

// Contact Credit Packages - Admin CRUD
router.get("/credit-packages", ...auth, ctrl.getCreditPackages);
router.post("/credit-packages", ...auth, ctrl.createCreditPackage);
router.put("/credit-packages/:id", ...auth, ctrl.updateCreditPackage);
router.delete("/credit-packages/:id", ...auth, ctrl.deleteCreditPackage);

// Payment Methods - Admin CRUD
router.get("/payment-methods", ...auth, ctrl.getPaymentMethods);
router.post("/payment-methods", ...auth, ctrl.createPaymentMethod);
router.put("/payment-methods/:id", ...auth, ctrl.updatePaymentMethod);
router.delete("/payment-methods/:id", ...auth, ctrl.deletePaymentMethod);

// User-facing routes (public for browsing plans, auth for credits)
router.get("/plans", ctrl.getMembershipPlans);
router.get("/credits", ctrl.getCreditPackages);
router.get("/methods", ctrl.getPaymentMethods);
router.get("/my-credits", authenticate, ctrl.getMyContactCredits);

module.exports = router;
