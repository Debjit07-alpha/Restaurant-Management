const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const CouponUsage = require("../models/CouponUsage");
const { isOrderable } = require("../utils/menuAvailability");
const {
  FREE_DELIVERY_ABOVE,
  DELIVERY_CHARGE,
  getDeliveryCharge,
  resolveCustomization
} = require("../utils/orderPricing");
const { validateAndPriceCoupon } = require("../utils/couponService");
const { quoteDelivery, assertMinimumOrder } = require("../utils/deliveryService");
const RewardTransaction = require("../models/RewardTransaction");
const {
  getRewardSettings,
  quoteRedemption,
  deductPoints,
  refundPoints,
  discountForPoints
} = require("../utils/rewardService");

const PAYMENT_METHODS = ["Cash on Delivery", "UPI on Delivery"];
const DINE_IN_PAYMENT_METHODS = ["Cash at Counter", "UPI at Table"];
const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready",
  "Served",
  "Delivered",
  "Cancelled"
];

// Readable customer-facing identifier, e.g. TB-20260911-A1B2C3
const generateOrderId = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TB-${date}-${suffix}`;
};

// =============================
// CREATE ORDER (logged-in user)
// =============================
const createOrder = async (req, res) => {
  // Declared outside try: the catch block refunds deducted points.
  let rewardPointsUsed = 0;
  let rewardsDeducted = false;
  try {
    const {
      customerName,
      mobile,
      address,
      paymentMethod,
      items,
      orderType: requestedType,
      tableNumber,
      qrToken,
      guestCount
    } = req.body;

    // Two modes, one pipeline: delivery (default, unchanged) and dine-in
    // (table-verified, no address, no delivery fee).
    const orderType = requestedType === "dine_in" ? "dine_in" : "delivery";
    const isDineIn = orderType === "dine_in";

    // Validate contact (both modes need a reachable customer)
    if (!customerName || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Full name and mobile number are required"
      });
    }

    if (!/^\d{10}$/.test(String(mobile).trim())) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number"
      });
    }

    let dineInTable = null;
    let dineInSession = null;
    let guests = null;
    if (isDineIn) {
      // QR token + table verified server-side; never trusted from input.
      const {
        verifyTableAccess,
        getOrCreateActiveSession
      } = require("../utils/dineInService");
      try {
        dineInTable = await verifyTableAccess({ tableNumber, qrToken });
      } catch (tableError) {
        return res.status(tableError.status || 400).json({
          success: false,
          message: tableError.message
        });
      }
      if (guestCount !== undefined && guestCount !== null && guestCount !== "") {
        guests = Number(guestCount);
        if (!Number.isInteger(guests) || guests < 1 || guests > 50) {
          return res.status(400).json({
            success: false,
            message: "Guest count must be 1–50"
          });
        }
      }
      dineInSession = await getOrCreateActiveSession(dineInTable);
    } else {
      if (
        !address ||
        !address.flat ||
        !address.street ||
        !address.city ||
        !address.state ||
        !address.pincode
      ) {
        return res.status(400).json({
          success: false,
          message: "Flat, street, city, state and pincode are required"
        });
      }

      if (!/^\d{6}$/.test(String(address.pincode).trim())) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid 6-digit pincode"
        });
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item"
      });
    }

    const allowedMethods = isDineIn ? DINE_IN_PAYMENT_METHODS : PAYMENT_METHODS;
    const method = paymentMethod || (isDineIn ? "Cash at Counter" : "Cash on Delivery");
    if (!allowedMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method"
      });
    }

    // Build order items from current MongoDB prices (never trust frontend).
    // Reject the whole order if any item is missing, sold out or hidden,
    // naming the culprits so the customer knows what to remove.
    const orderItems = [];
    const unavailableItems = [];
    for (const entry of items) {
      const quantity = Number(entry.quantity);
      if (!entry.menuItem || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Each item needs a valid menu item and quantity"
        });
      }

      const menuItem = await MenuItem.findById(entry.menuItem);
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: "A menu item in your cart no longer exists"
        });
      }

      if (!isOrderable(menuItem)) {
        unavailableItems.push(menuItem.name);
        continue;
      }

      // Customized entries: validate selections against the menu item's
      // own options and price extras from the database (never the frontend).
      let unitExtras = 0;
      let customizationSnapshot;
      try {
        const resolved = resolveCustomization(
          menuItem,
          entry.customization
        );
        unitExtras = resolved.unitExtras;
        customizationSnapshot = resolved.snapshot;
      } catch (customError) {
        return res.status(400).json({
          success: false,
          message: customError.message
        });
      }

      const unitPrice = menuItem.price + unitExtras;
      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: unitPrice,
        quantity,
        subtotal: unitPrice * quantity,
        image: menuItem.image || "",
        ...(customizationSnapshot
          ? { customization: customizationSnapshot }
          : {})
      });
    }

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some items in your cart are no longer available: ${unavailableItems.join(", ")}. Please remove them and try again.`
      });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Optional promo code: re-validated here from the database using
    // DB prices. Frontend totals/discounts are never trusted.
    let couponCode = "";
    let couponId = null;
    let discountAmount = 0;
    if (req.body.couponCode !== undefined && req.body.couponCode !== null && String(req.body.couponCode).trim() !== "") {
      try {
        const priced = await validateAndPriceCoupon({
          code: req.body.couponCode,
          items,
          userId: req.user.userId
        });
        couponCode = priced.coupon.code;
        couponId = priced.coupon._id;
        discountAmount = priced.discountAmount;
      } catch (couponError) {
        return res.status(couponError.status || 400).json({
          success: false,
          message: couponError.message || "Invalid coupon code"
        });
      }
    }

    // Delivery is quoted from DB settings + the final checkout pincode
    // (zone match, free threshold on the payable amount, minimum order).
    // Frontend fees/totals are never trusted; history is snapshotted.
    // Dine-in has no delivery: fee is always 0, no zone/minimum checks.
    let deliveryCharge = 0;
    if (!isDineIn) {
      const quote = await quoteDelivery({
        pincode: address.pincode,
        subtotal,
        discountAmount
      });
      if (!quote.deliverable) {
        return res.status(400).json({
          success: false,
          message:
            quote.reason ||
            "Delivery is currently unavailable to this location."
        });
      }
      try {
        assertMinimumOrder(quote, subtotal);
      } catch (minimumError) {
        return res.status(minimumError.status || 400).json({
          success: false,
          message: minimumError.message
        });
      }
      deliveryCharge = quote.deliveryCharge;
    }

    // Optional loyalty redemption, validated against the live balance.
    // Deducted atomically BEFORE the order is stored; refunded with an
    // auditable reversal if order creation fails below.
    let rewardDiscount = 0;
    const requestedRewardPoints = Math.floor(Number(req.body.rewardPoints) || 0);
    if (requestedRewardPoints > 0) {
      let redemption;
      try {
        redemption = await quoteRedemption({
          userId: req.user.userId,
          requestedPoints: requestedRewardPoints
        });
      } catch (redemptionError) {
        return res.status(redemptionError.status || 400).json({
          success: false,
          message: redemptionError.message || "Invalid reward redemption"
        });
      }
      // Cap so the discount never exceeds the payable amount (total
      // floor is ₹0). Shrink points to match the capped discount.
      const payableBeforeRewards = Math.max(
        0,
        subtotal - discountAmount + deliveryCharge
      );
      const settings = redemption.settings;
      let points = redemption.points;
      const unit = Number(settings.rupeesPerPoint) || 0;
      if (unit > 0) {
        points = Math.min(points, Math.floor(payableBeforeRewards / unit));
      }
      if (points <= 0) {
        return res.status(400).json({
          success: false,
          message: "Reward discount exceeds the order total"
        });
      }
      const deducted = await deductPoints(req.user.userId, points);
      if (!deducted) {
        return res.status(400).json({
          success: false,
          message: "You don't have enough reward points."
        });
      }
      rewardsDeducted = true;
      rewardPointsUsed = points;
      rewardDiscount = Math.min(
        discountForPoints(settings, points),
        payableBeforeRewards
      );
    }

    // Generate a unique readable order id
    let orderId = generateOrderId();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const existing = await Order.findOne({ orderId });
      if (!existing) break;
      orderId = generateOrderId();
    }

    const order = await Order.create({
      orderId,
      user: req.user.userId,
      customerName: String(customerName).trim(),
      mobile: String(mobile).trim(),
      orderType,
      table: isDineIn ? dineInTable._id : null,
      tableNumber: isDineIn ? dineInTable.tableNumber : "",
      dineInSessionId: isDineIn ? dineInSession.sessionId : "",
      guestCount: isDineIn ? guests : null,
      address: isDineIn
        ? undefined
        : {
            flat: String(address.flat).trim(),
            street: String(address.street).trim(),
            landmark: address.landmark ? String(address.landmark).trim() : "",
            city: String(address.city).trim(),
            state: String(address.state).trim(),
            pincode: String(address.pincode).trim(),
            instructions: address.instructions
              ? String(address.instructions).trim()
              : ""
          },
      items: orderItems,
      subtotal,
      couponCode,
      discountAmount,
      rewardPointsUsed,
      rewardDiscount,
      deliveryCharge,
      totalAmount: Math.max(
        0,
        subtotal - discountAmount - rewardDiscount + deliveryCharge
      ),
      paymentMethod: method,
      orderStatus: "Pending"
    });

    // Record coupon usage AFTER the order is stored. The order id ties
    // one redemption to exactly one order.
    if (couponCode && couponId) {
      const Coupon = require("../models/Coupon");
      await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
      await CouponUsage.create({
        coupon: couponId,
        user: req.user.userId,
        order: order._id
      });
    }

    // Auditable redemption record, linked to the stored order.
    if (rewardsDeducted && rewardPointsUsed > 0) {
      await RewardTransaction.create({
        user: req.user.userId,
        order: order._id,
        type: "redeem",
        points: -rewardPointsUsed,
        description: `Redeemed on order #${order.orderId}`
      });
    }

    // A valid dine-in order occupies its table (session stays active for
    // follow-up orders until explicitly closed).
    if (isDineIn && dineInTable) {
      const Table = require("../models/Table");
      await Table.findByIdAndUpdate(dineInTable._id, { status: "occupied" });
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order
    });
  } catch (error) {
    // Points were deducted but the order never stored: refund with an
    // auditable reversal so the customer never loses points silently.
    if (rewardsDeducted && rewardPointsUsed > 0) {
      try {
        await refundPoints(req.user.userId, rewardPointsUsed);
        await RewardTransaction.create({
          user: req.user.userId,
          order: null,
          type: "reversal",
          points: rewardPointsUsed,
          description: "Refund for failed order placement"
        });
      } catch (refundError) {
        console.error(
          "Reward refund error:",
          refundError.message
        );
      }
    }
    console.error("Create order error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while creating order"
    });
  }
};

// =============================
// GET ORDERS (own orders; all for Admin)
// =============================
const getOrders = async (req, res) => {
  try {
    const filter = req.user.role === "Admin" ? {} : { user: req.user.userId };
    const orders = await Order.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error("Get orders error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching orders"
    });
  }
};

// =============================
// GET SINGLE ORDER (owner or Admin)
// =============================
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (
      !order ||
      (req.user.role !== "Admin" &&
        order.user.toString() !== req.user.userId)
    ) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Get order error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching order"
    });
  }
};

// =============================
// UPDATE ORDER STATUS (Admin)
// =============================
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    if (!ORDER_STATUSES.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status"
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Notify only on an actual change: saving the same status again
    // must not create a duplicate notification.
    const statusChanged = order.orderStatus !== orderStatus;
    order.orderStatus = orderStatus;
    await order.save();

    if (statusChanged) {
      try {
        const Notification = require("../models/Notification");
        const {
          buildOrderStatusNotification
        } = require("../utils/orderNotifications");
        await Notification.create(
          buildOrderStatusNotification(order, orderStatus)
        );
      } catch (notifyError) {
        // Status update wins: never fail the admin request because the
        // notification insert failed.
        console.error(
          "Create status notification error:",
          notifyError.message
        );
      }

      // Loyalty earn: only on the transition INTO a completed state
      // (Delivered, or Served for dine-in), exactly once per order
      // (atomic claim on rewardsCredited).
      if (orderStatus === "Delivered" || orderStatus === "Served") {
        try {
          const claimed = await Order.findOneAndUpdate(
            { _id: order._id, rewardsCredited: { $ne: true } },
            { $set: { rewardsCredited: true } },
            { new: true }
          );
          if (claimed) {
            const settings = await getRewardSettings();
            const {
              pointsForSpend,
              creditPoints
            } = require("../utils/rewardService");
            const eligible = Math.max(
              0,
              Number(order.subtotal) -
                Number(order.discountAmount) -
                Number(order.rewardDiscount)
            );
            const earned = pointsForSpend(settings, eligible);
            if (earned > 0) {
              await creditPoints(order.user, earned);
              await RewardTransaction.create({
                user: order.user,
                order: order._id,
                type: "earn",
                points: earned,
                description: `Order #${order.orderId} completed`
              });
              await Order.findByIdAndUpdate(order._id, {
                rewardPointsEarned: earned
              });
            }
          }
        } catch (rewardError) {
          console.error("Credit rewards error:", rewardError.message);
        }
      }

      // Cancellation: restore redeemed points once, with an auditable
      // reversal transaction (history is never deleted).
      if (
        orderStatus === "Cancelled" &&
        Number(order.rewardPointsUsed) > 0 &&
        !order.rewardRedeemReversed
      ) {
        try {
          const claimed = await Order.findOneAndUpdate(
            { _id: order._id, rewardRedeemReversed: { $ne: true } },
            { $set: { rewardRedeemReversed: true } }
          );
          if (claimed) {
            await refundPoints(
              order.user,
              Number(order.rewardPointsUsed)
            );
            await RewardTransaction.create({
              user: order.user,
              order: order._id,
              type: "reversal",
              points: Number(order.rewardPointsUsed),
              description: `Refund for cancelled order #${order.orderId}`
            });
          }
        } catch (refundError) {
          console.error("Reward refund error:", refundError.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order
    });
  } catch (error) {
    console.error("Update order status error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while updating order"
    });
  }
};

// =============================
// REORDER (owner or Admin)
// Returns the order's items with CURRENT menu prices so the
// frontend can re-add them to the cart. Unavailable / deleted
// products are skipped, never breaking the whole reorder.
// =============================
const reorderOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (
      !order ||
      (req.user.role !== "Admin" &&
        order.user.toString() !== req.user.userId)
    ) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const availableItems = [];
    let skippedCount = 0;

    for (const entry of order.items) {
      const menuItem = await MenuItem.findById(entry.menuItem);

      // Deleted from menu, sold out or hidden -> skip it.
      if (!menuItem || !isOrderable(menuItem)) {
        skippedCount += 1;
        continue;
      }

      availableItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        // CURRENT price (may differ from the historic order price)
        price: menuItem.price,
        image: menuItem.image || "",
        category: menuItem.category || "",
        // Preserve the original quantity
        quantity: entry.quantity
      });
    }

    res.status(200).json({
      success: true,
      items: availableItems,
      skippedCount,
      totalCount: order.items.length
    });
  } catch (error) {
    console.error("Reorder error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while preparing reorder"
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  reorderOrder,
  FREE_DELIVERY_ABOVE,
  DELIVERY_CHARGE
};
