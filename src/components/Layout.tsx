import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { formatPKR } from "../lib/money";

const customer = [["/dashboard", "Overview"], ["/new-order", "New Order"], ["/services", "Services"], ["/orders", "My Orders"], ["/add-funds", "Add Funds"], ["/wallet", "Wallet History"]];
const admin = [["/admin", "Admin Dashboard"], ["/admin/orders", "All Orders"], ["/admin/customers", "Customers"], ["/admin/deposits", "Deposit Requests"], ["/admin/services", "Manage Services"], ["/admin/categories", "Categories & Platforms"], ["/admin/payment-settings", "Payment Settings"]];

export default function Layout() {
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const link = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-3 py-2 text-sm ${isActive ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-navy-700"}`;
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between bg-navy-900 px-4 py-3 text-white md:hidden">
        <b>SocialBoost</b>
        <button aria-label="Menu" onClick={() => setOpen(!open)} className="rounded border border-navy-700 px-3 py-1 text-sm">Menu</button>
      </header>
      <aside className={`${open ? "block" : "hidden"} bg-navy-900 p-4 md:fixed md:inset-y-0 md:left-0 md:block md:w-64`}>
        <div className="mb-6 hidden text-lg font-semibold text-white md:block">SocialBoost</div>
        <nav className="space-y-1" onClick={() => setOpen(false)}>
          {customer.map(([to, label]) => <NavLink key={to} to={to} className={link}>{label}</NavLink>)}
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
