import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { useSite } from "../lib/site";
import ChatWidget from "../components/ChatWidget";
import PlatformIcon from "../components/PlatformIcon";
type S = { platform_id: string; category_id: string };
type N = { id: string; name: string };

// Slides up from below when it scrolls into view.
function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null); const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (!("IntersectionObserver" in window)) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${on ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}
// Hero card that slides to the next service every 3 seconds (pauses on hover).
function HeroSlider({ items }: { items: { name: string; kinds: string[] }[] }) {
  const [i, setI] = useState(0); const [paused, setPaused] = useState(false);
  useEffect(() => { setI(0); }, [items.length]);
  useEffect(() => {
    if (paused || items.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 3000);
    return () => clearInterval(t);
  }, [paused, items.length, i]);
  if (items.length === 0) return null;
  const cur = items[i % items.length];
  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur">
      <div key={i} className="slide-in-right flex min-h-[10.5rem] flex-col items-center justify-center text-center">
        <PlatformIcon name={cur.name} size={72} />
        <h3 className="mt-4 text-xl font-semibold">{cur.name}</h3>
        <p className="mt-1 text-sm text-slate-200">{cur.kinds.length ? `Get ${cur.name} ${cur.kinds.join(", ")}` : `Get ${cur.name} services`}</p>
      </div>
      <div className="mt-4 flex justify-center gap-2">{items.map((it, k) => (
        <button key={it.name} aria-label={`Show ${it.name}`} onClick={() => setI(k)} className={`h-2 rounded-full transition-all ${k === i ? "w-6 bg-white" : "w-2 bg-white/40"}`} />))}</div>
      {!paused && items.length > 1 && <div key={`p${i}`} className="progress-3s absolute inset-x-0 bottom-0 h-1 origin-left bg-brand-500" />}
    </div>
  );
}
const ico = (d: string) => <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const I = {
  userPlus: ico("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6"),
  wallet: ico("M3 7h15a3 3 0 0 1 3 3v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l2-3h11M17 14h.01"),
  cart: ico("M6 6h15l-1.5 9h-12zM6 6L5 3H2M9 20h.01M18 20h.01"),
  chart: ico("M3 3v18h18M7 14l4-4 3 3 5-6"),
  tag: ico("M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01"),
  shield: ico("M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5zM9 12l2 2 4-4"),
  headset: ico("M3 14v-2a9 9 0 0 1 18 0v2M3 14h3v5H4a1 1 0 0 1-1-1zM21 14h-3v5h2a1 1 0 0 0 1-1z"),
};
const TONE = { violet: "bg-violet-100 text-violet-600", blue: "bg-blue-100 text-blue-600", amber: "bg-amber-100 text-amber-600", green: "bg-green-100 text-green-600", rose: "bg-rose-100 text-rose-600" };
const STEPS: { t: string; d: string; icon: ReactNode; tone: keyof typeof TONE }[] = [
  { t: "Register", d: "Create your free account.", icon: I.userPlus, tone: "violet" },
  { t: "Add funds", d: "Pay by EasyPaisa or JazzCash. An admin verifies your payment manually, then your wallet is credited.", icon: I.wallet, tone: "blue" },
  { t: "Place an order", d: "Pick a service, paste your link and choose a quantity.", icon: I.cart, tone: "amber" },
  { t: "Track status", d: "Follow your order from pending to completed in your account.", icon: I.chart, tone: "green" },
];
const WHY: { t: string; d: string; icon: ReactNode; tone: keyof typeof TONE }[] = [
  { t: "Clear pricing", d: "Price per 1000 in PKR. The total is shown before you confirm.", icon: I.tag, tone: "violet" },
  { t: "Private wallet", d: "Every account has its own wallet with a full transaction history.", icon: I.shield, tone: "green" },
  { t: "Human support", d: "Open a ticket and our team replies inside your account.", icon: I.headset, tone: "rose" },
];
const HERO_ICONS = ["YouTube", "Instagram", "TikTok", "Facebook", "Telegram", "X"];

export default function Landing() {
  const { site } = useSite(); const { session } = useAuth();
  const [services, setServices] = useState<S[]>([]); const [pl, setPl] = useState<N[]>([]); const [cats, setCats] = useState<N[]>([]);
  useEffect(() => {
    Promise.all([
      supabase.from("services").select("platform_id,category_id").eq("status", "active").limit(500),
      supabase.from("platforms").select("id,name").order("sort_order").order("name"),
      supabase.from("service_categories").select("id,name").order("name"),
    ]).then(([s, p, c]) => { setServices((s.data ?? []) as S[]); setPl((p.data ?? []) as N[]); setCats((c.data ?? []) as N[]); });
  }, []);
  const groups = pl.map((p) => {
    const ids = new Set(services.filter((s) => s.platform_id === p.id).map((s) => s.category_id));
    return { p, kinds: cats.filter((c) => ids.has(c.id)).map((c) => c.name) };
  }).filter((g) => g.kinds.length > 0);
  const slides = groups.length ? groups.map((g) => ({ name: g.p.name, kinds: g.kinds })) : HERO_ICONS.map((n) => ({ name: n, kinds: [] as string[] }));
  const delay = (s: number) => ({ animationDelay: `${s}s` });
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <header className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 text-white">
        <div className="slide-down mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="flex items-center gap-2 text-lg font-semibold">{site.logo_url && <img src={site.logo_url} alt="" className="h-7 w-7 rounded" />}{site.name}</span>
          <nav className="flex gap-3 text-sm">{session ? <Link className="btn" to="/dashboard">Dashboard</Link> : <><Link className="rounded-lg px-3 py-2 hover:bg-navy-700" to="/login">Log in</Link><Link className="btn" to="/register">Register</Link></>}</nav></div>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-14 md:grid-cols-[1fr_auto]">
          <div>
            <h1 className="slide-down max-w-2xl text-4xl font-bold leading-tight" style={delay(0.1)}>Social media marketing services, managed from one wallet.</h1>
            <p className="slide-down mt-4 max-w-xl text-slate-300" style={delay(0.25)}>Add funds, choose a service, place your order and track its status. Orders are processed manually by our team.</p>
            <div className="slide-down mt-8 flex gap-3" style={delay(0.4)}><Link className="btn" to={session ? "/new-order" : "/register"}>{session ? "Place an order" : "Create free account"}</Link>{!session && <Link className="rounded-lg border border-navy-700 px-4 py-2 text-sm hover:bg-navy-700" to="/login">Log in</Link>}</div>
          </div>
          <div className="slide-down w-full md:w-80" style={delay(0.4)}><HeroSlider items={slides} /></div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <Reveal><h2 className="text-2xl font-semibold">Our services</h2><p className="mt-1 text-slate-500">Log in to see prices and place an order.</p></Reveal>
        {groups.length === 0 ? <p className="mt-4 text-slate-500">Services will be listed here soon.</p> : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{groups.map(({ p, kinds }, i) => (
            <Reveal key={p.id} delay={(i % 3) * 120}>
              <div className="card hover-lift group flex items-center gap-4"><span className="icon-pop"><PlatformIcon name={p.name} size={56} /></span>
                <div className="min-w-0"><h3 className="font-semibold">{p.name}</h3><p className="mt-1 text-sm text-slate-600">Get {p.name} {kinds.join(", ")}</p></div></div>
            </Reveal>))}</div>)}
      </section>

      <section className="bg-slate-50 py-14"><div className="mx-auto max-w-6xl px-4">
        <Reveal><h2 className="text-2xl font-semibold">How it works</h2></Reveal>
        <div className="mt-6 grid gap-4 md:grid-cols-4">{STEPS.map((s, i) => (
          <Reveal key={s.t} delay={i * 130}>
            <div className="card hover-lift group relative h-full">
              <span className="absolute right-4 top-4 text-3xl font-bold text-slate-100">{i + 1}</span>
              <div className={`icon-pop flex h-12 w-12 items-center justify-center rounded-xl ${TONE[s.tone]}`}>{s.icon}</div>
              <h3 className="mt-4 font-medium">{s.t}</h3><p className="mt-2 text-sm text-slate-600">{s.d}</p></div>
          </Reveal>))}</div></div></section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <Reveal><h2 className="text-2xl font-semibold">Why use us</h2></Reveal>
        <div className="mt-6 grid gap-4 md:grid-cols-3">{WHY.map((w, i) => (
          <Reveal key={w.t} delay={i * 130}>
            <div className="card hover-lift group h-full"><div className={`icon-pop flex h-12 w-12 items-center justify-center rounded-xl ${TONE[w.tone]}`}>{w.icon}</div>
              <h3 className="mt-4 font-medium">{w.t}</h3><p className="mt-2 text-sm text-slate-600">{w.d}</p></div>
          </Reveal>))}</div>
      </section>

      {!session && <section className="mx-auto max-w-6xl px-4 pb-16"><Reveal>
        <div className="hero rounded-2xl p-8 text-center text-white shadow-lg"><h2 className="text-2xl font-bold">Ready to get started?</h2>
          <p className="mt-2 text-white/80">Create a free account, add funds and place your first order.</p>
          <Link to="/register" className="pulse-ring mt-5 inline-block rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-brand-700 transition hover:-translate-y-0.5">Create free account</Link></div>
      </Reveal></section>}

      <ChatWidget />
      <footer className="bg-navy-900 py-8 text-sm text-slate-300"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
        <span>© {new Date().getFullYear()} {site.name}</span>
        <span className="flex flex-wrap gap-4">{site.support_contact && <span>Support: {site.support_contact}</span>}{site.footer_links.map((l) => <a key={l.url + l.label} href={l.url} className="underline">{l.label}</a>)}</span></div></footer>
    </div>
  );
}
