import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
type Method = { enabled: boolean; title: string; number: string };
type Cfg = { easypaisa: Method; jazzcash: Method; min_deposit: number; instructions: string };
export default function PaymentSettings() {
  const [cfg, setCfg] = useState<Cfg | null>(null); const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { supabase.from("site_settings").select("value").eq("key", "payment").single().then(({ data }) => setCfg(data?.value as Cfg)); }, []);
  if (!cfg) return <p className="text-slate-500">Loading…</p>;
  const setM = (k: "easypaisa" | "jazzcash", patch: Partial<Method>) => setCfg({ ...cfg, [k]: { ...cfg[k], ...patch } });
  async function save() {
    if (!cfg) return; setErr(""); setMsg("");
    if (!(Number(cfg.min_deposit) >= 1)) return setErr("Minimum deposit must be at least 1.");
    for (const k of ["easypaisa", "jazzcash"] as const) {
      const m = cfg[k];
      if (m.enabled && (m.title.trim().length < 2 || !/^[0-9+\s-]{10,15}$/.test(m.number.trim()))) return setErr(`Enter a valid account title and mobile number for ${k === "easypaisa" ? "EasyPaisa" : "JazzCash"}, or disable it.`);
    }
    setBusy(true);
    const value = { ...cfg, min_deposit: Number(cfg.min_deposit) };
    const { error } = await supabase.from("site_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", "payment");
    setBusy(false);
    if (error) return setErr(error.message);
    setMsg("Saved.");
  }
  const block = (k: "easypaisa" | "jazzcash", name: string) => (
    <div className="card space-y-3"><div className="flex items-center justify-between"><h2 className="font-semibold">{name}</h2>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cfg[k].enabled} onChange={(e) => setM(k, { enabled: e.target.checked })} />Enabled</label></div>
      <input className="input" placeholder="Account title" value={cfg[k].title} onChange={(e) => setM(k, { title: e.target.value })} />
      <input className="input" placeholder="Mobile number" value={cfg[k].number} onChange={(e) => setM(k, { number: e.target.value })} /></div>);
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Payment Settings</h1>
      {block("easypaisa", "EasyPaisa")}{block("jazzcash", "JazzCash")}
      <div className="card space-y-3">
        <input className="input" type="number" min="1" placeholder="Minimum deposit (PKR)" value={cfg.min_deposit} onChange={(e) => setCfg({ ...cfg, min_deposit: Number(e.target.value) })} />
        <textarea className="input" rows={3} placeholder="Deposit instructions (optional)" value={cfg.instructions} onChange={(e) => setCfg({ ...cfg, instructions: e.target.value })} />
      </div>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}{msg && <p className="text-sm text-green-700">{msg}</p>}
      <button className="btn" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save settings"}</button>
    </div>
  );
}
