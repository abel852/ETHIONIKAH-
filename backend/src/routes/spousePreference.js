const express = require("express");
const router = express.Router();
const spousePreferenceController = require("../controllers/spousePreferenceController");
const { authenticate, requireActive } = require("../middleware/auth");

router.post("/", authenticate, requireActive, spousePreferenceController.createOrUpdateSpousePreference);
router.get("/", authenticate, requireActive, spousePreferenceController.getSpousePreference);

module.exports = router;
