// Copy + creation rules for order-status notifications.
// Pure builder (no DB) so the wording is easy to unit-test.

const STATUS_COPY = {
  Pending: {
    title: "Order Placed",
    message: (orderId) => `Your order #${orderId} has been placed.`
  },
  Confirmed: {
    title: "Order Confirmed",
    message: (orderId) => `Your order #${orderId} has been confirmed.`
  },
  Preparing: {
    title: "Order Being Prepared",
    message: (orderId) => `Your order #${orderId} is now being prepared.`
  },
  "Out for Delivery": {
    title: "Out for Delivery",
    message: (orderId) => `Your order #${orderId} is on the way.`
  },
  Ready: {
    title: "Food Ready",
    message: (orderId) => `Your food is ready.`
  },
  Served: {
    title: "Enjoy Your Meal",
    message: (orderId) => `Enjoy your meal!`
  },
  Delivered: {
    title: "Order Delivered",
    message: (orderId) => `Your order #${orderId} has been delivered.`
  },
  Cancelled: {
    title: "Order Cancelled",
    message: (orderId) => `Your order #${orderId} has been cancelled.`
  }
};

const DINE_IN_COPY = {
  Confirmed: {
    title: "Order Confirmed",
    message: (orderId, table) => `Your dine-in order for Table ${table} has been confirmed.`
  },
  Preparing: {
    title: "Order Being Prepared",
    message: (orderId, table) => `Your food is being prepared.`
  },
  Ready: {
    title: "Food Ready",
    message: (orderId, table) => `Your food is ready.`
  },
  Served: {
    title: "Enjoy Your Meal",
    message: (orderId, table) => `Enjoy your meal!`
  },
  Cancelled: {
    title: "Order Cancelled",
    message: (orderId, table) => `Your dine-in order for Table ${table} has been cancelled.`
  }
};

// Build the notification fields for a status change. Unknown statuses
// get a safe generic message so no update is ever silent. Dine-in
// orders use table-aware copy instead of delivery phrasing.
const buildOrderStatusNotification = (order, status) => {
  const dineIn = order.orderType === "dine_in" && order.tableNumber
    ? DINE_IN_COPY[status]
    : null;
  if (dineIn) {
    return {
      user: order.user,
      type: "order_status",
      title: dineIn.title,
      message: dineIn.message(order.orderId, order.tableNumber),
      order: order._id
    };
  }
  const copy = STATUS_COPY[status];
  return {
    user: order.user,
    type: "order_status",
    title: copy ? copy.title : `Order ${status}`,
    message: copy
      ? copy.message(order.orderId)
      : `Your order #${order.orderId} status updated to ${status}.`,
    order: order._id
  };
};

module.exports = {
  STATUS_COPY,
  buildOrderStatusNotification
};
