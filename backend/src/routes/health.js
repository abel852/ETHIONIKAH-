const express = require("express");
const router = express.Router();
const healthController = require("../controllers/healthController");
const { authenticate, requireActive } = require("../middleware/auth");

router.post("/", authenticate, requireActive, healthController.saveHealthInfo);
router.get("/me", authenticate, requireActive, healthController.getHealthInfo);
router.delete("/me", authenticate, requireActive, healthController.deleteHealthInfo);
router.get("/public/:profileId", authenticate, healthController.getPublicHealthInfo);

module.exports = router;
