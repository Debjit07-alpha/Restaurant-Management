const MenuItem = require("../models/MenuItem");
const Coupon = require("../models/Coupon");
const CouponUsage = require("../models/CouponUsage");
const { isOrderable, unavailableMessage } = require("./menuAvailability");
const { quoteDelivery } = require("./deliveryService");
const {
  getDeliveryCharge,
  resolveCustomization
} = require("./orderPricing");

// Round money to whole rupees (all prices are integer rupees).
const roundMoney = (value) => Math.max(0, Math.round(Number(value) || 0));

// Pure discount math (no DB): easy to unit-test.
// - PERCENTAGE: eligibleSubtotal * value / 100, capped by maximumDiscount.
// - FIXED: discountValue, capped by eligibleSubtotal (and maximumDiscount).
const computeDiscount = (coupon, eligibleSubtotal) => {
  const eligible = roundMoney(eligibleSubtotal);
  if (eligible <= 0) return 0;
  let discount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discount = (eligible * Number(coupon.discountValue)) / 100;
  } else {
    discount = Number(coupon.discountValue) || 0;
  }
  if (coupon.maximumDiscount != null && Number(coupon.maximumDiscount) > 0) {
    discount = Math.min(discount, Number(coupon.maximumDiscount));
  }
  return Math.min(roundMoney(discount), eligible);
};

// Price cart entries from the database (current menu prices +
// validated customization extras). Throws with a user-facing message
// when an item is missing / unavailable / badly customized.
// Returns priced lines: [{ menuItemId, name, category, unitPrice,
// quantity, subtotal }].
const priceCartItems = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error("Your cart is empty");
    err.status = 400;
    throw err;
  }
  const lines = [];
  for (const entry of items) {
    const quantity = Number(entry.quantity);
    if (!entry.menuItem || !Number.isInteger(quantity) || quantity < 1) {
      const err = new Error("Each item needs a valid menu item and quantity");
      err.status = 400;
      throw err;
    }
    const menuItem = await MenuItem.findById(entry.menuItem);
    if (!menuItem) {
      const err = new Error("A menu item in your cart no longer exists");
      err.status = 404;
      throw err;
    }
    if (!isOrderable(menuItem)) {
      const err = new Error(unavailableMessage(menuItem));
      err.status = 400;
      throw err;
    }
    let unitExtras = 0;
    try {
      const resolved = resolveCustomization(menuItem, entry.customization);
      unitExtras = resolved.unitExtras;
    } catch (customError) {
      const err = new Error(customError.message);
      err.status = 400;
      throw err;
    }
    const unitPrice = Number(menuItem.price) + unitExtras;
    lines.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      category: menuItem.category || "",
      unitPrice,
      quantity,
      subtotal: unitPrice * quantity
    });
  }
  return lines;
};

// Does a priced line fall inside the coupon's product/category scope?
// Empty applicableProducts + empty applicableCategories = whole cart.
const isLineEligible = (line, coupon) => {
  const hasProducts =
    Array.isArray(coupon.applicableProducts) &&
    coupon.applicableProducts.length > 0;
  const hasCategories =
    Array.isArray(coupon.applicableCategories) &&
    coupon.applicableCategories.length > 0;
  if (!hasProducts && !hasCategories) return true;
  if (
    hasProducts &&
    coupon.applicableProducts.some(
      (id) => String(id) === String(line.menuItemId)
    )
  ) {
    return true;
  }
  if (hasCategories && coupon.applicableCategories.includes(line.category)) {
    return true;
  }
  return false;
};

// Validate a coupon code against the database and the given cart.
// Uses the authenticated user id (never a frontend-supplied user).
// Optional pincode picks the delivery zone fee; without it the global
// base rule applies (cart page has no address yet).
// Returns { coupon, subtotal, eligibleSubtotal, discountAmount,
// deliveryCharge, totalAmount } or throws { status, message }.
const validateAndPriceCoupon = async ({ code, items, userId, pincode }) => {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) {
    const err = new Error("Enter a promo code");
    err.status = 400;
    throw err;
  }

  const coupon = await Coupon.findOne({ code: normalized });
  if (!coupon) {
    const err = new Error("Invalid coupon code");
    err.status = 404;
    throw err;
  }
  if (!coupon.isActive) {
    const err = new Error("This coupon is no longer active");
    err.status = 400;
    throw err;
  }

  const now = new Date();
  if (coupon.startDate && now < coupon.startDate) {
    const err = new Error("This coupon is not valid yet");
    err.status = 400;
    throw err;
  }
  if (coupon.expiryDate && now > coupon.expiryDate) {
    const err = new Error("Coupon expired");
    err.status = 400;
    throw err;
  }

  if (
    coupon.usageLimit != null &&
    Number(coupon.usedCount) >= Number(coupon.usageLimit)
  ) {
    const err = new Error("Coupon usage limit reached");
    err.status = 400;
    throw err;
  }

  if (userId) {
    const userUses = await CouponUsage.countDocuments({
      coupon: coupon._id,
      user: userId
    });
    if (userUses >= Number(coupon.perUserLimit || 1)) {
      const err = new Error("You have already used this coupon");
      err.status = 400;
      throw err;
    }
  }

  // Price from the database so customization/add-ons count.
  const lines = await priceCartItems(items);
  const subtotal = roundMoney(
    lines.reduce((sum, line) => sum + line.subtotal, 0)
  );

  if (
    Number(coupon.minimumOrderAmount) > 0 &&
    subtotal < Number(coupon.minimumOrderAmount)
  ) {
    const err = new Error(
      `Minimum order amount is \u20B9${Number(coupon.minimumOrderAmount)}`
    );
    err.status = 400;
    throw err;
  }

  const eligibleSubtotal = roundMoney(
    lines
      .filter((line) => isLineEligible(line, coupon))
      .reduce((sum, line) => sum + line.subtotal, 0)
  );
  if (eligibleSubtotal <= 0) {
    const err = new Error("Coupon is not valid for these items");
    err.status = 400;
    throw err;
  }

  const discountAmount = computeDiscount(coupon, eligibleSubtotal);
  if (discountAmount <= 0) {
    const err = new Error("Coupon is not valid for these items");
    err.status = 400;
    throw err;
  }

  const quote = await quoteDelivery({
    pincode,
    subtotal,
    discountAmount
  });

  return {
    coupon,
    lines,
    subtotal,
    eligibleSubtotal,
    discountAmount,
    deliveryCharge: quote.deliveryCharge,
    estimatedDeliveryTime: quote.estimatedDeliveryTime,
    zoneName: quote.zoneName,
    totalAmount: subtotal - discountAmount + quote.deliveryCharge
  };
};

module.exports = {
  computeDiscount,
  priceCartItems,
  isLineEligible,
  validateAndPriceCoupon
};
