const express = require("express");
const router = express.Router();
const matchController = require("../controllers/matchController");
const { authenticate, requireActive } = require("../middleware/auth");
const { matchActionLimiter } = require("../middleware/rateLimiter");
const { validate } = require("../validators/auth");
const { sendInterestSchema, respondToInterestSchema, addFavoriteSchema, searchSchema } = require("../validators/match");
const { cacheResponse } = require("../middleware/cache");

router.get("/recommended", authenticate, requireActive, matchController.getRecommendedMatches);
router.get("/suggested", authenticate, requireActive, matchController.getSuggestedMatches);
router.get("/search", authenticate, requireActive, validate(searchSchema), matchController.searchProfiles);
router.post("/interest", authenticate, requireActive, matchActionLimiter, validate(sendInterestSchema), matchController.sendInterest);
router.post("/pass", authenticate, requireActive, matchActionLimiter, matchController.passProfile);
router.put("/:id/respond", authenticate, requireActive, matchActionLimiter, validate(respondToInterestSchema), matchController.respondToInterest);
router.get("/my-matches", authenticate, requireActive, cacheResponse(30), matchController.getMyMatches);
router.get("/likes-received", authenticate, requireActive, cacheResponse(30), matchController.getLikesReceived);
router.get("/likes-sent", authenticate, requireActive, cacheResponse(30), matchController.getLikesSent);
router.get("/visitors", authenticate, requireActive, cacheResponse(30), matchController.getVisitors);
router.post("/favorites", authenticate, requireActive, matchActionLimiter, validate(addFavoriteSchema), matchController.addToFavorites);
router.get("/favorites", authenticate, requireActive, cacheResponse(30), matchController.getFavorites);
router.delete("/favorites/:favoritedUserId", authenticate, requireActive, matchController.removeFromFavorites);
router.post("/remove-interest", authenticate, requireActive, matchActionLimiter, matchController.removeInterest);

module.exports = router;
