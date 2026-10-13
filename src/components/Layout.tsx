import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useSite } from "../lib/site";
import { supabase } from "../lib/supabase";
import { formatPKR } from "../lib/money";

const customer = [["/dashboard", "Overview"], ["/new-order", "New Order"], ["/services", "Services"], ["/orders", "My Orders"], ["/add-funds", "Add Funds"], ["/wallet", "Wallet History"], ["/support", "Support Tickets"], ["/notifications", "Notifications"], ["/profile", "Profile Settings"]];
const admin = [["/admin", "Admin Dashboard"], ["/admin/orders", "All Orders"], ["/admin/customers", "Customers"], ["/admin/deposits", "Deposit Requests"], ["/admin/services", "Manage Services"], ["/admin/categories", "Categories & Platforms"], ["/admin/payment-settings", "Payment Settings"], ["/admin/tickets", "Support Tickets"], ["/admin/site", "Website Settings"], ["/admin/logs", "Activity Logs"]];

export default function Layout() {
  const { profile, signOut } = useAuth(); const { site } = useSite(); const loc = useLocation();
  const [open, setOpen] = useState(false); const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!profile) return;
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("is_read", false).then((r) => setUnread(r.count ?? 0));
  }, [profile?.id, loc.pathname]);
  const link = ({ isActive }: { isActive: boolean }) => `flex items-center justify-between rounded-lg px-3 py-2 text-sm ${isActive ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-navy-700"}`;
  const Brand = () => <span className="flex items-center gap-2 font-semibold text-white">{site.logo_url && <img src={site.logo_url} alt="" className="h-6 w-6 rounded" />}{site.name}</span>;
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between bg-navy-900 px-4 py-3 text-white md:hidden"><Brand />
        <button aria-label="Menu" onClick={() => setOpen(!open)} className="rounded border border-navy-700 px-3 py-1 text-sm">Menu{unread > 0 ? ` (${unread})` : ""}</button></header>
      <aside className={`${open ? "block" : "hidden"} bg-navy-900 p-4 md:fixed md:inset-y-0 md:left-0 md:block md:w-64 md:overflow-y-auto`}>
        <div className="mb-6 hidden text-lg md:block"><Brand /></div>
        <nav className="space-y-1" onClick={() => setOpen(false)}>
          {customer.map(([to, label]) => <NavLink key={to} to={to} className={link}>{label}{to === "/notifications" && unread > 0 && <span className="rounded-full bg-red-500 px-2 text-xs text-white">{unread}</span>}</NavLink>)}
          {profile?.role === "admin" && <>
            <div className="px-3 pb-1 pt-4 text-xs uppercase tracking-wide text-slate-400">Admin</div>
            {admin.map(([to, label]) => <NavLink key={to} to={to} end={to === "/admin"} className={link}>{label}</NavLink>)}
          </>}
        </nav>
        <div className="mt-6 border-t border-navy-700 pt-4 text-sm text-slate-300">
          <div>{profile?.username} <span className="text-xs text-slate-400">({profile?.role})</span></div>
          <div className="mt-1">{formatPKR(profile?.balance ?? 0)}</div>
          <button onClick={signOut} className="mt-3 text-slate-400 underline hover:text-white">Log out</button>
        </div>
      </aside>
      <main className="p-4 md:ml-64 md:p-8"><Outlet /></main>
    </div>
  );
}
