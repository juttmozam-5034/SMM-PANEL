import { useEffect, useRef, useState } from "react";
import { loadBotData } from "../lib/botData";
import { answer, CHIPS, type BotData } from "../lib/botEngine";
import { useSite } from "../lib/site";
type Msg = { role: "user" | "bot"; text: string; chips?: string[] };
const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";

export default function ChatWidget() {
  const { site } = useSite();
  const [data, setData] = useState<BotData | null>(null);
  const [open, setOpen] = useState(false); const [msgs, setMsgs] = useState<Msg[]>([]); const [input, setInput] = useState(""); const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { loadBotData().then(setData).catch(() => setData(null)); }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy, open]);
  const botOn = !!data?.enabled; const wa = site.whatsapp_number;
  if (!botOn && !wa) return null;

  function send(text: string) {
    const t = text.trim(); if (!t || busy || !data) return;
    setMsgs((m) => [...m, { role: "user", text: t }]); setInput(""); setBusy(true);
    const r = answer(t, data);
    setTimeout(() => { setMsgs((m) => [...m, { role: "bot", text: r.text, chips: r.chips }]); setBusy(false); }, 350);
  }
  const lastChips = msgs.length && msgs[msgs.length - 1].role === "bot" ? msgs[msgs.length - 1].chips : undefined;
  const Chips = ({ list }: { list: string[] }) => <div className="flex flex-wrap gap-2">{list.map((c) => <button key={c} onClick={() => send(c)} className="rounded-full border px-3 py-1 text-xs hover:bg-slate-50">{c}</button>)}</div>;
  const waHref = `https://wa.me/${wa}?text=${encodeURIComponent(`Hello ${site.name}, I need help.`)}`;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {botOn && open && data && (
        <div className="flex h-[28rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
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
      {wa && <a href={waHref} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp" title="Chat on WhatsApp"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] shadow-lg hover:brightness-95"><svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden="true"><path d={WA_PATH} /></svg></a>}
      {botOn && <button onClick={() => setOpen(!open)} aria-label={open ? "Close assistant" : "Open support assistant"} title="Chat with our assistant"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700">
        {open ? <span className="text-lg leading-none">✕</span> : <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 8V5" /><circle cx="12" cy="3.8" r="1.2" fill="white" stroke="none" />
          <circle cx="9" cy="13" r="1.3" fill="white" stroke="none" /><circle cx="15" cy="13" r="1.3" fill="white" stroke="none" /><path d="M9.5 17h5" /><path d="M2 13v3M22 13v3" /></svg>}
      </button>}
    </div>
  );
}
