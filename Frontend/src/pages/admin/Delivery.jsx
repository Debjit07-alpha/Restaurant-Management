import { useEffect, useState } from "react";
import api from "../../api/axios";
import { formatPrice } from "../../utils/formatPrice";

const emptyZone = {
  name: "",
  pincodes: "",
  deliveryFee: "",
  minimumOrderAmount: "",
  estimatedDeliveryTime: "",
  isActive: true,
};

function Delivery() {
  const [settings, setSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({
    minimumOrderAmount: "0",
    baseDeliveryFee: "40",
    freeDeliveryThreshold: "499",
    estimatedDeliveryTime: "30–45 minutes",
  });
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [zoneForm, setZoneForm] = useState(emptyZone);
  const [editingId, setEditingId] = useState(null);
  const [savingZone, setSavingZone] = useState(false);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");
      const [settingsRes, zonesRes] = await Promise.all([
        api.get("/delivery/settings"),
        api.get("/delivery/zones"),
      ]);
      const loaded = settingsRes.data.settings;
      setSettings(loaded);
      setSettingsForm({
        minimumOrderAmount: String(loaded.minimumOrderAmount ?? "0"),
        baseDeliveryFee: String(loaded.baseDeliveryFee ?? "40"),
        freeDeliveryThreshold: String(loaded.freeDeliveryThreshold ?? "499"),
        estimatedDeliveryTime: loaded.estimatedDeliveryTime || "30–45 minutes",
      });
      setZones(zonesRes.data.zones || []);
    } catch {
      setError("Unable to load delivery settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSavingSettings(true);
    try {
      const res = await api.put("/delivery/settings", settingsForm);
      setSettings(res.data.settings);
      setMessage("Delivery settings updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save delivery settings."
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const startCreate = () => {
    setZoneForm(emptyZone);
    setEditingId(null);
    setShowZoneForm(true);
    setError("");
    setMessage("");
  };

  const startEdit = (zone) => {
    setZoneForm({
      name: zone.name || "",
      pincodes: (zone.pincodes || []).join(", "),
      deliveryFee: String(zone.deliveryFee ?? ""),
      minimumOrderAmount:
        zone.minimumOrderAmount === null || zone.minimumOrderAmount === undefined
          ? ""
          : String(zone.minimumOrderAmount),
      estimatedDeliveryTime: zone.estimatedDeliveryTime || "",
      isActive: zone.isActive !== false,
    });
    setEditingId(zone._id);
    setShowZoneForm(true);
    setError("");
    setMessage("");
  };

  const handleZoneSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSavingZone(true);
    try {
      if (editingId) {
        await api.put(`/delivery/zones/${editingId}`, zoneForm);
        setMessage("Delivery zone updated successfully.");
      } else {
        await api.post("/delivery/zones", zoneForm);
        setMessage("Delivery zone created successfully.");
      }
      setShowZoneForm(false);
      setEditingId(null);
      setZoneForm(emptyZone);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save delivery zone.");
    } finally {
      setSavingZone(false);
    }
  };

  const handleToggle = async (zone) => {
    setTogglingId(zone._id);
    setError("");
    setMessage("");
    try {
      await api.put(`/delivery/zones/${zone._id}`, {
        name: zone.name,
        pincodes: zone.pincodes,
        deliveryFee: zone.deliveryFee,
        minimumOrderAmount: zone.minimumOrderAmount ?? "",
        estimatedDeliveryTime: zone.estimatedDeliveryTime || "",
        isActive: !zone.isActive,
      });
      setMessage(`Zone ${zone.isActive ? "disabled" : "enabled"}.`);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update zone.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (zone) => {
    if (!window.confirm(`Delete zone "${zone.name}"?`)) return;
    try {
      await api.delete(`/delivery/zones/${zone._id}`);
      setMessage("Delivery zone deleted successfully.");
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete zone.");
    }
  };

  if (loading) return <p>Loading delivery settings...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Delivery Management</h1>

      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>
      )}
      {message && (
        <p className="bg-green-100 text-green-700 text-sm p-2 rounded mb-4">{message}</p>
      )}

      {/* Global settings */}
      <form
        onSubmit={handleSettingsSubmit}
        className="bg-white shadow rounded-lg p-6 mb-6 space-y-4"
      >
        <h2 className="text-lg font-bold">Global Settings</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">
              Minimum Order (₹, 0 = no minimum)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={settingsForm.minimumOrderAmount}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, minimumOrderAmount: e.target.value })
              }
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Base Delivery Fee (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={settingsForm.baseDeliveryFee}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, baseDeliveryFee: e.target.value })
              }
              required
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Free Delivery Threshold (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={settingsForm.freeDeliveryThreshold}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, freeDeliveryThreshold: e.target.value })
              }
              required
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Estimated Delivery Time
            </label>
            <input
              type="text"
              value={settingsForm.estimatedDeliveryTime}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, estimatedDeliveryTime: e.target.value })
              }
              maxLength={60}
              placeholder="30–45 minutes"
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={savingSettings}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
        >
          {savingSettings ? "Saving..." : "Save Settings"}
        </button>
      </form>

      {/* Zones */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold">Delivery Zones</h2>
        <button
          onClick={startCreate}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          + Add Delivery Zone
        </button>
      </div>

      {showZoneForm && (
        <form
          onSubmit={handleZoneSubmit}
          className="bg-white shadow rounded-lg p-6 mb-6 space-y-4"
        >
          <h3 className="font-bold">{editingId ? "Edit Zone" : "New Zone"}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Name *</label>
              <input
                type="text"
                value={zoneForm.name}
                onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                required
                maxLength={80}
                placeholder="Kolkata"
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Delivery Fee (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={zoneForm.deliveryFee}
                onChange={(e) => setZoneForm({ ...zoneForm, deliveryFee: e.target.value })}
                required
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">
                Pincodes *{" "}
                <span className="font-normal text-gray-500">
                  (comma separated, 6 digits each)
                </span>
              </label>
              <input
                type="text"
                value={zoneForm.pincodes}
                onChange={(e) => setZoneForm({ ...zoneForm, pincodes: e.target.value })}
                required
                placeholder="700010, 700011, 700012"
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Minimum Order (₹, blank = global)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={zoneForm.minimumOrderAmount}
                onChange={(e) =>
                  setZoneForm({ ...zoneForm, minimumOrderAmount: e.target.value })
                }
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Estimated Time (blank = global)
              </label>
              <input
                type="text"
                value={zoneForm.estimatedDeliveryTime}
                onChange={(e) =>
                  setZoneForm({ ...zoneForm, estimatedDeliveryTime: e.target.value })
                }
                maxLength={60}
                placeholder="30–45 min"
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={zoneForm.isActive}
              onChange={(e) => setZoneForm({ ...zoneForm, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            Active
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={savingZone}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {savingZone ? "Saving..." : editingId ? "Update Zone" : "Create Zone"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowZoneForm(false);
                setEditingId(null);
                setZoneForm(emptyZone);
              }}
              className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {zones.length === 0 && !error && (
        <p className="text-gray-600">
          No delivery zones yet. Until zones exist, the base fee applies everywhere.
        </p>
      )}

      {zones.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Pincodes</th>
                <th className="text-left p-3">Fee</th>
                <th className="text-left p-3">Min Order</th>
                <th className="text-left p-3">Est. Time</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone._id} className="border-t align-top">
                  <td className="p-3 font-medium">{zone.name}</td>
                  <td className="p-3 max-w-[220px] break-words">
                    {(zone.pincodes || []).join(", ")}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {formatPrice(zone.deliveryFee)}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {zone.minimumOrderAmount != null
                      ? formatPrice(zone.minimumOrderAmount)
                      : "Global"}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {zone.estimatedDeliveryTime || "Global"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        zone.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      {zone.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap space-x-2">
                    <button
                      onClick={() => startEdit(zone)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggle(zone)}
                      disabled={togglingId === zone._id}
                      className="bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700 disabled:opacity-50"
                    >
                      {zone.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => handleDelete(zone)}
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

export default Delivery;
