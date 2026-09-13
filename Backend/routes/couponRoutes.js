const express = require("express");

const {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} = require("../controllers/couponController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// Authenticated: validate a promo code against the current cart.
// Body: { code, items }. Discount is computed on the backend.
router.post("/validate", protect, validateCoupon);

// Admin: manage coupons (uses existing admin auth, no new system).
router.get("/", protect, adminOnly, getAllCoupons);
router.post("/", protect, adminOnly, createCoupon);
router.put("/:id", protect, adminOnly, updateCoupon);
router.delete("/:id", protect, adminOnly, deleteCoupon);

module.exports = router;
