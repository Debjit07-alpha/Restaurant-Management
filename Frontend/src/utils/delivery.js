// Mirrors the backend delivery rule for display purposes only.
// The backend always recalculates charges from MongoDB prices.
export const FREE_DELIVERY_ABOVE = 499;
export const DELIVERY_CHARGE = 40;

export function getDeliveryCharge(subtotal) {
  if (!subtotal || subtotal <= 0) return 0;
  return subtotal > FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE;
}
