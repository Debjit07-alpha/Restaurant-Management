const mongoose = require("mongoose");
const Review = require("../models/Review");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

const MAX_IMAGES = 3;
const MAX_COMMENT_LENGTH = 500;

// Recompute an item's denormalized average/count from its reviews.
const refreshRatingSummary = async (menuItemId) => {
  const stats = await Review.aggregate([
    { $match: { menuItem: new mongoose.Types.ObjectId(menuItemId) } },
    {
      $group: {
        _id: null,
        average: { $avg: "$rating" },
        count: { $sum: 1 }
      }
    }
  ]);
  await MenuItem.findByIdAndUpdate(menuItemId, {
    ratingAverage: stats[0]?.average || 0,
    ratingCount: stats[0]?.count || 0
  });
};

const uploadBufferToCloudinary = (file) => {
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  return cloudinary.uploader.upload(dataUri, {
    folder: "tastybites/reviews"
  });
};

// Eligibility: the order must exist, belong to the user, be completed
// (Delivered, or Served for dine-in), and actually contain the menu
// item. Never trusts frontend ownership.
const verifyPurchase = async (userId, menuItemId, orderId) => {
  if (!mongoose.isValidObjectId(orderId)) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }
  if (order.user.toString() !== String(userId)) {
    const err = new Error("You can only review your own orders");
    err.status = 403;
    throw err;
  }
  if (order.orderStatus !== "Delivered" && order.orderStatus !== "Served") {
    const err = new Error("You can review items once the order is delivered");
    err.status = 403;
    throw err;
  }
  const purchased = (order.items || []).some((item) => {
    const id =
      item.menuItem && typeof item.menuItem === "object"
        ? item.menuItem._id
        : item.menuItem;
    return id && String(id) === String(menuItemId);
  });
  if (!purchased) {
    const err = new Error("You did not order this item");
    err.status = 403;
    throw err;
  }
  return order;
};

const sendError = (res, err, fallback) => {
  if (err.status) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  console.error("Review error:", err.message);
  return res.status(500).json({ success: false, message: fallback });
};

// =====================================
// GET REVIEWS FOR A MENU ITEM (public)
// =====================================
const getMenuItemReviews = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.menuItemId)) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }
    const menuItem = await MenuItem.findById(req.params.menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }
    const reviews = await Review.find({ menuItem: menuItem._id })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({
      success: true,
      average: menuItem.ratingAverage || 0,
      count: menuItem.ratingCount || 0,
      reviews
    });
  } catch (error) {
    sendError(res, error, "Server error while fetching reviews");
  }
};

// =====================================
// GET OWN REVIEWS (authenticated)
// =====================================
const getMyReviews = async (req, res) => {
  try {
    const filter = { user: req.user.userId };
    if (req.query.orderId) {
      if (!mongoose.isValidObjectId(req.query.orderId)) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }
      const order = await Order.findById(req.query.orderId);
      if (!order || order.user.toString() !== String(req.user.userId)) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }
      filter.order = order._id;
    }
    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    sendError(res, error, "Server error while fetching reviews");
  }
};

// =====================================
// CREATE REVIEW (authenticated)
// =====================================
const createReview = async (req, res) => {
  try {
    const { menuItemId, orderId } = req.body;
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || "").slice(0, MAX_COMMENT_LENGTH);

    if (!mongoose.isValidObjectId(menuItemId)) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5 stars"
      });
    }

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }

    try {
      await verifyPurchase(req.user.userId, menuItem._id, orderId);
    } catch (eligibilityError) {
      return sendError(res, eligibilityError);
    }

    const existing = await Review.findOne({
      user: req.user.userId,
      order: orderId,
      menuItem: menuItem._id
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You already reviewed this item from this order"
      });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      if (!isCloudinaryConfigured()) {
        return res.status(400).json({
          success: false,
          message: "Photo upload is not configured on the server"
        });
      }
      const uploads = await Promise.all(
        req.files.map((file) => uploadBufferToCloudinary(file))
      );
      images = uploads.map((u) => u.secure_url);
    }

    const review = await Review.create({
      user: req.user.userId,
      menuItem: menuItem._id,
      order: orderId,
      rating,
      comment,
      images
    });

    await refreshRatingSummary(menuItem._id);

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review
    });
  } catch (error) {
    // Duplicate (user, order, menuItem) raced past the check.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You already reviewed this item from this order"
      });
    }
    sendError(res, error, "Server error while submitting review");
  }
};

// =====================================
// UPDATE REVIEW (owner only)
// =====================================
const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review || review.user.toString() !== String(req.user.userId)) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    if (req.body.rating !== undefined) {
      const rating = Number(req.body.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5 stars"
        });
      }
      review.rating = rating;
    }
    if (req.body.comment !== undefined) {
      review.comment = String(req.body.comment).slice(0, MAX_COMMENT_LENGTH);
    }
    if (req.files && req.files.length > 0) {
      if (!isCloudinaryConfigured()) {
        return res.status(400).json({
          success: false,
          message: "Photo upload is not configured on the server"
        });
      }
      const uploads = await Promise.all(
        req.files.map((file) => uploadBufferToCloudinary(file))
      );
      review.images = uploads.map((u) => u.secure_url);
    }

    await review.save();
    await refreshRatingSummary(review.menuItem);

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review
    });
  } catch (error) {
    sendError(res, error, "Server error while updating review");
  }
};

// =====================================
// DELETE REVIEW (owner or Admin)
// =====================================
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }
    const isOwner = review.user.toString() === String(req.user.userId);
    if (!isOwner && req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this review"
      });
    }

    const menuItemId = review.menuItem;
    await review.deleteOne();
    await refreshRatingSummary(menuItemId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (error) {
    sendError(res, error, "Server error while deleting review");
  }
};

// =====================================
// LIST ALL REVIEWS (Admin)
// =====================================
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user", "name email")
      .populate("menuItem", "name")
      .populate("order", "orderId")
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    sendError(res, error, "Server error while fetching reviews");
  }
};

module.exports = {
  getMenuItemReviews,
  getMyReviews,
  createReview,
  updateReview,
  deleteReview,
  getAllReviews,
  MAX_IMAGES
};
