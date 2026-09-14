import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { formatPrice } from "../../utils/formatPrice";
import { resolveAvailabilityStatus } from "../../utils/availability";

const statusStyles = {
  Pending: "bg-amber-100 text-amber-800",
  Confirmed: "bg-sky-100 text-sky-800",
  Preparing: "bg-orange-100 text-orange-800",
  Delivered: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-rose-100 text-rose-800",
};

function last7Days() {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
}

function OrdersChart({ orders }) {
  const days = useMemo(() => last7Days(), []);
  const counts = days.map((day) => {
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    return orders.filter((order) => {
      const created = new Date(order.createdAt);
      return created >= day && created < next;
    }).length;
  });

  const W = 560;
  const H = 220;
  const PAD = 28;
  const max = Math.max(1, ...counts);
  const stepX = (W - PAD * 2) / 6;
  const points = counts.map(
    (count, i) =>
      `${PAD + i * stepX},${H - PAD - (count / max) * (H - PAD * 2)}`
  );
  const line = `M${points.join(" L")}`;
  const area = `${line} L${PAD + 6 * stepX},${H - PAD} L${PAD},${H - PAD} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-52 sm:h-60">
        {[0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = PAD + (1 - fraction) * (H - PAD * 2);
          return (
            <line
              key={fraction}
              x1={PAD}
              x2={W - PAD}
              y1={y}
              y2={y}
              stroke="#e7e5e4"
              strokeWidth="1"
            />
          );
        })}
        <path d={area} fill="#ea580c" opacity="0.08" />
        <path
          d={line}
          fill="none"
          stroke="#ea580c"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, i) => {
          const [cx, cy] = point.split(",");
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="4" fill="#ea580c" />
              <circle cx={cx} cy={cy} r="7.5" fill="#ea580c" opacity="0.15" />
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-stone-400 mt-1 px-1">
        {days.map((day) => (
          <span key={day.toISOString()}>
            {day.toLocaleDateString("en-IN", { weekday: "short" })}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatCard({ tint, iconBg, label, value, sub, icon, delay }) {
  return (
    <div
      className={`${tint} rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200/60 transition-all hover:-translate-y-1 hover:shadow-md animate-admin-fade-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-11 h-11 rounded-full ${iconBg} flex items-center justify-center`}>
        {icon}
      </div>
      <p className="text-sm text-stone-500 mt-4">{label}</p>
      <p className="text-3xl font-bold text-stone-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [menuRes, userRes, orderRes] = await Promise.all([
          // Admin list includes hidden items for accurate counts.
          api.get("/menu-items/admin/all"),
          api.get("/users"),
          api.get("/orders"),
        ]);
        setMenuItems(menuRes.data.menuItems || []);
        setUsers(userRes.data.users || []);
        setOrders(orderRes.data.orders || []);
      } catch {
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const revenue = orders.reduce(
    (sum, order) => sum + (Number(order.totalAmount) || 0),
    0
  );
  const availableCount = menuItems.filter(
    (item) => resolveAvailabilityStatus(item) === "available"
  ).length;
  const soldOutCount = menuItems.filter(
    (item) => resolveAvailabilityStatus(item) === "sold_out"
  ).length;
  const hiddenCount = menuItems.filter(
    (item) => resolveAvailabilityStatus(item) === "hidden"
  ).length;
  const pendingCount = orders.filter(
    (order) => order.orderStatus === "Pending"
  ).length;
  const recentOrders = orders.slice(0, 5);
  const bannerItem = menuItems.find((item) => item.image) || null;
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading) return <p className="text-stone-500">Loading dashboard...</p>;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 animate-admin-fade-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
            Welcome back, {user?.name || "Admin"}!
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Here&apos;s what&apos;s happening with your restaurant today.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden sm:block text-sm text-stone-500">{today}</p>
          <div className="flex items-center gap-2.5 bg-white border border-stone-200 rounded-2xl px-3 py-2 shadow-sm">
            <span className="w-9 h-9 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-stone-900">
                {user?.name || "Admin"}
              </span>
              <span className="block text-xs text-stone-400">Administrator</span>
            </span>
          </div>
        </div>
      </div>

      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-3 rounded-2xl mt-4">{error}</p>
      )}

      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl mt-6 h-40 sm:h-48 animate-admin-fade-up bg-stone-900">
        {bannerItem && (
          <img
            src={bannerItem.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <div className="absolute inset-0 bg-stone-900/55" />
        <div className="relative h-full flex flex-col justify-center px-6 sm:px-10">
          <p className="font-display italic text-2xl sm:text-3xl text-white">
            &ldquo;Great food creates great moments&rdquo;
          </p>
          <p className="text-sm text-white/70 mt-2">
            Fresh from the TastyBites kitchen, every day.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mt-6">
        <StatCard
          tint="bg-orange-50"
          iconBg="bg-white text-orange-600 shadow-sm"
          label="Total Menu Items"
          value={menuItems.length}
          sub={`${availableCount} available · ${soldOutCount} sold out · ${hiddenCount} hidden`}
          delay={0}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L6 19.5m9-7.243V12m-3 0v2.513m3-2.513V12m-6 0v2.513" />
            </svg>
          }
        />
        <StatCard
          tint="bg-sky-50"
          iconBg="bg-white text-sky-600 shadow-sm"
          label="Total Users"
          value={users.length}
          sub="Registered customers"
          delay={80}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <StatCard
          tint="bg-rose-50"
          iconBg="bg-white text-rose-600 shadow-sm"
          label="Total Orders"
          value={orders.length}
          sub={`${pendingCount} pending`}
          delay={160}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          }
        />
        <StatCard
          tint="bg-emerald-50"
          iconBg="bg-white text-emerald-600 shadow-sm"
          label="Total Revenue"
          value={formatPrice(revenue)}
          sub={`From ${orders.length} order${orders.length === 1 ? "" : "s"}`}
          delay={240}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25H9m6 3H9m3 6l-3-3h1.5a3 3 0 100-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Orders overview + recent orders */}
      <div className="grid gap-4 lg:grid-cols-5 mt-6">
        <div
          className="lg:col-span-3 bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200/60 animate-admin-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Orders Overview</h2>
              <p className="text-sm text-stone-500">
                Your restaurant&apos;s order activity over the last 7 days.
              </p>
            </div>
            <select
              aria-label="Chart range"
              className="text-sm border border-stone-200 rounded-xl px-3 py-1.5 text-stone-600 bg-white"
              defaultValue="7days"
            >
              <option value="7days">Last 7 days</option>
            </select>
          </div>
          <div className="mt-4">
            <OrdersChart orders={orders} />
          </div>
        </div>

        <div
          className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200/60 animate-admin-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <h2 className="text-lg font-bold text-stone-900">Recent Orders</h2>
          <p className="text-sm text-stone-500">
            Latest orders from your customers.
          </p>

          {recentOrders.length === 0 ? (
            <div className="text-center py-10">
              <span className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-orange-50">
                <svg className="w-7 h-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </span>
              <p className="font-semibold text-stone-900 mt-4">No orders yet</p>
              <p className="text-sm text-stone-500 mt-1">
                When customers place orders, they&apos;ll appear here.
              </p>
              <Link
                to="/admin/menu-items"
                className="inline-block mt-5 bg-orange-600 text-white text-sm px-6 py-2.5 rounded-full hover:bg-orange-700 transition-colors"
              >
                View Menu Items
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center gap-3 border border-stone-100 rounded-2xl px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">
                      {order.orderId}
                    </p>
                    <p className="text-xs text-stone-500 truncate">
                      {order.customerName} ·{" "}
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })
                        : "—"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-stone-900 whitespace-nowrap">
                    {formatPrice(order.totalAmount)}
                  </p>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                      statusStyles[order.orderStatus] || "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {order.orderStatus}
                  </span>
                </div>
              ))}
              <Link
                to="/admin/orders"
                className="block text-center text-sm text-orange-600 hover:text-orange-700 font-medium pt-1"
              >
                View all orders
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
