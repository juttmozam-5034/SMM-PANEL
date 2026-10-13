const COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800", processing: "bg-sky-100 text-sky-800", in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800", partial: "bg-orange-100 text-orange-800", cancelled: "bg-red-100 text-red-800",
  refunded: "bg-slate-200 text-slate-700", active: "bg-green-100 text-green-800", inactive: "bg-slate-200 text-slate-700", archived: "bg-red-100 text-red-800",
};
export default function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[status] ?? "bg-slate-100"}`}>{status.replace("_", " ")}</span>;
}
