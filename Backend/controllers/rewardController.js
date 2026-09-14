const mongoose = require("mongoose");
const User = require("../models/User");
const {
  getRewardSettings,
  quoteRedemption,
  rupeeValueOfBalance
} = require("../utils/rewardService");
const RewardTransaction = require("../models/RewardTransaction");

const sendError = (res, err, fallback) => {
  if (err.status) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  console.error("Rewards error:", err.message);
  return res.status(500).json({ success: false, message: fallback });
};

// =====================================
// GET OWN SUMMARY (authenticated)
// Balance, lifetime stats, value + current rules for the UI.
// =====================================
const getSummary = async (req, res) => {
  try {
    const [user, settings] = await Promise.all([
      User.findById(req.user.userId).select(
        "rewardPoints lifetimeRewardPoints redeemedRewardPoints"
      ),
      getRewardSettings()
    ]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const balance = Number(user.rewardPoints) || 0;
    res.status(200).json({
      success: true,
      balance,
      value: rupeeValueOfBalance(settings, balance),
      lifetimeEarned: Number(user.lifetimeRewardPoints) || 0,
      lifetimeRedeemed: Number(user.redeemedRewardPoints) || 0,
      rules: {
        pointsPer100: settings.pointsPer100,
        rupeesPerPoint: settings.rupeesPerPoint,
        minimumRedemptionPoints: settings.minimumRedemptionPoints,
        maximumRedemptionPoints: settings.maximumRedemptionPoints
      }
    });
  } catch (error) {
    sendError(res, error, "Unable to load rewards.");
  }
};

// =====================================
// GET OWN TRANSACTIONS (authenticated, latest 30)
// =====================================
const getTransactions = async (req, res) => {
  try {
    const transactions = await RewardTransaction.find({
      user: req.user.userId
    })
      .populate("order", "orderId")
      .sort({ createdAt: -1 })
      .limit(30);
    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    sendError(res, error, "Unable to load rewards.");
  }
};

// =====================================
// QUOTE REDEMPTION (authenticated)
// Body: { points } -> backend-validated { points, discount, balance }.
// =====================================
const quote = async (req, res) => {
  try {
    const result = await quoteRedemption({
      userId: req.user.userId,
      requestedPoints: req.body.points
    });
    res.status(200).json({
      success: true,
      points: result.points,
      discount: result.discount,
      balance: result.balance
    });
  } catch (error) {
    if (error.status) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }
    console.error("Rewards error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to redeem points. Please try again."
    });
  }
};

// =====================================
// GET SETTINGS (public: checkout renders limits from these)
// =====================================
const getSettings = async (req, res) => {
  try {
    const settings = await getRewardSettings();
    res.status(200).json({ success: true, settings });
  } catch (error) {
    sendError(res, error, "Server error while fetching reward settings");
  }
};

// =====================================
// UPDATE SETTINGS (Admin)
// =====================================
const updateSettings = async (req, res) => {
  try {
    const pick = (key, fallback) =>
      req.body[key] === undefined || req.body[key] === ""
        ? fallback
        : Number(req.body[key]);
    const fields = {
      pointsPer100: pick("pointsPer100", 10),
      rupeesPerPoint: pick("rupeesPerPoint", 0.1),
      minimumRedemptionPoints: pick("minimumRedemptionPoints", 100),
      maximumRedemptionPoints: pick("maximumRedemptionPoints", 2000)
    };
    for (const [label, value] of Object.entries(fields)) {
      if (!Number.isFinite(value) || value < 0) {
        const err = new Error(`${label} must be a non-negative number`);
        err.status = 400;
        throw err;
      }
    }
    if (!(fields.maximumRedemptionPoints >= 1)) {
      const err = new Error("Maximum redemption must be at least 1 point");
      err.status = 400;
      throw err;
    }
    const settings = await getRewardSettings();
    Object.assign(settings, fields);
    await settings.save();
    res.status(200).json({
      success: true,
      message: "Reward settings updated successfully",
      settings
    });
  } catch (error) {
    sendError(res, error, "Server error while saving reward settings");
  }
};

// =====================================
// MANUAL ADJUST (Admin): { userId, points, reason }
// Positive credits, negative deducts (guarded). Always audited.
// =====================================
const adjustPoints = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const points = Math.trunc(Number(req.body.points) || 0);
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    if (!points) {
      const err = new Error("Adjustment points cannot be zero");
      err.status = 400;
      throw err;
    }
    if (!String(reason || "").trim()) {
      const err = new Error("A reason is required for manual adjustments");
      err.status = 400;
      throw err;
    }
    const user = await User.findById(userId).select(
      "rewardPoints lifetimeRewardPoints redeemedRewardPoints"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    if (points > 0) {
      await User.findByIdAndUpdate(userId, {
        $inc: { rewardPoints: points, lifetimeRewardPoints: points }
      });
    } else {
      // Atomic guard: never drive the balance negative.
      const updated = await User.findOneAndUpdate(
        { _id: userId, rewardPoints: { $gte: -points } },
        { $inc: { rewardPoints: points, redeemedRewardPoints: -points } },
        { new: true }
      );
      if (!updated) {
        const err = new Error("User does not have enough points");
        err.status = 400;
        throw err;
      }
    }
    await RewardTransaction.create({
      user: userId,
      order: null,
      type: "adjust",
      points,
      description: String(reason).trim().slice(0, 200)
    });
    const fresh = await User.findById(userId).select(
      "rewardPoints lifetimeRewardPoints redeemedRewardPoints"
    );
    res.status(200).json({
      success: true,
      message: "Reward balance adjusted successfully",
      balance: Number(fresh.rewardPoints) || 0
    });
  } catch (error) {
    sendError(res, error, "Server error while adjusting rewards");
  }
};

module.exports = {
  getSummary,
  getTransactions,
  quote,
  getSettings,
  updateSettings,
  adjustPoints
};
