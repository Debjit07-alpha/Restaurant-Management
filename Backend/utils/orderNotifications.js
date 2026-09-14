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
  Delivered: {
    title: "Order Delivered",
    message: (orderId) => `Your order #${orderId} has been delivered.`
  },
  Cancelled: {
    title: "Order Cancelled",
    message: (orderId) => `Your order #${orderId} has been cancelled.`
  }
};

// Build the notification fields for a status change. Unknown statuses
// get a safe generic message so no update is ever silent.
const buildOrderStatusNotification = (order, status) => {
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
