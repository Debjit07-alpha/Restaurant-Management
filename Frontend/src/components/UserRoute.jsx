import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Requires any logged-in user (guests are sent to login,
// then returned to the page they tried to visit).
function UserRoute({ children }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="p-6 text-center">Loading...</p>;
  }

  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ returnTo: location.pathname }}
      />
    );
  }

  return children;
}

export default UserRoute;
