const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");

// Delivery rule: free above Rs.499, otherwise Rs.40.
// The backend always recalculates this; frontend values are never trusted.
const FREE_DELIVERY_ABOVE = 499;
const DELIVERY_CHARGE = 40;

const PAYMENT_METHODS = ["Cash on Delivery", "UPI on Delivery"];
const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Preparing",
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
  try {
    const { customerName, mobile, address, paymentMethod, items } = req.body;

    // Validate contact + address
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

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item"
      });
    }

    const method = paymentMethod || "Cash on Delivery";
    if (!PAYMENT_METHODS.includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method"
      });
    }

    // Build order items from current MongoDB prices (never trust frontend).
    // Reject the whole order if any item is missing or out of stock.
    const orderItems = [];
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

      if (!menuItem.availability) {
        return res.status(400).json({
          success: false,
          message: `${menuItem.name} is currently out of stock and cannot be ordered`
        });
      }

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        subtotal: menuItem.price * quantity,
        image: menuItem.image || ""
      });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const deliveryCharge = subtotal > FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE;

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
      address: {
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
      deliveryCharge,
      totalAmount: subtotal + deliveryCharge,
      paymentMethod: method,
      orderStatus: "Pending"
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order
    });
  } catch (error) {
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

    order.orderStatus = orderStatus;
    await order.save();

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

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  FREE_DELIVERY_ABOVE,
  DELIVERY_CHARGE
};
