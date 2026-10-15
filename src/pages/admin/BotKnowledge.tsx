import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
type Cfg = { enabled: boolean; greeting: string; refund_policy: string; delivery_notes: string; extra: string };
type Faq = { id: string; question: string; answer: string; sort_order: number; is_active: boolean };
export default function BotKnowledge() {
  const [cfg, setCfg] = useState<Cfg | null>(null); const [faqs, setFaqs] = useState<Faq[]>([]);
  const [q, setQ] = useState(""); const [a, setA] = useState(""); const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  const loadFaqs = () => supabase.from("bot_faqs").select("*").order("sort_order").order("created_at").then(({ data, error }) => { if (error) setErr(error.message + " (Run 0008_bot.sql first.)"); setFaqs((data ?? []) as Faq[]); });
  useEffect(() => { supabase.from("site_settings").select("value").eq("key", "bot").maybeSingle().then(({ data }) => setCfg((data?.value ?? { enabled: true, greeting: "", refund_policy: "", delivery_notes: "", extra: "" }) as Cfg)); loadFaqs(); }, []);
  if (!cfg) return <p className="text-slate-500">Loading…</p>;
  async function saveCfg() {
    setErr(""); setMsg("");
    const { error } = await supabase.from("site_settings").upsert({ key: "bot", value: cfg, is_public: true, updated_at: new Date().toISOString() });
    if (error) return setErr(error.message); setMsg("Saved. The bot uses the new text within about a minute.");
  }
  async function addFaq() {
    setErr(""); if (q.trim().length < 3 || !a.trim()) return setErr("Enter a question (min 3 characters) and an answer.");
    const { error } = await supabase.from("bot_faqs").insert({ question: q.trim(), answer: a.trim(), sort_order: faqs.length + 1 });
    if (error) return setErr(error.message); setQ(""); setA(""); loadFaqs();
  }
  async function toggle(f: Faq) { await supabase.from("bot_faqs").update({ is_active: !f.is_active }).eq("id", f.id); loadFaqs(); }
  async function remove(f: Faq) { if (confirm("Delete this FAQ?")) { await supabase.from("bot_faqs").delete().eq("id", f.id); loadFaqs(); } }
  const set = (k: keyof Cfg, v: string | boolean) => setCfg({ ...cfg, [k]: v });
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold">Bot Knowledge</h1>
      <p className="text-sm text-slate-500">The website assistant answers only from this text plus your active services (prices, limits and delivery times come straight from Manage Services).</p>
      <div className="card space-y-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cfg.enabled} onChange={(e) => set("enabled", e.target.checked)} />Assistant enabled</label>
        <label className="block text-sm">Greeting<input className="input mt-1" value={cfg.greeting} onChange={(e) => set("greeting", e.target.value)} /></label>
        <label className="block text-sm">Refund policy (write your real policy)<textarea className="input mt-1" rows={4} value={cfg.refund_policy} onChange={(e) => set("refund_policy", e.target.value)} /></label>
        <label className="block text-sm">Delivery notes<textarea className="input mt-1" rows={2} value={cfg.delivery_notes} onChange={(e) => set("delivery_notes", e.target.value)} /></label>
        <label className="block text-sm">Extra information (working hours, rules, etc.)<textarea className="input mt-1" rows={2} value={cfg.extra} onChange={(e) => set("extra", e.target.value)} /></label>
        <button className="btn" onClick={saveCfg}>Save</button>
      </div>
      <div className="card space-y-3">
        <h2 className="font-medium">Questions and answers</h2>
        <input className="input" placeholder="Question" value={q} onChange={(e) => setQ(e.target.value)} />
        <textarea className="input" rows={3} placeholder="Answer" value={a} onChange={(e) => setA(e.target.value)} />
        <button className="btn" onClick={addFaq}>Add FAQ</button>
        <ul className="divide-y text-sm">{faqs.map((f) => (
          <li key={f.id} className="flex items-start justify-between gap-3 py-3"><div className={f.is_active ? "" : "opacity-50"}><div className="font-medium">{f.question}</div><div className="text-slate-600">{f.answer}</div></div>
            <span className="flex gap-3 whitespace-nowrap"><button className="text-brand-600" onClick={() => toggle(f)}>{f.is_active ? "Hide" : "Show"}</button><button className="text-red-600" onClick={() => remove(f)}>Delete</button></span></li>))}</ul>
      </div>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}{msg && <p className="text-sm text-green-700">{msg}</p>}
    </div>
  );
}
