import { useAuth } from "../auth/AuthProvider";
import { formatPKR } from "../lib/money";
export default function Dashboard() {
  const { profile, signOut } = useAuth();
  if (!profile) return <p className="p-8">Profile not found. Try logging out and in again.</p>;
  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="card space-y-2">
        <h1 className="text-xl font-semibold">Welcome, {profile.username}</h1>
        <p>Role: <b>{profile.role}</b></p>
        <p>Wallet balance: {formatPKR(profile.balance)}</p>
        <button className="btn mt-4" onClick={signOut}>Log out</button>
      </div>
    </main>
  );
}
