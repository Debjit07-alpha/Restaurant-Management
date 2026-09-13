// Shared order-status helpers. Reuses the backend's existing
// status names (Pending, Confirmed, Preparing, Delivered, Cancelled)
// so no duplicate state system is introduced.

export const ORDER_STEPS = ["Pending", "Confirmed", "Preparing", "Delivered"];

export const ORDER_STEP_LABELS = {
  Pending: "Order Placed",
  Confirmed: "Confirmed",
  Preparing: "Preparing",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
};

export function getStepIndex(status) {
  if (status === "Cancelled") return -1;
  const idx = ORDER_STEPS.indexOf(status);
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
    case "Delivered":
      return "bg-pine/10 text-pine border-pine/20";
    case "Cancelled":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-charcoal/5 text-charcoal/70 border-charcoal/10";
  }
}
