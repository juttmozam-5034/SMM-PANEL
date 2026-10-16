import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Brand from "../components/Brand";
export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError(error.message.includes("Email not confirmed") ? "Please confirm your email first." : "Email or password is incorrect.");
    else nav("/dashboard");
  }
  return (
    <main className="mx-auto mt-16 max-w-sm px-4">
      <div className="mb-5 flex justify-center"><Brand dark size="h-12 w-12" /></div>
      <form onSubmit={submit} className="card space-y-4">
        <h1 className="text-xl font-semibold">Log in</h1>
        <input className="input" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
        <p className="text-sm text-slate-500"><Link to="/register" className="text-brand-600">Create account</Link> · <Link to="/forgot-password" className="text-brand-600">Forgot password</Link></p>
      </form>
    </main>
  );
}
