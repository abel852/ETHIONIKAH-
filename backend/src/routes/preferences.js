const express = require("express");
const router = express.Router();
const { authenticate, requireActive } = require("../middleware/auth");
const { updatePreferences, getPreferences } = require("../controllers/preferencesController");

router.get("/", authenticate, requireActive, getPreferences);
router.patch("/", authenticate, requireActive, updatePreferences);

module.exports = router;
