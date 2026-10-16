import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? ""); const [pw, setPw] = useState(""); const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  async function saveName() {
    if (!profile) return; setErr(""); setMsg("");
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) return setErr("Username: 3-30 letters, numbers or _");
    const { error } = await supabase.from("profiles").update({ username }).eq("id", profile.id);
    if (error) return setErr(error.message.includes("duplicate") ? "That username is taken." : error.message);
    await refreshProfile(); setMsg("Username updated.");
  }
  async function savePw() {
    setErr(""); setMsg(""); if (pw.length < 8) return setErr("Password must be at least 8 characters.");
    const { error } = await supabase.auth.updateUser({ password: pw }); if (error) return setErr(error.message); setPw(""); setMsg("Password updated.");
  }
  return (
    <div className="max-w-md space-y-4"><h1 className="text-xl font-semibold">Profile Settings</h1>
      <div className="card space-y-3"><p className="text-sm text-slate-500">Email: {profile?.email}</p>
        <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} /><button className="btn" onClick={saveName}>Save username</button></div>
      <div className="card space-y-3"><input className="input" type="password" placeholder="New password (min 8 characters)" value={pw} onChange={(e) => setPw(e.target.value)} /><button className="btn" onClick={savePw}>Change password</button></div>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}{msg && <p className="text-sm text-green-700">{msg}</p>}
    </div>
  );
}
