import { useEffect, useState } from "react";
import api from "../../api/axios";
import { formatPrice } from "../../utils/formatPrice";

const CATEGORIES = ["Starter", "Main Course", "Dessert", "Beverage"];

const emptyForm = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minimumOrderAmount: "0",
  maximumDiscount: "",
  usageLimit: "",
  perUserLimit: "1",
  startDate: "",
  expiryDate: "",
  isActive: true,
  applicableCategories: [],
  applicableProducts: [],
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Human-readable error. A 404 almost always means the backend with
// /api/coupons is not deployed yet (frontend newer than backend).
function couponErrorMessage(err, fallback) {
  const status = err.response?.status;
  const message = err.response?.data?.message;
  if (message) return message;
  if (status === 404)
    return `${fallback} (backend route missing — deploy the latest backend).`;
  if (status) return `${fallback} (status ${status}).`;
  if (err.request) return `${fallback} (no response from server).`;
  return fallback;
}

function describeCoupon(coupon) {
  if (coupon.discountType === "PERCENTAGE") {
    return `${coupon.discountValue}% off${
      coupon.maximumDiscount ? ` (max ${formatPrice(coupon.maximumDiscount)})` : ""
    }`;
  }
  return `${formatPrice(coupon.discountValue)} off`;
}

function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/coupons");
      setCoupons(res.data.coupons || []);
    } catch {
      setError("Unable to load coupons.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await api.get("/menu-items");
      setMenuItems(res.data.menuItems || []);
    } catch {
      // Product scoping is optional; the form still works without it.
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchMenuItems();
  }, []);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const toggleCategory = (category) => {
    setForm((prev) => ({
      ...prev,
      applicableCategories: prev.applicableCategories.includes(category)
        ? prev.applicableCategories.filter((c) => c !== category)
        : [...prev.applicableCategories, category],
    }));
  };

  const toggleProduct = (id) => {
    setForm((prev) => ({
      ...prev,
      applicableProducts: prev.applicableProducts.includes(id)
        ? prev.applicableProducts.filter((p) => p !== id)
        : [...prev.applicableProducts, id],
    }));
  };

  const startCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const startEdit = (coupon) => {
    setForm({
      code: coupon.code || "",
      discountType: coupon.discountType || "PERCENTAGE",
      discountValue: String(coupon.discountValue ?? ""),
      minimumOrderAmount: String(coupon.minimumOrderAmount ?? "0"),
      maximumDiscount:
        coupon.maximumDiscount === null || coupon.maximumDiscount === undefined
          ? ""
          : String(coupon.maximumDiscount),
      usageLimit:
        coupon.usageLimit === null || coupon.usageLimit === undefined
          ? ""
          : String(coupon.usageLimit),
      perUserLimit: String(coupon.perUserLimit ?? "1"),
      startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : "",
      expiryDate: coupon.expiryDate ? coupon.expiryDate.slice(0, 10) : "",
      isActive: coupon.isActive !== false,
      applicableCategories: coupon.applicableCategories || [],
      applicableProducts: (coupon.applicableProducts || []).map((p) =>
        typeof p === "object" ? p._id : p
      ),
    });
    setEditingId(coupon._id);
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        maximumDiscount: form.maximumDiscount === "" ? null : Number(form.maximumDiscount),
        usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
      };
      if (editingId) {
        await api.put(`/coupons/${editingId}`, payload);
        setMessage("Coupon updated successfully.");
      } else {
        await api.post("/coupons", payload);
        setMessage("Coupon created successfully.");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchCoupons();
    } catch (err) {
      setError(couponErrorMessage(err, "Failed to save coupon."));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      await api.put(`/coupons/${coupon._id}`, {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minimumOrderAmount: coupon.minimumOrderAmount ?? 0,
        maximumDiscount: coupon.maximumDiscount ?? null,
        usageLimit: coupon.usageLimit ?? null,
        perUserLimit: coupon.perUserLimit ?? 1,
        startDate: coupon.startDate || "",
        expiryDate: coupon.expiryDate || "",
        isActive: !coupon.isActive,
        applicableCategories: coupon.applicableCategories || [],
        applicableProducts: (coupon.applicableProducts || []).map((p) =>
          typeof p === "object" ? p._id : p
        ),
      });
      setMessage(`Coupon ${coupon.isActive ? "deactivated" : "activated"}.`);
      fetchCoupons();
    } catch (err) {
      setError(couponErrorMessage(err, "Failed to update coupon."));
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    try {
      const res = await api.delete(`/coupons/${coupon._id}`);
      setMessage(res.data.message || "Coupon deleted successfully.");
      fetchCoupons();
    } catch (err) {
      setError(couponErrorMessage(err, "Failed to delete coupon."));
    }
  };

  if (loading) return <p>Loading coupons...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <button
          onClick={startCreate}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          Add Coupon
        </button>
      </div>

      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>
      )}
      {message && (
        <p className="bg-green-100 text-green-700 text-sm p-2 rounded mb-4">{message}</p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow rounded-lg p-6 mb-6 space-y-4"
        >
          <h2 className="text-lg font-bold">
            {editingId ? "Edit Coupon" : "New Coupon"}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Coupon Code *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setField("code", e.target.value.toUpperCase())}
                required
                maxLength={30}
                placeholder="SAVE50"
                className="mt-1 w-full border rounded px-3 py-2 uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Discount Type *</label>
              <select
                value={form.discountType}
                onChange={(e) => setField("discountType", e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">
                Discount Value *{" "}
                <span className="font-normal text-gray-500">
                  {form.discountType === "PERCENTAGE" ? "(1-90 %)" : "(₹)"}
                </span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discountValue}
                onChange={(e) => setField("discountValue", e.target.value)}
                required
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Minimum Order (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.minimumOrderAmount}
                onChange={(e) => setField("minimumOrderAmount", e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Maximum Discount (₹, optional cap)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.maximumDiscount}
                onChange={(e) => setField("maximumDiscount", e.target.value)}
                placeholder="e.g. 100"
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Usage Limit (total, blank = unlimited)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.usageLimit}
                onChange={(e) => setField("usageLimit", e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Per User Limit</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.perUserLimit}
                onChange={(e) => setField("perUserLimit", e.target.value)}
                required
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Start Date (optional)</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Expiry Date (optional)</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setField("expiryDate", e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Applicable Categories{" "}
              <span className="font-normal text-gray-500">(empty = all)</span>
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className={`text-sm border rounded-full px-3 py-1.5 cursor-pointer ${
                    form.applicableCategories.includes(cat)
                      ? "bg-orange-600 text-white border-orange-600"
                      : "border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.applicableCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="hidden"
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Applicable Products{" "}
              <span className="font-normal text-gray-500">(empty = all)</span>
            </label>
            <div className="mt-2 max-h-44 overflow-y-auto border rounded px-3 py-2 space-y-1.5">
              {menuItems.length === 0 && (
                <p className="text-sm text-gray-500">No menu items found.</p>
              )}
              {menuItems.map((item) => (
                <label key={item._id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.applicableProducts.includes(item._id)}
                    onChange={() => toggleProduct(item._id)}
                    className="w-4 h-4"
                  />
                  {item.name}
                  <span className="text-gray-500">· {formatPrice(item.price)}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField("isActive", e.target.checked)}
              className="w-4 h-4"
            />
            Active
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update Coupon" : "Create Coupon"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {coupons.length === 0 && !error && (
        <p className="text-gray-600">No coupons found.</p>
      )}

      {coupons.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Code</th>
                <th className="text-left p-3">Discount</th>
                <th className="text-left p-3">Min Order</th>
                <th className="text-left p-3">Usage</th>
                <th className="text-left p-3">Validity</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon._id} className="border-t align-top">
                  <td className="p-3 font-bold">{coupon.code}</td>
                  <td className="p-3">{describeCoupon(coupon)}</td>
                  <td className="p-3">
                    {Number(coupon.minimumOrderAmount) > 0
                      ? formatPrice(coupon.minimumOrderAmount)
                      : "—"}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {coupon.usedCount}
                    {coupon.usageLimit != null ? ` / ${coupon.usageLimit}` : " used"}
                    <span className="block text-xs text-gray-500">
                      {coupon.perUserLimit}x per user
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {formatDate(coupon.startDate)} → {formatDate(coupon.expiryDate)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        coupon.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap space-x-2">
                    <button
                      onClick={() => startEdit(coupon)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      className="bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700"
                    >
                      {coupon.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(coupon)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Coupons;
