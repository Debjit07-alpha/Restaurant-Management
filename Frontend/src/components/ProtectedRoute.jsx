import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { user, token, loading, isAdmin } = useAuth();

  if (loading) {
    return <p className="p-6 text-center">Loading...</p>;
  }

  // Must be logged in AND have Admin role
  if (!token || !user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
