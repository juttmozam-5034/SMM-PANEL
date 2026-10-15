import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type Profile = { id: string; username: string; email: string; role: "customer" | "admin"; balance: number; is_blocked: boolean };
type Ctx = { session: Session | null; profile: Profile | null; loading: boolean; signOut: () => Promise<void>; refreshProfile: () => Promise<void> };
const AuthCtx = createContext<Ctx>({ session: null, profile: null, loading: true, signOut: async () => {}, refreshProfile: async () => {} });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from("profiles").select("id,username,email,role,balance,is_blocked").eq("id", uid).single();
    setProfile(data as Profile | null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if (!s) { setProfile(null); setLoading(false); } });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    loadProfile(session.user.id).then(() => setLoading(false));
  }, [session?.user.id, loadProfile]);

  const signOut = async () => { await supabase.auth.signOut(); };
  const refreshProfile = async () => { if (session) await loadProfile(session.user.id); };
  return <AuthCtx.Provider value={{ session, profile, loading, signOut, refreshProfile }}>{children}</AuthCtx.Provider>;
}
