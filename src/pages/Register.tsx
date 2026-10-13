import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
export default function Register() {
  const [username, setUsername] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [ok, setOk] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setOk("");
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) return setError("Username: 3-30 letters, numbers or _");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password,
      options: { data: { username }, emailRedirectTo: window.location.origin + "/dashboard" } });
    setBusy(false);
    if (error) return setError(error.message);
    setOk(data.session ? "Account created. You are logged in." : "Account created. Check your email to confirm, then log in.");
  }
  return (
    <main className="mx-auto mt-24 max-w-sm px-4">
      <form onSubmit={submit} className="card space-y-4">
        <h1 className="text-xl font-semibold">Create account</h1>
        <input className="input" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="input" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password (min 8 characters)" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {ok && <p className="text-sm text-green-700">{ok}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        <p className="text-sm text-slate-500">Already registered? <Link to="/login" className="text-brand-600">Log in</Link></p>
      </form>
    </main>
  );
}
