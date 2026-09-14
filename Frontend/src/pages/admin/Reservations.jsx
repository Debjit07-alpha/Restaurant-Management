import { useEffect, useState } from "react";
import api from "../../api/axios";

const FILTERS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "today", label: "Today" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const NEXT_ACTIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["seated", "cancelled"],
  seated: ["completed", "no_show"],
};

function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actingId, setActingId] = useState(null);
  const [assignId, setAssignId] = useState(null);
  const [assignTable, setAssignTable] = useState("");
  const [tables, setTables] = useState([]);

  const fetchAll = async (activeFilter) => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/reservations", { params: { filter: activeFilter } });
      setReservations(res.data.reservations || []);
    } catch {
      setError("Unable to load reservations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchTables = async () => {
    try {
      const res = await api.get("/tables");
      setTables(res.data.tables || []);
    } catch {
      setTables([]);
    }
  };

  const handleStatus = async (reservation, status) => {
    const label = status.replace("_", " ");
    if (!window.confirm(`Mark reservation ${reservation.reservationId} as ${label}?`)) return;
    setActingId(`${reservation._id}-${status}`);
    setError("");
    setMessage("");
    try {
      await api.put(`/reservations/${reservation._id}`, { status });
      setMessage("Reservation updated successfully.");
      fetchAll(filter);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update reservation.");
    } finally {
      setActingId(null);
    }
  };

  const startAssign = (reservation) => {
    setAssignId(reservation._id);
    setAssignTable(reservation.table?._id || "");
    fetchTables();
    setError("");
    setMessage("");
  };

  const handleAssign = async (reservation) => {
    if (!assignTable) {
      setError("Select a table first.");
      return;
    }
    setActingId(`${reservation._id}-assign`);
    setError("");
    setMessage("");
    try {
      await api.put(`/reservations/${reservation._id}`, {
        status: reservation.status === "pending" ? "confirmed" : reservation.status,
        tableId: assignTable,
      });
      setMessage("Table assigned successfully.");
      setAssignId(null);
      fetchAll(filter);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign table.");
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <p>Loading reservations...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Reservations</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Reservation filter"
          className="border rounded px-3 py-2 text-sm bg-white"
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>
      )}
      {message && (
        <p className="bg-green-100 text-green-700 text-sm p-2 rounded mb-4">{message}</p>
      )}

      {reservations.length === 0 && !error && (
        <p className="text-gray-600">No reservations found.</p>
      )}

      {reservations.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Reservation ID</th>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Date / Time</th>
                <th className="text-left p-3">Guests</th>
                <th className="text-left p-3">Table</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r._id} className="border-t align-top">
                  <td className="p-3 font-medium">{r.reservationId}</td>
                  <td className="p-3">
                    {r.customerName}
                    <span className="block text-xs text-gray-500">{r.mobile}</span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {r.date} · {String(Math.floor((r.startMinutes || 0) / 60)).padStart(2, "0")}:{String((r.startMinutes || 0) % 60).padStart(2, "0")}
                  </td>
                  <td className="p-3">{r.guestCount}</td>
                  <td className="p-3 whitespace-nowrap">
                    {r.tableNumber || "—"}
                    {assignId === r._id ? (
                      <span className="block mt-1.5 flex gap-1.5">
                        <select
                          value={assignTable}
                          onChange={(e) => setAssignTable(e.target.value)}
                          aria-label="Assign table"
                          className="border rounded px-2 py-1 text-xs bg-white"
                        >
                          <option value="">Select…</option>
                          {tables
                            .filter((t) => t.isActive && t.status !== "disabled")
                            .map((t) => (
                              <option key={t._id} value={t._id}>
                                {t.tableNumber} ({t.capacity} seats)
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() => handleAssign(r)}
                          disabled={actingId === `${r._id}-assign`}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                        >
                          Assign
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => startAssign(r)}
                        className="block mt-1 text-xs text-blue-600 hover:underline"
                      >
                        {r.tableNumber ? "Reassign" : "Assign"}
                      </button>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap capitalize">
                    {r.status.replace("_", " ")}
                  </td>
                  <td className="p-3 whitespace-nowrap space-x-2">
                    {(NEXT_ACTIONS[r.status] || []).map((action) => (
                      <button
                        key={action}
                        onClick={() => handleStatus(r, action)}
                        disabled={actingId === `${r._id}-${action}`}
                        className="bg-stone-800 text-white px-3 py-1 rounded hover:bg-stone-900 text-xs capitalize disabled:opacity-50"
                      >
                        {action.replace("_", " ")}
                      </button>
                    ))}
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

export default Reservations;
