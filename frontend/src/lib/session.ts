// Framework-agnostic session storage shared by the axios client and the auth
// context. Keeps the JWT + cached user in localStorage and notifies listeners
// (the AuthProvider) when the session is cleared (e.g. on a 401).

import type { User } from "@/types/api";

const TOKEN_KEY = "motorcenter.token";
const USER_KEY = "motorcenter.user";

type SessionListener = () => void;
const listeners = new Set<SessionListener>();

const isBrowser = (): boolean => typeof window !== "undefined";

export function getToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: User): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  notify();
}

export function setStoredUser(user: User): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  notify();
}

export function clearSession(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  notify();
}

export function subscribe(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  listeners.forEach((listener) => listener());
}
