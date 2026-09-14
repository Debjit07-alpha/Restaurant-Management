import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const ACTIVE = ["pending", "confirmed", "seated"];

function formatTime(minutes) {
  if (minutes === null || minutes === undefined) return "";
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function ReservationCard({ reservation, onCancel, cancelling }) {
  const active = ACTIVE.includes(reservation.status);
  return (
    <article className="bg-white border border-charcoal/10 rounded-[20px] p-5 shadow-[0_15px_35px_-24px_rgba(23,23,23,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display font-semibold text-xl">
            Reservation #{reservation.reservationId}
          </p>
          <p className="text-sm text-charcoal/60 mt-1">
            Table {reservation.tableNumber || "—"} · {reservation.date} ·{" "}
            {formatTime(reservation.startMinutes)} · {reservation.guestCount} Guest
            {reservation.guestCount === 1 ? "" : "s"}
          </p>
          {reservation.specialRequest && (
            <p className="text-sm text-charcoal/60 mt-1">
              Note: {reservation.specialRequest}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs font-semibold border rounded-full px-3.5 py-1.5 capitalize bg-charcoal/5 text-charcoal/70 border-charcoal/10">
          {reservation.status.replace("_", " ")}
        </span>
      </div>
      {active && (
        <button
          onClick={() => onCancel(reservation._id)}
          disabled={cancelling}
          className="mt-4 text-sm font-semibold text-red-700 hover:underline underline-offset-2 disabled:opacity-50"
        >
          {cancelling ? "Cancelling..." : "Cancel"}
        </button>
      )}
    </article>
  );
}

function MyReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/reservations/mine");
      setReservations(res.data.reservations || []);
    } catch {
      setError("Unable to load your reservations. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this reservation?")) return;
    setCancellingId(id);
    setError("");
    setMessage("");
    try {
      await api.put(`/reservations/${id}/cancel`);
      setMessage("Reservation cancelled successfully.");
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to cancel reservation.");
    } finally {
      setCancellingId(null);
    }
  };

  const upcoming = reservations.filter((r) => ACTIVE.includes(r.status));
  const past = reservations.filter((r) => !ACTIVE.includes(r.status));

  return (
    <div className="bg-cream text-charcoal min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-fade-in">
        <p className="text-[13px] uppercase tracking-[0.25em] text-burgundy font-semibold">
          Dine with us
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display font-semibold text-4xl sm:text-5xl mt-2">
            My Reservations
          </h1>
          <Link
            to="/book-table"
            className="bg-burgundy text-white rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-burgundy-dark transition-colors"
          >
            Book a Table
          </Link>
        </div>

        {error && (
          <p className="mt-6 bg-red-100 text-red-700 text-sm p-3.5 rounded-2xl border border-red-200">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-6 bg-pine/10 text-pine text-sm p-3.5 rounded-2xl border border-pine/20">
            {message}
          </p>
        )}

        {loading && (
          <p className="mt-8 text-center text-charcoal/50 text-sm">
            Loading your reservations...
          </p>
        )}

        {!loading && !error && reservations.length === 0 && (
          <div className="mt-10 text-center bg-white border border-charcoal/10 rounded-[20px] px-6 py-14">
            <p className="font-display text-2xl">No reservations yet</p>
            <p className="text-charcoal/60 mt-2 text-[15px]">
              Book a table for your next visit.
            </p>
            <Link
              to="/book-table"
              className="inline-block mt-6 bg-burgundy text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-burgundy-dark transition-colors"
            >
              Book a Table
            </Link>
          </div>
        )}

        {!loading && upcoming.length > 0 && (
          <>
            <h2 className="font-display font-semibold text-2xl mt-10">
              Upcoming Reservations
            </h2>
            <div className="mt-4 space-y-4">
              {upcoming.map((r) => (
                <ReservationCard
                  key={r._id}
                  reservation={r}
                  onCancel={handleCancel}
                  cancelling={cancellingId === r._id}
                />
              ))}
            </div>
          </>
        )}

        {!loading && past.length > 0 && (
          <>
            <h2 className="font-display font-semibold text-2xl mt-10">
              Past Reservations
            </h2>
            <div className="mt-4 space-y-4">
              {past.map((r) => (
                <ReservationCard key={r._id} reservation={r} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MyReservations;
