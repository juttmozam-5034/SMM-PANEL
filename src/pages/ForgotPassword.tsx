import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
export default function ForgotPassword() {
  const [email, setEmail] = useState(""); const [msg, setMsg] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + "/login" });
    setMsg("If that email exists, a reset link has been sent.");
  }
  return (
    <main className="mx-auto mt-24 max-w-sm px-4">
      <form onSubmit={submit} className="card space-y-4">
        <h1 className="text-xl font-semibold">Reset password</h1>
        <input className="input" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        <button className="btn w-full">Send reset link</button>
        <p className="text-sm"><Link to="/login" className="text-brand-600">Back to login</Link></p>
      </form>
    </main>
  );
}
