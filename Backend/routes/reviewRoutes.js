const express = require("express");

const {
  getMenuItemReviews,
  getMyReviews,
  createReview,
  updateReview,
  deleteReview,
  getAllReviews,
  MAX_IMAGES
} = require("../controllers/reviewController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public: reviews + average for one menu item
router.get("/menu/:menuItemId", getMenuItemReviews);

// Authenticated: own reviews (optionally ?orderId=...)
router.get("/my", protect, getMyReviews);

// Authenticated: review a delivered, owned, purchased item (photos optional)
router.post("/", protect, upload.array("images", MAX_IMAGES), createReview);

// Owner: edit review (photos optional, replaced when re-uploaded)
router.put("/:reviewId", protect, upload.array("images", MAX_IMAGES), updateReview);

// Owner or Admin: delete review
router.delete("/:reviewId", protect, deleteReview);

// Admin: moderate all reviews
router.get("/", protect, adminOnly, getAllReviews);

module.exports = router;
