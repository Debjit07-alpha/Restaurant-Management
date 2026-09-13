import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

// Backend returns user as { id, name, email, role } while older frontend
// code expects user._id. Normalize once here so every consumer sees both
// `id` and `_id` regardless of which shape was stored/persisted.
function normalizeUser(rawUser) {
  if (!rawUser || typeof rawUser !== "object") return rawUser;
  const id = rawUser._id || rawUser.id || null;
  if (!id) return rawUser;
  return { ...rawUser, _id: id, id };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore login state on page refresh
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(normalizeUser(JSON.parse(storedUser)));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken, newUser) => {
    const normalized = normalizeUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(normalized));
    setToken(newToken);
    setUser(normalized);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === "Admin";
  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
