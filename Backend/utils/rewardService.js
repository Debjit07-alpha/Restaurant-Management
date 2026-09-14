const User = require("../models/User");
const RewardSettings = require("../models/RewardSettings");
const RewardTransaction = require("../models/RewardTransaction");

// Loyalty math + balance mutations. The database is the source of
// truth: balances are read from the user document, all mutations use
// atomic conditional updates so two tabs can never double-spend.

const DEFAULTS = {
  pointsPer100: 10,
  rupeesPerPoint: 0.1,
  minimumRedemptionPoints: 100,
  maximumRedemptionPoints: 2000
};

const getRewardSettings = async () => {
  const existing = await RewardSettings.findById("global");
  if (existing) return existing;
  try {
    return await RewardSettings.create({ _id: "global", ...DEFAULTS });
  } catch (error) {
    if (error.code === 11000) {
      return RewardSettings.findById("global");
    }
    throw error;
  }
};

// Eligible merchandise spend -> whole points. Proportional with floor:
// ₹100 -> 10, ₹250 -> 25, ₹999 -> 99 at defaults.
const pointsForSpend = (settings, eligibleAmount) => {
  const rate = Number(settings.pointsPer100) || 0;
  if (rate <= 0) return 0;
  return Math.floor((Math.max(0, Number(eligibleAmount) || 0) * rate) / 100);
};

// Points -> whole rupees. 420 pts -> ₹42 at defaults.
const discountForPoints = (settings, points) => {
  const value = Number(settings.rupeesPerPoint) || 0;
  if (value <= 0) return 0;
  return Math.floor(Math.max(0, Math.floor(Number(points) || 0)) * value);
};

const rupeeValueOfBalance = (settings, balance) =>
  discountForPoints(settings, balance);

// Validate a redemption request against live balance + rules.
// Returns { points, discount }. Never trusts frontend amounts.
const quoteRedemption = async ({ userId, requestedPoints }) => {
  const settings = await getRewardSettings();
  const requested = Math.floor(Number(requestedPoints) || 0);
  if (requested <= 0) {
    const err = new Error("Enter how many points to redeem");
    err.status = 400;
    throw err;
  }
  const minimum = Number(settings.minimumRedemptionPoints) || 0;
  if (minimum > 0 && requested < minimum) {
    const err = new Error(`Minimum redemption is ${minimum} points`);
    err.status = 400;
    throw err;
  }
  const maximum = Number(settings.maximumRedemptionPoints) || 0;
  if (maximum > 0 && requested > maximum) {
    const err = new Error(`Maximum ${maximum} points per order`);
    err.status = 400;
    throw err;
  }
  const user = await User.findById(userId).select(
    "rewardPoints lifetimeRewardPoints redeemedRewardPoints"
  );
  const balance = Number(user?.rewardPoints) || 0;
  if (!user || requested > balance) {
    const err = new Error("You don't have enough reward points.");
    err.status = 400;
    throw err;
  }
  return {
    points: requested,
    discount: discountForPoints(settings, requested),
    balance,
    settings
  };
};

// Atomic conditional deduction. Returns true when the points were
// actually deducted (balance was sufficient at write time).
const deductPoints = async (userId, points) =>
  User.findOneAndUpdate(
    { _id: userId, rewardPoints: { $gte: points } },
    { $inc: { rewardPoints: -points, redeemedRewardPoints: points } },
    { new: true }
  );

// Atomic refund (used when order creation fails after deduction, and
// for cancellation reversals). Always succeeds by construction.
const refundPoints = async (userId, points) =>
  User.findByIdAndUpdate(userId, {
    $inc: { rewardPoints: points, redeemedRewardPoints: -points }
  });

// Atomic earn credit. Returns the credited points.
const creditPoints = async (userId, points) => {
  if (points <= 0) return 0;
  await User.findByIdAndUpdate(userId, {
    $inc: { rewardPoints: points, lifetimeRewardPoints: points }
  });
  return points;
};

module.exports = {
  DEFAULTS,
  getRewardSettings,
  pointsForSpend,
  discountForPoints,
  rupeeValueOfBalance,
  quoteRedemption,
  deductPoints,
  refundPoints,
  creditPoints,
  RewardTransaction
};
