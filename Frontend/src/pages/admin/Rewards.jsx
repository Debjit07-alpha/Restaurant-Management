import { useEffect, useState } from "react";
import api from "../../api/axios";

function RewardsAdmin() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({
    pointsPer100: "10",
    rupeesPerPoint: "0.1",
    minimumRedemptionPoints: "100",
    maximumRedemptionPoints: "2000",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [adjust, setAdjust] = useState({ userId: "", points: "", reason: "" });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/rewards/settings");
      const loaded = res.data.settings;
      setSettings(loaded);
      setForm({
        pointsPer100: String(loaded.pointsPer100 ?? "10"),
        rupeesPerPoint: String(loaded.rupeesPerPoint ?? "0.1"),
        minimumRedemptionPoints: String(loaded.minimumRedemptionPoints ?? "100"),
        maximumRedemptionPoints: String(loaded.maximumRedemptionPoints ?? "2000"),
      });
    } catch {
      setError("Unable to load reward settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const res = await api.put("/rewards/settings", form);
      setSettings(res.data.settings);
      setMessage("Reward settings updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save reward settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setAdjusting(true);
    try {
      const res = await api.post("/rewards/adjust", adjust);
      setMessage(
        `Reward balance adjusted successfully. New balance: ${res.data.balance} points.`
      );
      setAdjust({ userId: "", points: "", reason: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to adjust points.");
    } finally {
      setAdjusting(false);
    }
  };

  if (loading) return <p>Loading reward settings...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Rewards</h1>
      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>
      )}
      {message && (
        <p className="bg-green-100 text-green-700 text-sm p-2 rounded mb-4">{message}</p>
      )}

      <form
        onSubmit={handleSave}
        className="bg-white shadow rounded-lg p-6 mb-6 space-y-4"
      >
        <h2 className="text-lg font-bold">Earning &amp; Redemption Rules</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">
              Points earned per ₹100
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.pointsPer100}
              onChange={(e) => setForm({ ...form, pointsPer100: e.target.value })}
              required
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Point value (₹ per point)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.rupeesPerPoint}
              onChange={(e) => setForm({ ...form, rupeesPerPoint: e.target.value })}
              required
              className="mt-1 w-full border rounded px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              0.10 means 10 points = ₹1.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium">
              Minimum redeem (points)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.minimumRedemptionPoints}
              onChange={(e) =>
                setForm({ ...form, minimumRedemptionPoints: e.target.value })
              }
              required
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Maximum redeem per order (points)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.maximumRedemptionPoints}
              onChange={(e) =>
                setForm({ ...form, maximumRedemptionPoints: e.target.value })
              }
              required
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Rules"}
        </button>
      </form>

      <form
        onSubmit={handleAdjust}
        className="bg-white shadow rounded-lg p-6 space-y-4"
      >
        <h2 className="text-lg font-bold">Adjust Points</h2>
        <p className="text-sm text-gray-500">
          Positive adds, negative deducts. A reason is required; every
          adjustment is recorded in the reward history.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Customer User ID *</label>
            <input
              type="text"
              value={adjust.userId}
              onChange={(e) => setAdjust({ ...adjust, userId: e.target.value })}
              required
              placeholder="Paste the customer _id from the Users table"
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Points *</label>
            <input
              type="number"
              step="1"
              value={adjust.points}
              onChange={(e) => setAdjust({ ...adjust, points: e.target.value })}
              required
              placeholder="+100 or -50"
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Reason *</label>
            <input
              type="text"
              value={adjust.reason}
              onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })}
              required
              maxLength={200}
              placeholder="Customer service compensation"
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={adjusting}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
        >
          {adjusting ? "Adjusting..." : "Adjust Points"}
        </button>
      </form>
    </div>
  );
}

export default RewardsAdmin;
