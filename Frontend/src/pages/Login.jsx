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
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center">User Login</h1>
        {error && (
          <p className="mt-4 bg-red-100 text-red-700 text-sm p-2 rounded">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="mt-1 w-full border rounded px-3 py-2"
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
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-sm text-center mt-4">
          No account?{" "}
          <Link to="/register" className="text-orange-600 hover:underline">
            Register
          </Link>
        </p>
        <div className="flex items-center gap-3 my-4">
          <span className="flex-1 border-t" />
          <span className="text-xs uppercase tracking-wider text-gray-400">Or</span>
          <span className="flex-1 border-t" />
        </div>
        <p className="text-sm text-center">
          <Link to="/admin/login" className="text-orange-600 hover:underline font-medium">
            Admin Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
