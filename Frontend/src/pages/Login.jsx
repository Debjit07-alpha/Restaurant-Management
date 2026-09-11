import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.token, res.data.user);
      navigate(location.state?.returnTo || "/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fade-in">
      <div className="bg-white border border-charcoal/10 shadow-[0_20px_45px_-25px_rgba(23,23,23,0.4)] rounded-[24px] p-6 sm:p-8">
        <p className="text-center font-display text-xl">
          Tasty<span className="italic text-burgundy">Bites</span>
        </p>
        <h1 className="font-display font-semibold text-3xl text-center mt-2">User Login</h1>
        <p className="text-sm text-center text-charcoal/55 mt-2">
          Welcome back. Good food is waiting.
        </p>
        {error && (
          <p className="mt-4 bg-red-100 text-red-700 text-sm p-3 rounded-xl">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="mt-1.5 w-full border border-charcoal/15 rounded-xl px-3.5 py-2.5 bg-cream focus:outline-none focus:border-burgundy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className="mt-1.5 w-full border border-charcoal/15 rounded-xl px-3.5 py-2.5 bg-cream focus:outline-none focus:border-burgundy"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-burgundy text-white py-3 rounded-[28px] text-[15px] font-semibold hover:bg-burgundy-dark transition-all disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-sm text-center mt-5 text-charcoal/60">
          No account?{" "}
          <Link to="/register" className="text-burgundy hover:underline font-medium">
            Register
          </Link>
        </p>
        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 border-t border-charcoal/10" />
          <span className="text-xs uppercase tracking-wider text-charcoal/40">Or</span>
          <span className="flex-1 border-t border-charcoal/10" />
        </div>
        <p className="text-sm text-center">
          <Link to="/admin/login" className="text-burgundy hover:underline font-medium">
            Admin Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
