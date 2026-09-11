import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const iconClass = "w-5 h-5 shrink-0";

const icons = {
  dashboard: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  menu: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L6 19.5m9-7.243V12m-3 0v2.513m3-2.513V12m-6 0v2.513" />
    </svg>
  ),
  users: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  orders: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  ),
  site: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  ),
  logout: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  ),
};

function AdminLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const links = [
    { to: "/admin/dashboard", label: "Dashboard", icon: icons.dashboard },
    { to: "/admin/menu-items", label: "Menu Items", icon: icons.menu },
    { to: "/admin/users", label: "Users", icon: icons.users },
    { to: "/admin/orders", label: "Orders", icon: icons.orders },
  ];

  const linkClass = (path) =>
    location.pathname === path
      ? "flex items-center gap-3 px-4 py-2.5 rounded-xl bg-orange-600 text-white shadow-sm transition-all"
      : "flex items-center gap-3 px-4 py-2.5 rounded-xl text-stone-600 hover:bg-orange-50 hover:text-orange-700 transition-all";

  const sidebar = (
    <div className="flex flex-col h-full">
      <Link to="/admin/dashboard" className="px-2 pt-2 pb-6">
        <p className="font-display text-2xl text-stone-900 leading-none">
          Tasty<span className="italic text-orange-600">Bites</span>
        </p>
        <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400 mt-2">
          Admin Panel
        </p>
      </Link>

      <nav className="space-y-1.5 flex-1">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => setDrawerOpen(false)}
            className={linkClass(link.to)}
          >
            {link.icon}
            <span className="text-sm font-medium">{link.label}</span>
          </Link>
        ))}
        <Link
          to="/"
          onClick={() => setDrawerOpen(false)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-stone-600 hover:bg-orange-50 hover:text-orange-700 transition-all"
        >
          {icons.site}
          <span className="text-sm font-medium">View Site</span>
        </Link>
      </nav>

      <div className="pt-4 mt-4 border-t border-stone-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-stone-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          {icons.logout}
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf7f1]">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 bg-[#faf7f1]/95 backdrop-blur border-b border-stone-200 px-4 py-3">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open admin menu"
          className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white"
        >
          <span className="block w-5 h-0.5 bg-stone-800" />
          <span className="block w-5 h-0.5 bg-stone-800" />
          <span className="block w-5 h-0.5 bg-stone-800" />
        </button>
        <p className="font-display text-lg text-stone-900">
          Tasty<span className="italic text-orange-600">Bites</span>
          <span className="text-xs text-stone-400 font-sans"> Admin</span>
        </p>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-64 shrink-0 sticky top-0 h-screen bg-white border-r border-stone-200 p-5">
          {sidebar}
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-stone-900/40"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white shadow-xl p-5 animate-admin-slide-in">
              {sidebar}
            </aside>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default AdminLayout;
