import { useEffect, useRef, useState } from "react";
import { loadBotData } from "../lib/botData";
import { answer, CHIPS, type BotData } from "../lib/botEngine";
type Msg = { role: "user" | "bot"; text: string; chips?: string[] };
export default function ChatWidget() {
  const [data, setData] = useState<BotData | null>(null);
  const [open, setOpen] = useState(false); const [msgs, setMsgs] = useState<Msg[]>([]); const [input, setInput] = useState(""); const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { loadBotData().then(setData).catch(() => setData(null)); }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy, open]);
  if (!data?.enabled) return null;

  function send(text: string) {
    const t = text.trim(); if (!t || busy || !data) return;
    setMsgs((m) => [...m, { role: "user", text: t }]); setInput(""); setBusy(true);
    const r = answer(t, data);
    setTimeout(() => { setMsgs((m) => [...m, { role: "bot", text: r.text, chips: r.chips }]); setBusy(false); }, 350);
  }
  const lastChips = msgs.length && msgs[msgs.length - 1].role === "bot" ? msgs[msgs.length - 1].chips : undefined;
  const Chips = ({ list }: { list: string[] }) => <div className="flex flex-wrap gap-2">{list.map((c) => <button key={c} onClick={() => send(c)} className="rounded-full border px-3 py-1 text-xs hover:bg-slate-50">{c}</button>)}</div>;
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between bg-navy-900 px-4 py-3 text-sm font-medium text-white">Support assistant<button aria-label="Close" onClick={() => setOpen(false)}>✕</button></div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            <div className="max-w-[90%] rounded-lg bg-slate-100 p-2">{data.greeting || "Hi! How can I help?"}</div>
            {msgs.length === 0 && <Chips list={CHIPS} />}
            {msgs.map((m, i) => <div key={i} className={`max-w-[90%] whitespace-pre-wrap rounded-lg p-2 ${m.role === "user" ? "ml-auto bg-brand-600 text-white" : "bg-slate-100"}`}>{m.text}</div>)}
            {!busy && lastChips && <Chips list={lastChips} />}
            {busy && <div className="max-w-[90%] rounded-lg bg-slate-100 p-2 text-slate-500">Typing…</div>}
            <div ref={end} />
          </div>
          <form className="flex gap-2 border-t p-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <input className="input" maxLength={300} placeholder="Type your question" value={input} onChange={(e) => setInput(e.target.value)} />
            <button className="btn" disabled={busy || !input.trim()}>Send</button>
          </form>
          <p className="px-3 pb-2 text-[11px] text-slate-400">Automatic assistant. It cannot see your account. Never share passwords, PINs or OTPs.</p>
        </div>)}
      <button onClick={() => setOpen(!open)} className="ml-auto flex h-12 items-center rounded-full bg-brand-600 px-5 text-sm font-medium text-white shadow-lg hover:bg-brand-700">{open ? "Close" : "Ask us"}</button>
    </div>
  );
}
