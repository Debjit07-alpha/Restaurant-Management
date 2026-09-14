const DeliverySettings = require("../models/DeliverySettings");
const DeliveryZone = require("../models/DeliveryZone");

// Deterministic delivery rules (documented for admin + checkout):
// 1. Free delivery when payable subtotal (after coupon discount) is
//    at/above the global freeDeliveryThreshold — any zone, any address.
// 2. Otherwise the active zone matching the order pincode decides the
//    fee (and ETA). Zone minimum overrides the global minimum.
// 3. No zones configured yet -> legacy behavior: base fee everywhere,
//    everything deliverable (backward compatible).
// 4. Zones exist but none matches the pincode -> NOT deliverable.
// 5. Minimum order (when > 0) is checked against the pre-discount
//    subtotal and rejects the order/quote when unmet.

const DEFAULTS = {
  minimumOrderAmount: 0,
  baseDeliveryFee: 40,
  freeDeliveryThreshold: 499,
  estimatedDeliveryTime: "30–45 minutes"
};

const normalizePincode = (value) => String(value || "").trim();

const isValidPincode = (value) => /^\d{6}$/.test(normalizePincode(value));

const roundMoney = (value) => Math.max(0, Math.round(Number(value) || 0));

// Singleton settings; auto-created with legacy defaults on first read.
const getSettings = async () => {
  const existing = await DeliverySettings.findById("global");
  if (existing) return existing;
  try {
    return await DeliverySettings.create({ _id: "global", ...DEFAULTS });
  } catch (error) {
    // Raced creation: re-read the winner instead of failing.
    if (error.code === 11000) {
      return DeliverySettings.findById("global");
    }
    throw error;
  }
};

const findZoneForPincode = async (pincode) => {
  const code = normalizePincode(pincode);
  if (!isValidPincode(code)) return null;
  return DeliveryZone.findOne({ isActive: true, pincodes: code });
};

// Quote delivery for a checkout. Pure calculation from DB truth — the
// frontend only displays the result, the order API re-runs it.
// Precedence (highest first):
// 1. Zone match decides fee/ETA/minimum: a zone custom value wins,
//    otherwise the global value applies (never both at once).
// 2. Free delivery threshold beats any fee (checked on the payable
//    amount so coupons count). Minimum-order eligibility still applies.
// 3. No zones configured yet -> legacy base-fee behavior, deliverable
//    everywhere (backward compatible).
// 4. Zones exist but none matches the pincode -> NOT deliverable.
// Returns { deliverable, meetsMinimum, deliveryCharge, zoneName,
// estimatedDeliveryTime, minimumOrderAmount, freeDeliveryThreshold,
// baseDeliveryFee, reason? }.
const quoteDelivery = async ({ pincode, subtotal, discountAmount = 0 }) => {
  const settings = await getSettings();
  const cleanSubtotal = roundMoney(subtotal);
  const payable = roundMoney(cleanSubtotal - discountAmount);

  const quote = {
    deliverable: true,
    meetsMinimum: true,
    deliveryCharge: 0,
    zoneName: null,
    estimatedDeliveryTime: settings.estimatedDeliveryTime,
    minimumOrderAmount: settings.minimumOrderAmount,
    freeDeliveryThreshold: settings.freeDeliveryThreshold,
    baseDeliveryFee: settings.baseDeliveryFee,
    reason: null
  };

  if (cleanSubtotal <= 0) {
    quote.deliveryCharge = 0;
    return quote;
  }

  const zone = await findZoneForPincode(pincode);
  const anyZone = await DeliveryZone.exists({ isActive: true });

  // Effective values: zone custom wins, else global (Rule 1 + Rule 2).
  // Resolved BEFORE the free-delivery check so minimum eligibility is
  // independent of free delivery.
  if (zone) {
    quote.zoneName = zone.name;
    if (zone.estimatedDeliveryTime) {
      quote.estimatedDeliveryTime = zone.estimatedDeliveryTime;
    }
    if (zone.minimumOrderAmount != null) {
      quote.minimumOrderAmount = zone.minimumOrderAmount;
    }
  }

  const minimum = Number(quote.minimumOrderAmount) || 0;
  if (minimum > 0 && cleanSubtotal < minimum) {
    quote.meetsMinimum = false;
  }

  // Free delivery threshold has highest pricing priority (Rule 3).
  if (payable >= Number(settings.freeDeliveryThreshold)) {
    quote.deliveryCharge = 0;
    return quote;
  }

  if (zone) {
    quote.deliveryCharge = roundMoney(zone.deliveryFee);
    return quote;
  }

  if (anyZone) {
    // Zones are configured but this pincode is not served.
    quote.deliverable = false;
    quote.reason = "Delivery is currently unavailable to this location.";
    return quote;
  }

  // No zones yet: legacy base-fee behavior, deliverable everywhere.
  quote.deliveryCharge = roundMoney(settings.baseDeliveryFee);
  return quote;
};

// Enforce the effective minimum order. Throws { status, message }.
const assertMinimumOrder = (quote, subtotal) => {
  const minimum = Number(quote.minimumOrderAmount) || 0;
  if (minimum > 0 && roundMoney(subtotal) < minimum) {
    const err = new Error(`Minimum order amount is \u20B9${minimum}`);
    err.status = 400;
    throw err;
  }
};

module.exports = {
  DEFAULTS,
  normalizePincode,
  isValidPincode,
  getSettings,
  findZoneForPincode,
  quoteDelivery,
  assertMinimumOrder
};
