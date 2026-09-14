const mongoose = require("mongoose");
const Coupon = require("../models/Coupon");
const CouponUsage = require("../models/CouponUsage");
const { validateAndPriceCoupon } = require("../utils/couponService");

const CATEGORIES = ["Starter", "Main Course", "Dessert", "Beverage"];

const sendError = (res, err, fallback) => {
  if (err.status) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  console.error("Coupon error:", err.message);
  return res.status(500).json({ success: false, message: fallback });
};

// Normalize admin input into coupon fields. Throws 400 on bad values.
const parseCouponInput = (body) => {
  const code = String(body.code || "").trim().toUpperCase();
  if (!code || code.length < 3 || code.length > 30) {
    const err = new Error("Coupon code must be 3-30 characters");
    err.status = 400;
    throw err;
  }

  const discountType = String(body.discountType || "").toUpperCase();
  if (!["PERCENTAGE", "FIXED"].includes(discountType)) {
    const err = new Error("Discount type must be PERCENTAGE or FIXED");
    err.status = 400;
    throw err;
  }

  const discountValue = Number(body.discountValue);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    const err = new Error("Discount value must be greater than 0");
    err.status = 400;
    throw err;
  }
  if (discountType === "PERCENTAGE" && discountValue > 90) {
    const err = new Error("Percentage discount cannot exceed 90%");
    err.status = 400;
    throw err;
  }

  const minimumOrderAmount = Number(body.minimumOrderAmount ?? 0);
  const maximumDiscount =
    body.maximumDiscount === "" ||
    body.maximumDiscount === null ||
    body.maximumDiscount === undefined
      ? null
      : Number(body.maximumDiscount);
  const usageLimit =
    body.usageLimit === "" ||
    body.usageLimit === null ||
    body.usageLimit === undefined
      ? null
      : Number(body.usageLimit);
  const perUserLimit = Number(body.perUserLimit ?? 1);

  if (minimumOrderAmount < 0) {
    const err = new Error("Minimum order amount cannot be negative");
    err.status = 400;
    throw err;
  }
  if (maximumDiscount !== null && !(maximumDiscount > 0)) {
    const err = new Error("Maximum discount must be greater than 0");
    err.status = 400;
    throw err;
  }
  if (usageLimit !== null && !(Number.isInteger(usageLimit) && usageLimit > 0)) {
    const err = new Error("Usage limit must be a positive whole number");
    err.status = 400;
    throw err;
  }
  if (!(Number.isInteger(perUserLimit) && perUserLimit > 0)) {
    const err = new Error("Per user limit must be a positive whole number");
    err.status = 400;
    throw err;
  }

  const startDate = body.startDate ? new Date(body.startDate) : null;
  const expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
  if (body.startDate && Number.isNaN(startDate.getTime())) {
    const err = new Error("Invalid start date");
    err.status = 400;
    throw err;
  }
  if (body.expiryDate && Number.isNaN(expiryDate.getTime())) {
    const err = new Error("Invalid expiry date");
    err.status = 400;
    throw err;
  }
  if (startDate && expiryDate && expiryDate < startDate) {
    const err = new Error("Expiry date cannot be before start date");
    err.status = 400;
    throw err;
  }

  const applicableCategories = Array.isArray(body.applicableCategories)
    ? body.applicableCategories.filter((c) => CATEGORIES.includes(c))
    : [];
  const applicableProducts = Array.isArray(body.applicableProducts)
    ? body.applicableProducts.filter((id) => mongoose.isValidObjectId(id))
    : [];

  return {
    code,
    discountType,
    discountValue,
    minimumOrderAmount,
    maximumDiscount,
    usageLimit,
    perUserLimit,
    startDate,
    expiryDate,
    isActive: body.isActive !== false,
    applicableCategories,
    applicableProducts
  };
};

// =====================================
// VALIDATE COUPON (authenticated user)
// Body: { code, items: [{ menuItem, quantity, customization? }] }
// =====================================
const validateCoupon = async (req, res) => {
  try {
    const { code, items, pincode } = req.body;
    const result = await validateAndPriceCoupon({
      code,
      items,
      userId: req.user.userId,
      pincode
    });
    res.status(200).json({
      success: true,
      message: `${result.coupon.code} applied`,
      couponCode: result.coupon.code,
      discountType: result.coupon.discountType,
      discountValue: result.coupon.discountValue,
      subtotal: result.subtotal,
      eligibleSubtotal: result.eligibleSubtotal,
      discountAmount: result.discountAmount,
      deliveryCharge: result.deliveryCharge,
      totalAmount: result.totalAmount
    });
  } catch (error) {
    if (error.status) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }
    console.error("Coupon error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to apply coupon. Please try again."
    });
  }
};

// =====================================
// LIST COUPONS (Admin)
// =====================================
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: coupons.length,
      coupons
    });
  } catch (error) {
    sendError(error, error, "Server error while fetching coupons");
  }
};

// =====================================
// CREATE COUPON (Admin)
// =====================================
const createCoupon = async (req, res) => {
  try {
    const fields = parseCouponInput(req.body);
    const existing = await Coupon.findOne({ code: fields.code });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A coupon with this code already exists"
      });
    }
    const coupon = await Coupon.create(fields);
    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A coupon with this code already exists"
      });
    }
    sendError(error, error, "Server error while creating coupon");
  }
};

// =====================================
// UPDATE COUPON (Admin)
// =====================================
const updateCoupon = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }
    const fields = parseCouponInput({ ...req.body, code: req.body.code ?? coupon.code });
    if (fields.code !== coupon.code) {
      const clash = await Coupon.findOne({ code: fields.code });
      if (clash) {
        return res.status(409).json({
          success: false,
          message: "A coupon with this code already exists"
        });
      }
    }
    Object.assign(coupon, fields);
    await coupon.save();
    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A coupon with this code already exists"
      });
    }
    sendError(error, error, "Server error while updating coupon");
  }
};

// =====================================
// DELETE COUPON (Admin)
// =====================================
const deleteCoupon = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }
    const redemptions = await CouponUsage.countDocuments({ coupon: coupon._id });
    if (redemptions > 0) {
      // Keep history intact: deactivate instead of deleting used coupons.
      coupon.isActive = false;
      await coupon.save();
      return res.status(200).json({
        success: true,
        message: "Coupon has redemptions, so it was deactivated instead of deleted",
        coupon
      });
    }
    await coupon.deleteOne();
    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully"
    });
  } catch (error) {
    sendError(error, error, "Server error while deleting coupon");
  }
};

module.exports = {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
};
