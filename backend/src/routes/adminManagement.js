const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/adminManagementController");
const { authenticate, authorize } = require("../middleware/auth");

const superAdmin = [authenticate, authorize("admin"), async (req, res, next) => {
  if (req.user.adminRole !== "super_admin") {
    return res.status(403).json({ error: "Super admin access required" });
  }
  next();
}];

router.post("/admins/send-verification", ...superAdmin, ctrl.sendEmailVerification);
router.post("/admins/verify-email", ...superAdmin, ctrl.verifyEmailCode);
router.post("/admins/setup-2fa", ...superAdmin, ctrl.setupGoogleAuth);
router.post("/admins/verify-2fa", ...superAdmin, ctrl.verifyGoogleAuth);
router.post("/admins/create", ...superAdmin, ctrl.createAdmin);
router.get("/admins", ...superAdmin, ctrl.listAdmins);
router.put("/admins/:id/permissions", ...superAdmin, ctrl.updateAdminPermissions);
router.put("/admins/:id", ...superAdmin, ctrl.updateAdmin);
router.delete("/admins/:id", ...superAdmin, ctrl.deleteAdmin);
router.get("/admins/permissions/list", ...superAdmin, ctrl.getAvailablePermissions);

module.exports = router;
