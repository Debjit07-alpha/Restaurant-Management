import { useEffect, useState } from "react";
import api from "../../api/axios";

function Dashboard() {
  const [menuCount, setMenuCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        const [menuRes, userRes, orderRes] = await Promise.all([
          api.get("/menu-items"),
          api.get("/users"),
          api.get("/orders"),
        ]);
        setMenuCount(menuRes.data.menuItems?.length ?? menuRes.data.count ?? 0);
        setUserCount(userRes.data.users?.length ?? userRes.data.count ?? 0);
        setOrderCount(orderRes.data.orders?.length ?? orderRes.data.count ?? 0);
      } catch {
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      {error && (
        <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-500 text-sm">Total Menu Items</p>
          <p className="text-3xl font-bold mt-2">{menuCount}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-500 text-sm">Total Users</p>
          <p className="text-3xl font-bold mt-2">{userCount}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-500 text-sm">Total Orders</p>
          <p className="text-3xl font-bold mt-2">{orderCount}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
