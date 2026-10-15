import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { friendlyError } from "../../lib/errors";
type A = { enabled: boolean; chat_id: string | null; has_token: boolean; notify_orders: boolean; notify_deposits: boolean; notify_tickets: boolean };
export default function Alerts() {
  const [a, setA] = useState<A | null>(null); const [token, setToken] = useState(""); const [chat, setChat] = useState("");
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const load = () => supabase.rpc("admin_get_alert_settings").then(({ data, error }) => { if (error) setErr(error.message + " (Run 0009_alerts.sql first.)"); else { const v = data as A; setA(v); setChat(v.chat_id ?? ""); } });
  useEffect(() => { load(); }, []);
  if (!a) return err ? <p role="alert" className="card text-red-600">{err}</p> : <p className="text-slate-500">Loading…</p>;
  const set = (k: keyof A, v: boolean) => setA({ ...a, [k]: v });
  async function save() {
    if (!a) return; setErr(""); setMsg(""); setBusy(true);
    const { error } = await supabase.rpc("admin_set_alert_settings", { p_enabled: a.enabled, p_token: token, p_chat: chat, p_orders: a.notify_orders, p_deposits: a.notify_deposits, p_tickets: a.notify_tickets });
    setBusy(false); if (error) return setErr(friendlyError(error.message)); setToken(""); setMsg("Saved."); load();
  }
  async function test() {
    setErr(""); setMsg(""); setBusy(true);
    const { error } = await supabase.rpc("admin_send_test_alert"); setBusy(false);
    if (error) return setErr(friendlyError(error.message)); setMsg("Test sent. Check Telegram (it can take a few seconds).");
  }
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Admin Alerts (Telegram)</h1>
      <p className="text-sm text-slate-500">Get a free Telegram message when a customer places an order, sends a deposit request or writes to support.</p>
      <div className="card space-y-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={a.enabled} onChange={(e) => set("enabled", e.target.checked)} />Alerts enabled</label>
        <label className="block text-sm">Bot token {a.has_token && <span className="text-green-700">(saved)</span>}
          <input className="input mt-1" type="password" autoComplete="off" placeholder={a.has_token ? "Leave empty to keep the saved token" : "123456789:AA…"} value={token} onChange={(e) => setToken(e.target.value)} /></label>
        <label className="block text-sm">Your chat ID<input className="input mt-1" placeholder="123456789" value={chat} onChange={(e) => setChat(e.target.value)} /></label>
        <div className="space-y-1 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={a.notify_orders} onChange={(e) => set("notify_orders", e.target.checked)} />New orders</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={a.notify_deposits} onChange={(e) => set("notify_deposits", e.target.checked)} />New deposit requests</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={a.notify_tickets} onChange={(e) => set("notify_tickets", e.target.checked)} />Support messages</label></div>
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}{msg && <p className="text-sm text-green-700">{msg}</p>}
        <div className="flex gap-2"><button className="btn" disabled={busy} onClick={save}>Save</button>
          <button className="rounded-lg border px-4 py-2 text-sm" disabled={busy || !a.has_token} onClick={test}>Send test message</button></div>
        <p className="text-xs text-slate-500">The token is stored privately in the database and is never shown again. Save first, then send the test.</p>
      </div>
    </div>
  );
}
