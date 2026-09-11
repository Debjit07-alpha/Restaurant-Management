import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const linkClass = (path) =>
    location.pathname === path
      ? "block px-4 py-2 rounded bg-orange-600 text-white"
      : "block px-4 py-2 rounded hover:bg-orange-100 text-gray-800";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar */}
      <aside className="w-full md:w-60 bg-white shadow p-4">
        <h2 className="text-xl font-bold text-orange-600 mb-4">Admin Panel</h2>
        <nav className="space-y-2">
          <Link to="/admin/dashboard" className={linkClass("/admin/dashboard")}>
            Dashboard
          </Link>
          <Link to="/admin/menu-items" className={linkClass("/admin/menu-items")}>
            Menu Items
          </Link>
          <Link to="/admin/users" className={linkClass("/admin/users")}>
            Users
          </Link>
          <Link to="/admin/orders" className={linkClass("/admin/orders")}>
            Orders
          </Link>
          <Link to="/" className="block px-4 py-2 rounded hover:bg-orange-100 text-gray-800">
            View Site
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}

export default AdminLayout;
