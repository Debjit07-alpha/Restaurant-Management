import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// Backend-backed favorites store shared by every consumer.
// - Authenticated users persist favorites in MongoDB via /api/users/me/favorites.
// - Guests keep empty hearts; clicking sends them through the existing login
//   flow (with returnTo), never a second login system.
// - UI updates only after a successful API response (no optimistic writes).
// - One in-flight toggle at a time per item (pendingId) prevents duplicates.

const store = {
  userId: null,
  ids: [],
  loading: false,
  pendingId: null,
  notice: null, // { type: "success" | "error", text }
  version: 0, // bumped after every successful mutation
};

const listeners = new Set();

// Immutable snapshot for useSyncExternalStore. The internal `store` is
// mutated, but every emit() publishes a NEW snapshot object — otherwise
// React sees the same reference (Object.is) and skips re-rendering, which
// is why hearts/toasts only refreshed after navigation.
let currentSnapshot = {
  ids: [],
  loading: false,
  pendingId: null,
  notice: null, // { type: "success" | "error", text }
  version: 0, // bumped after every successful mutation
};

function emit() {
  currentSnapshot = {
    ids: [...store.ids],
    loading: store.loading,
    pendingId: store.pendingId,
    notice: store.notice,
    version: store.version,
  };
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return currentSnapshot;
}

function getServerSnapshot() {
  return currentSnapshot;
}

function setNotice(type, text) {
  store.notice = { type, text };
  emit();
}

async function fetchFavorites(userId) {
  store.loading = true;
  emit();
  try {
    const res = await api.get("/users/me/favorites");
    if (store.userId !== userId) return;
    store.ids = (res.data.favorites || []).map((fav) =>
      typeof fav === "string" ? fav : fav._id
    );
  } catch {
    if (store.userId !== userId) return;
    store.ids = [];
  } finally {
    if (store.userId === userId) {
      store.loading = false;
      emit();
    }
  }
}

export function useFavorites() {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Backend returns `id`, older code expects `_id` (AuthContext now
  // normalizes both, but accept either here for robustness).
  const userId = user?._id || user?.id || null;

  // Load favorites when the logged-in user changes; clear on logout so one
  // user's hearts never leak into another user's (or guest) session.
  // While auth is still restoring (authLoading), do nothing — never treat
  // "loading" as "logged out".
  useEffect(() => {
    if (authLoading) return;
    if (!token || !userId) {
      store.userId = null;
      store.ids = [];
      store.loading = false;
      store.pendingId = null;
      emit();
      return;
    }
    if (store.userId !== userId) {
      store.userId = userId;
      store.ids = [];
      store.pendingId = null;
      fetchFavorites(userId);
    }
  }, [authLoading, token, userId]);

  const toggleFavorite = async (menuItemId) => {
    if (!menuItemId || snapshot.pendingId) return false;

    // Auth still restoring — wait instead of assuming logged out.
    if (authLoading) return false;

    // Guests go through the existing login flow.
    if (!token || !userId) {
      navigate("/login", {
        state: { returnTo: location.pathname + location.search },
      });
      return false;
    }

    store.pendingId = menuItemId;
    store.notice = null;
    emit();
    try {
      const res = await api.put(`/users/me/favorites/${menuItemId}`);
      store.ids = (res.data.favorites || []).map((fav) =>
        typeof fav === "string" ? fav : fav._id
      );
      store.version += 1;
      setNotice(
        "success",
        res.data.favorited ? "Saved to favorites." : "Removed from favorites."
      );
      return true;
    } catch (err) {
      const status = err.response?.status;
      // eslint-disable-next-line no-console
      console.error("toggleFavorite failed:", status, err.response?.data || err.message);
      if (status === 401) {
        // Token expired/invalid — reuse the existing login flow.
        navigate("/login", {
          state: { returnTo: location.pathname + location.search },
        });
        setNotice("error", "Please login again to manage favorites.");
      } else if (status === 404 && !err.response?.data?.success) {
        // Stale backend without favorites routes returns HTML 404.
        setNotice(
          "error",
          "Favorites service is unavailable. Please try again later."
        );
      } else {
        setNotice(
          "error",
          err.response?.data?.message || "Unable to update favorites. Please try again."
        );
      }
      return false;
    } finally {
      store.pendingId = null;
      emit();
    }
  };

  const clearNotice = () => {
    store.notice = null;
    emit();
  };

  return {
    favorites: snapshot.ids,
    isFavorite: (id) => snapshot.ids.includes(String(id)),
    toggleFavorite,
    pendingId: snapshot.pendingId,
    loading: snapshot.loading,
    notice: snapshot.notice,
    clearNotice,
    version: snapshot.version,
  };
}
