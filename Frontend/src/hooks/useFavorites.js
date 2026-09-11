import { useSyncExternalStore } from "react";

const STORAGE_KEY = "tastybites_favorites";

function readFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let cache = null;
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot() {
  const current = readFavorites();
  if (JSON.stringify(current) !== JSON.stringify(cache)) {
    cache = current;
  }
  return cache;
}

function getServerSnapshot() {
  return [];
}

// Local-only favorites (persisted per browser). No backend involved.
export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleFavorite = (id) => {
    const next = favorites.includes(id)
      ? favorites.filter((fav) => fav !== id)
      : [...favorites, id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    cache = next;
    emit();
  };

  return {
    favorites,
    isFavorite: (id) => favorites.includes(id),
    toggleFavorite,
  };
}
