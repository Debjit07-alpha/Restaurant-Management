import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { formatPrice } from "../utils/formatPrice";

const NEXT_MILESTONE = 500;

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Rewards() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [summaryRes, txRes] = await Promise.all([
        api.get("/rewards/summary"),
        api.get("/rewards/transactions"),
      ]);
      setSummary(summaryRes.data);
      setTransactions(txRes.data.transactions || []);
    } catch {
      setError("Unable to load rewards.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="bg-cream text-charcoal min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-fade-in">
        <p className="text-[13px] uppercase tracking-[0.25em] text-burgundy font-semibold">
          Loyalty
        </p>
        <h1 className="font-display font-semibold text-4xl sm:text-5xl mt-2">
          My Rewards
        </h1>

        {error && (
          <p className="mt-6 bg-red-100 text-red-700 text-sm p-3.5 rounded-2xl border border-red-200">
            {error}
          </p>
        )}

        {loading && (
          <p className="mt-8 text-center text-charcoal/50 text-sm">
            Loading rewards...
          </p>
        )}

        {!loading && !error && summary && summary.balance <= 0 && transactions.length === 0 && (
          <div className="mt-10 text-center bg-white border border-charcoal/10 rounded-[20px] px-6 py-14">
            <span className="text-5xl">⭐</span>
            <p className="font-display font-semibold text-2xl mt-4">
              You have no reward points yet.
            </p>
            <p className="text-charcoal/60 mt-2 text-[15px]">
              Complete your first delivered order to start earning rewards.
            </p>
            <Link
              to="/"
              className="inline-block mt-6 bg-burgundy text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-burgundy-dark transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        )}

        {!loading && !error && summary && (summary.balance > 0 || transactions.length > 0) && (
          <>
            <div className="mt-8 bg-white border border-charcoal/10 rounded-[20px] p-6 sm:p-8 shadow-[0_15px_35px_-24px_rgba(23,23,23,0.35)] text-center">
              <p className="font-display font-semibold text-6xl">
                ⭐ {summary.balance}
                <span className="text-2xl text-charcoal/50 font-medium"> Points</span>
              </p>
              <p className="text-charcoal/65 mt-2 text-[15px]">
                Current Value:{" "}
                <span className="font-bold text-pine">
                  {formatPrice(summary.value)}
                </span>
              </p>
              {(() => {
                const reached =
                  Math.floor(summary.balance / NEXT_MILESTONE) * NEXT_MILESTONE;
                const next = reached + NEXT_MILESTONE;
                const progress = Math.min(
                  100,
                  Math.round((summary.balance / next) * 100)
                );
                return (
                  <div className="mt-6 text-left">
                    <div
                      className="h-3 rounded-full bg-cream-dark overflow-hidden"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-burgundy transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-charcoal/60 mt-2 text-center">
                      Earn {next - summary.balance} more points to reach {next}{" "}
                      points.
                    </p>
                  </div>
                );
              })()}
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-cream rounded-2xl px-4 py-3">
                  <p className="text-charcoal/55">Lifetime Earned</p>
                  <p className="font-bold text-lg text-pine">
                    +{summary.lifetimeEarned}
                  </p>
                </div>
                <div className="bg-cream rounded-2xl px-4 py-3">
                  <p className="text-charcoal/55">Lifetime Redeemed</p>
                  <p className="font-bold text-lg text-burgundy">
                    -{summary.lifetimeRedeemed}
                  </p>
                </div>
              </div>
            </div>

            <h2 className="font-display font-semibold text-2xl mt-10">
              Reward History
            </h2>
            {transactions.length === 0 ? (
              <p className="text-charcoal/60 mt-3 text-[15px]">
                No transactions yet.
              </p>
            ) : (
              <div className="mt-4 bg-white border border-charcoal/10 rounded-[20px] overflow-hidden divide-y divide-charcoal/5">
                {transactions.map((tx) => (
                  <div key={tx._id} className="px-5 py-3.5 flex items-center gap-4">
                    <span
                      className={`font-display font-semibold text-xl whitespace-nowrap ${
                        tx.points >= 0 ? "text-pine" : "text-burgundy"
                      }`}
                    >
                      {tx.points >= 0 ? `+${tx.points}` : tx.points}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] truncate">
                        {tx.description || tx.type}
                      </span>
                      <span className="block text-[13px] text-charcoal/45">
                        {tx.order?.orderId ? `Order #${tx.order.orderId} · ` : ""}
                        {formatDate(tx.createdAt)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Rewards;
