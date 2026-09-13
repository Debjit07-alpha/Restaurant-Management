import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/CartContext";

// Reorder a past order:
// - calls POST /api/orders/:id/reorder (backend verifies ownership
//   and returns CURRENT prices, skipping unavailable items)
// - adds available products to the cart, preserving quantities
// - navigates to the existing cart page
export function useReorder() {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [reorderingId, setReorderingId] = useState(null);
  const [notice, setNotice] = useState(null); // { type: "success"|"error"|"warning", text }

  const reorder = async (orderId) => {
    setReorderingId(orderId);
    setNotice(null);
    try {
      const res = await api.post(`/orders/${orderId}/reorder`);
      const items = res.data?.items || [];
      const skippedCount = res.data?.skippedCount || 0;
      const totalCount = res.data?.totalCount || items.length + skippedCount;

      if (items.length === 0) {
        setNotice({
          type: "warning",
          text:
            totalCount > 0
              ? "None of the items from this order are currently available."
              : "Unable to reorder this order. Please try again.",
        });
        return { added: 0, skipped: skippedCount };
      }

      let added = 0;
      for (const item of items) {
        const ok = addItem(
          {
            _id: item.menuItem,
            name: item.name,
            category: item.category || "",
            price: Number(item.price) || 0,
            image: item.image || "",
            availability: true,
          },
          Number(item.quantity) || 1
        );
        if (ok) added += 1;
      }

      if (added === 0) {
        setNotice({
          type: "warning",
          text: "None of the items from this order are currently available.",
        });
        return { added: 0, skipped: skippedCount };
      }

      if (skippedCount > 0) {
        setNotice({
          type: "warning",
          text: "Some items are no longer available and were not added.",
        });
      } else {
        setNotice({ type: "success", text: "Items added to your cart." });
      }

      // Let cart state flush, then go to the existing cart page.
      setTimeout(() => navigate("/cart"), 450);
      return { added, skipped: skippedCount };
    } catch {
      setNotice({
        type: "error",
        text: "Unable to reorder this order. Please try again.",
      });
      return { added: 0, skipped: 0, failed: true };
    } finally {
      setReorderingId(null);
    }
  };

  const clearNotice = () => setNotice(null);

  return { reorder, reorderingId, notice, setNotice, clearNotice };
}
