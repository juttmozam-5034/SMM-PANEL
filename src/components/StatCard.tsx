import type { ReactNode } from "react";
import { useCountUp } from "../lib/useCountUp";
const TONES = {
  violet: { chip: "bg-violet-100 text-violet-600", bar: "from-violet-500 to-fuchsia-500" },
  blue: { chip: "bg-blue-100 text-blue-600", bar: "from-blue-500 to-cyan-400" },
  amber: { chip: "bg-amber-100 text-amber-600", bar: "from-amber-500 to-orange-400" },
  green: { chip: "bg-green-100 text-green-600", bar: "from-green-500 to-emerald-400" },
  rose: { chip: "bg-rose-100 text-rose-600", bar: "from-rose-500 to-pink-400" },
  slate: { chip: "bg-slate-200 text-slate-600", bar: "from-slate-500 to-slate-400" },
};
export type Tone = keyof typeof TONES;
const svg = (d: string) => <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
export const Icons = {
  wallet: svg("M3 7h15a3 3 0 0 1 3 3v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l2-3h11M17 14h.01"),
  orders: svg("M6 2h12l2 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zM4 6h16M9 11h6M9 15h4"),
  clock: svg("M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"),
  check: svg("M20 6L9 17l-5-5"),
  users: svg("M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 21v-2a4 4 0 0 0-3-3.9"),
  cross: svg("M18 6L6 18M6 6l12 12"),
  coin: svg("M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"),
  refund: svg("M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"),
  inbox: svg("M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"),
};
export default function StatCard({ label, value, format, icon, tone = "violet", note }: { label: string; value: number | string; format?: (n: number) => string; icon: ReactNode; tone?: Tone; note?: string }) {
  const animated = useCountUp(typeof value === "number" ? value : 0);
  const shown = typeof value === "number" ? (format ? format(animated) : String(Math.round(animated))) : value;
  const t = TONES[tone];
  return (
    <div className="hover-lift relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${t.bar}`} />
      <div className="flex items-start justify-between gap-3">
        <div><div className="text-sm text-slate-500">{label}</div><div className="mt-1 text-2xl font-semibold tabular-nums">{shown}</div>{note && <div className="mt-1 text-xs text-slate-400">{note}</div>}</div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${t.chip}`}>{icon}</div>
      </div>
    </div>
  );
}
