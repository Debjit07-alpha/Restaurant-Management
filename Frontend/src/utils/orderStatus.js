// Shared order-status helpers. Delivery runs Pending -> Confirmed ->
// Preparing -> Delivered; dine-in runs Pending -> Confirmed ->
// Preparing -> Ready -> Served. One system, two step tracks.

export const ORDER_STEPS = ["Pending", "Confirmed", "Preparing", "Delivered"];

export const DINE_IN_STEPS = ["Pending", "Confirmed", "Preparing", "Ready", "Served"];

export const ORDER_STEP_LABELS = {
  Pending: "Order Placed",
  Confirmed: "Confirmed",
  Preparing: "Preparing",
  Ready: "Ready",
  Served: "Served",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
};

export function stepsFor(orderType) {
  return orderType === "dine_in" ? DINE_IN_STEPS : ORDER_STEPS;
}

export function getStepIndex(status, orderType) {
  if (status === "Cancelled") return -1;
  const idx = stepsFor(orderType).indexOf(status);
  return idx === -1 ? 0 : idx;
}

export function isCancelled(status) {
  return status === "Cancelled";
}

export function statusBadgeClass(status) {
  switch (status) {
    case "Pending":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Confirmed":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "Preparing":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Ready":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Served":
      return "bg-teal-100 text-teal-800 border-teal-200";
    case "Delivered":
      return "bg-pine/10 text-pine border-pine/20";
    case "Cancelled":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-charcoal/5 text-charcoal/70 border-charcoal/10";
  }
}
