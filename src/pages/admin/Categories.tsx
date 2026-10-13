import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import StatusBadge from "../../components/StatusBadge";
type Row = { id: string; name: string; is_active: boolean };
function Manager({ table, title }: { table: "platforms" | "service_categories"; title: string }) {
  const [rows, setRows] = useState<Row[]>([]); const [name, setName] = useState(""); const [err, setErr] = useState("");
  const load = () => supabase.from(table).select("id,name,is_active").order("name").then(({ data }) => setRows((data ?? []) as Row[]));
  useEffect(() => { load(); }, []);
  async function add() {
    setErr(""); if (name.trim().length < 2) return setErr("Enter a name (at least 2 characters).");
    const { error } = await supabase.from(table).insert({ name: name.trim() });
    if (error) return setErr(error.message.includes("duplicate") ? "That name already exists." : error.message);
    setName(""); load();
  }
  async function toggle(r: Row) { await supabase.from(table).update({ is_active: !r.is_active }).eq("id", r.id); load(); }
  return (
    <div className="card space-y-3">
      <h2 className="font-semibold">{title}</h2>
      <div className="flex gap-2"><input className="input" placeholder={`New ${title.toLowerCase().replace(/s$/, "")} name`} value={name} onChange={(e) => setName(e.target.value)} /><button className="btn" onClick={add}>Add</button></div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <ul className="divide-y text-sm">{rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between py-2"><span>{r.name}</span>
          <span className="flex items-center gap-3"><StatusBadge status={r.is_active ? "active" : "inactive"} />
            <button className="text-brand-600" onClick={() => toggle(r)}>{r.is_active ? "Deactivate" : "Activate"}</button></span></li>))}</ul>
    </div>
  );
}
export default function Categories() {
  return <div className="space-y-4"><h1 className="text-xl font-semibold">Categories & Platforms</h1>
    <div className="grid gap-4 lg:grid-cols-2"><Manager table="service_categories" title="Categories" /><Manager table="platforms" title="Platforms" /></div></div>;
}
