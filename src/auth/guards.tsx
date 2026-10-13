import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
// UX guards only. Real security = Supabase RLS + SECURITY DEFINER functions (admin checks happen in the database).
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <p className="p-8 text-slate-500">Loading…</p>;
  return session ? <>{children}</> : <Navigate to="/login" replace />;
}
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return <p className="p-8 text-slate-500">Loading…</p>;
  return profile?.role === "admin" ? <>{children}</> : <Navigate to="/dashboard" replace />;
}
