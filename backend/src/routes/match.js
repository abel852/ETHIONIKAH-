const express = require("express");
const router = express.Router();
const matchController = require("../controllers/matchController");
const { authenticate } = require("../middleware/auth");

router.get("/recommended", authenticate, matchController.getRecommendedMatches);
router.get("/search", authenticate, matchController.searchProfiles);
router.post("/interest", authenticate, matchController.sendInterest);
router.put("/:id/respond", authenticate, matchController.respondToInterest);
router.get("/my-matches", authenticate, matchController.getMyMatches);
router.post("/favorites", authenticate, matchController.addToFavorites);
router.get("/favorites", authenticate, matchController.getFavorites);
router.delete("/favorites/:favoritedUserId", authenticate, matchController.removeFromFavorites);

module.exports = router;
