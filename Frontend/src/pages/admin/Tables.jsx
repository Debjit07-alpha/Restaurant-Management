import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import QRCode from "react-qr-code";

const emptyForm = { tableNumber: "", capacity: "4", section: "Main Hall", status: "available", isActive: true };

const statusDot = (status) =>
  status === "available" ? "🟢" : status === "reserved" ? "🟡" : status === "occupied" ? "🔴" : "⚪";

function Tables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [qrTable, setQrTable] = useState(null);
  const qrBoxRef = useRef(null);

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/tables");
      setTables(res.data.tables || []);
    } catch {
      setError("Unable to load tables.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const startCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const startEdit = (table) => {
    setForm({
      tableNumber: table.tableNumber || "",
      capacity: String(table.capacity ?? "4"),
      section: table.section || "Main Hall",
      status: table.status || "available",
      isActive: table.isActive !== false,
    });
    setEditingId(table._id);
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
      if (editingId) {
        await api.put(`/tables/${editingId}`, form);
        setMessage("Table updated successfully.");
      } else {
        await api.post("/tables", form);
        setMessage("Table created successfully.");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchTables();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save table.");
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (id, action, confirmText, successText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setActingId(`${id}-${action}`);
    setError("");
    setMessage("");
    try {
      const res = await api.post(`/tables/${id}/${action}`);
      setMessage(successText || res.data.message || "Done.");
      if (qrTable && qrTable._id === id && res.data.table) {
        setQrTable(res.data.table);
      }
      fetchTables();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (table) => {
    if (!window.confirm(`Delete table ${table.tableNumber}?`)) return;
    setActingId(`${table._id}-delete`);
    setError("");
    setMessage("");
    try {
      await api.delete(`/tables/${table._id}`);
      setMessage("Table deleted successfully.");
      fetchTables();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete table.");
    } finally {
      setActingId(null);
    }
  };

  const qrUrl = (table) =>
    `${window.location.origin}/dine-in/${table.tableNumber}?token=${table.qrToken}`;

  const downloadQr = () => {
    const svg = qrBoxRef.current?.querySelector("svg");
    if (!svg || !qrTable) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tastybites-table-${qrTable.tableNumber}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printQr = () => {
    if (!qrTable) return;
    const svg = qrBoxRef.current?.querySelector("svg")?.outerHTML || "";
    const win = window.open("", "_blank", "width=480,height=640");
    if (!win) return;
    win.document.write(
      `<html><head><title>Table ${qrTable.tableNumber}</title></head>` +
        `<body style="font-family:sans-serif;text-align:center;padding:32px;">` +
        `<h1>TastyBites</h1><h2>Table ${qrTable.tableNumber}</h2>` +
        `<p>Scan to Order</p>${svg}` +
        `<script>window.onload=()=>{window.print();}</scr` + `ipt></body></html>`
    );
    win.document.close();
  };

  if (loading) return <p>Loading tables...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Tables</h1>
        <button
          onClick={startCreate}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          Add Table
        </button>
      </div>

      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>
      )}
      {message && (
        <p className="bg-green-100 text-green-700 text-sm p-2 rounded mb-4">{message}</p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 mb-6 space-y-4">
          <h2 className="text-lg font-bold">{editingId ? "Edit Table" : "New Table"}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Table Number *</label>
              <input
                type="text"
                value={form.tableNumber}
                onChange={(e) => setForm({ ...form, tableNumber: e.target.value.toUpperCase() })}
                required
                maxLength={10}
                placeholder="T01"
                className="mt-1 w-full border rounded px-3 py-2 uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Capacity (seats) *</label>
              <input
                type="number"
                min="1"
                max="50"
                step="1"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                required
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Section</label>
              <input
                type="text"
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                maxLength={60}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full border rounded px-3 py-2"
              >
                <option value="available">🟢 Available</option>
                <option value="reserved">🟡 Reserved</option>
                <option value="occupied">🔴 Occupied</option>
                <option value="disabled">⚪ Disabled</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
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
              {saving ? "Saving..." : editingId ? "Update Table" : "Create Table"}
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

      {tables.length === 0 && !error && (
        <p className="text-gray-600">No tables yet.</p>
      )}

      {tables.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {tables.map((table) => (
            <div key={table._id} className="bg-white shadow rounded-lg p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xl font-bold">{table.tableNumber}</p>
                  <p className="text-sm text-gray-500">
                    {table.capacity} seats{table.section ? ` · ${table.section}` : ""}
                  </p>
                </div>
                <span className="text-sm font-medium whitespace-nowrap">
                  {statusDot(table.status)} {table.status}
                  {!table.isActive && " (off)"}
                </span>
              </div>
              {table.activeSession && (
                <p className="text-xs text-gray-500 mt-2">
                  Session: {table.activeSession.sessionId}
                </p>
              )}
              {table.openOrders > 0 && (
                <p className="text-xs text-orange-600 font-medium mt-1">
                  {table.openOrders} open order{table.openOrders === 1 ? "" : "s"}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setQrTable(table)}
                  className="bg-stone-800 text-white px-3 py-1 rounded hover:bg-stone-900 text-sm"
                >
                  QR Code
                </button>
                <button
                  onClick={() => startEdit(table)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => runAction(table._id, "mark-available", null, "Table marked as available")}
                  disabled={actingId === `${table._id}-mark-available`}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm disabled:opacity-50"
                >
                  Mark Available
                </button>
                <button
                  onClick={() => runAction(table._id, "close-session", "Close the active dine-in session?", "Dine-in session closed successfully")}
                  disabled={actingId === `${table._id}-close-session`}
                  className="bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700 text-sm disabled:opacity-50"
                >
                  Close Session
                </button>
                <button
                  onClick={() => handleDelete(table)}
                  disabled={actingId === `${table._id}-delete`}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {qrTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/50" onClick={() => setQrTable(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <p className="font-display text-xl">TastyBites</p>
            <p className="font-bold text-2xl mt-1">Table {qrTable.tableNumber}</p>
            <p className="text-sm text-gray-500">Scan to Order</p>
            <div ref={qrBoxRef} className="mt-4 flex justify-center bg-white p-4">
              <QRCode value={qrUrl(qrTable)} size={220} />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                onClick={downloadQr}
                className="bg-stone-800 text-white px-4 py-2 rounded hover:bg-stone-900 text-sm"
              >
                Download
              </button>
              <button
                onClick={printQr}
                className="bg-stone-800 text-white px-4 py-2 rounded hover:bg-stone-900 text-sm"
              >
                Print
              </button>
              <button
                onClick={() => runAction(qrTable._id, "regenerate-token", "Invalidate printed codes and generate a new QR?", "QR code regenerated successfully")}
                disabled={actingId === `${qrTable._id}-regenerate-token`}
                className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 text-sm disabled:opacity-50"
              >
                Generate New QR
              </button>
              <button
                onClick={() => setQrTable(null)}
                className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tables;
