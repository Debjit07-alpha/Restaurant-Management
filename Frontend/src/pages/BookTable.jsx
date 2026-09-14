import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const todayISO = () => new Date().toISOString().slice(0, 10);

function BookTable() {
  const { user } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState("19:30");
  const [guests, setGuests] = useState(2);
  const [fullName, setFullName] = useState(user?.name || "");
  const [mobile, setMobile] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");
  const [tables, setTables] = useState([]);
  const [checked, setChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [reservingId, setReservingId] = useState(null);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  const checkAvailability = async (e) => {
    e?.preventDefault();
    setError("");
    setConfirmed(null);
    if (!date || !startTime || guests < 1) {
      setError("Select a date, time and guest count.");
      return;
    }
    setChecking(true);
    try {
      const res = await api.get("/reservations/availability", {
        params: { date, startTime, guests },
      });
      setTables(res.data.tables || []);
      setChecked(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to check availability. Please try again."
      );
    } finally {
      setChecking(false);
    }
  };

  const reserve = async (table) => {
    if (!fullName.trim() || !/^\d{10}$/.test(mobile.trim())) {
      setError("Enter your full name and a valid 10-digit mobile number.");
      return;
    }
    setReservingId(table.tableId);
    setError("");
    try {
      const res = await api.post("/reservations", {
        date,
        startTime,
        guestCount: guests,
        tableId: table.tableId,
        customerName: fullName.trim(),
        mobile: mobile.trim(),
        specialRequest: specialRequest.trim(),
      });
      setConfirmed({ ...res.data.reservation, ...table });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to reserve this table. Please try again."
      );
    } finally {
      setReservingId(null);
    }
  };

  if (confirmed) {
    return (
      <div className="bg-cream text-charcoal min-h-screen">
        <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
          <span className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-pine text-cream text-3xl">
            ✓
          </span>
          <h1 className="font-display font-semibold text-4xl mt-6">
            Table Reserved <span className="italic text-burgundy">Successfully!</span>
          </h1>
          <div className="mt-6 inline-block bg-white border border-charcoal/10 rounded-[20px] px-8 py-5 text-left text-[15px] space-y-1.5">
            <p><span className="text-charcoal/55">Reservation ID: </span><span className="font-bold">#{confirmed.reservationId}</span></p>
            <p><span className="text-charcoal/55">Table: </span><span className="font-bold">{confirmed.tableNumber}</span></p>
            <p><span className="text-charcoal/55">Date: </span><span className="font-bold">{confirmed.date}</span></p>
            <p><span className="text-charcoal/55">Time: </span><span className="font-bold">{confirmed.startTime || startTime}</span></p>
            <p><span className="text-charcoal/55">Guests: </span><span className="font-bold">{confirmed.guestCount}</span></p>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/reservations"
              className="bg-burgundy text-white rounded-full px-8 py-3.5 text-[15px] font-semibold hover:bg-burgundy-dark transition-colors text-center"
            >
              View Reservation
            </Link>
            <Link
              to="/"
              className="border border-charcoal/20 rounded-full px-8 py-3.5 text-[15px] font-semibold hover:border-burgundy hover:text-burgundy transition-colors text-center"
            >
              Back to Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream text-charcoal min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
        <p className="text-[13px] uppercase tracking-[0.25em] text-burgundy font-semibold">
          Dine with us
        </p>
        <h1 className="font-display font-semibold text-4xl sm:text-5xl mt-2">
          Book a Table
        </h1>

        {error && (
          <p className="mt-6 bg-red-100 text-red-700 text-sm p-3 rounded-xl">
            {error}
          </p>
        )}

        <form
          onSubmit={checkAvailability}
          className="mt-8 bg-white border border-charcoal/10 rounded-[20px] p-6 space-y-4"
        >
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Date *</label>
              <input
                type="date"
                value={date}
                min={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                required
                className="mt-1 w-full border border-charcoal/20 rounded-xl px-3 py-2 bg-cream focus:outline-none focus:border-burgundy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Time *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="mt-1 w-full border border-charcoal/20 rounded-xl px-3 py-2 bg-cream focus:outline-none focus:border-burgundy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Guests *</label>
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="mt-1 w-full border border-charcoal/20 rounded-xl px-3 py-2 bg-cream focus:outline-none focus:border-burgundy"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-1 w-full border border-charcoal/20 rounded-xl px-3 py-2 bg-cream focus:outline-none focus:border-burgundy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Mobile *</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                pattern="[0-9]{10}"
                placeholder="9876543210"
                className="mt-1 w-full border border-charcoal/20 rounded-xl px-3 py-2 bg-cream focus:outline-none focus:border-burgundy"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium">
                Special Request <span className="font-normal text-charcoal/50">(optional)</span>
              </label>
              <input
                type="text"
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                maxLength={300}
                placeholder="Window seat…"
                className="mt-1 w-full border border-charcoal/20 rounded-xl px-3 py-2 bg-cream focus:outline-none focus:border-burgundy"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={checking}
            className="w-full bg-charcoal text-cream rounded-full py-3 text-sm font-semibold hover:bg-burgundy transition-colors disabled:opacity-50"
          >
            {checking ? "Checking..." : "Check Availability"}
          </button>
        </form>

        {checked && (
          <div className="mt-8">
            <h2 className="font-display font-semibold text-2xl">Available tables</h2>
            {tables.length === 0 ? (
              <div className="mt-4 bg-white border border-charcoal/10 rounded-[20px] p-8 text-center">
                <p className="font-semibold text-lg">No tables available for this time.</p>
                <p className="text-charcoal/60 mt-1 text-[15px]">Try another time.</p>
              </div>
            ) : (
              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                {tables.map((table) => (
                  <div
                    key={table.tableId}
                    className="bg-white border border-charcoal/10 rounded-[20px] p-5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-display font-semibold text-2xl">{table.tableNumber}</p>
                      <p className="text-sm text-charcoal/60 mt-0.5">
                        {table.capacity} seats{table.section ? ` · ${table.section}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => reserve(table)}
                      disabled={reservingId === table.tableId}
                      className="bg-burgundy text-white rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-burgundy-dark transition-colors disabled:opacity-50 shrink-0"
                    >
                      {reservingId === table.tableId ? "Reserving..." : "Reserve"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookTable;
