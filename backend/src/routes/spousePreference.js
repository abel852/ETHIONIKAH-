const express = require("express");
const router = express.Router();
const spousePreferenceController = require("../controllers/spousePreferenceController");
const { authenticate } = require("../middleware/auth");

router.post("/", authenticate, spousePreferenceController.createOrUpdateSpousePreference);
router.get("/", authenticate, spousePreferenceController.getSpousePreference);

module.exports = router;
