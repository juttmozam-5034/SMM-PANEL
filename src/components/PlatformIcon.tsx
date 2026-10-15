import { useSite } from "../lib/site";
// Simple brand-style icons drawn as inline SVG (no external images). Admin can hide them in Website Settings.
export default function PlatformIcon({ name, size = 24 }: { name: string; size?: number }) {
  const { site } = useSite();
  if (!site.show_logos) return null;
  const n = name.toLowerCase();
  const kind = n.includes("youtube") ? "yt" : n.includes("facebook") ? "fb" : n.includes("instagram") ? "ig" : n.includes("tiktok") ? "tt" : n.includes("telegram") ? "tg" : (n.includes("twitter") || n.trim() === "x" || n.startsWith("x/")) ? "x" : "other";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={name} className="shrink-0">
      {kind === "yt" && <><rect width="32" height="32" rx="8" fill="#FF0000" /><path d="M13 10.5v11l9.5-5.5z" fill="#fff" /></>}
      {kind === "fb" && <><rect width="32" height="32" rx="8" fill="#1877F2" /><path d="M17.5 27v-9.5h3.1l.5-3.7h-3.6v-2.3c0-1.1.3-1.8 1.8-1.8h1.9V6.4c-.3 0-1.5-.1-2.8-.1-2.7 0-4.6 1.7-4.6 4.7v2.8H11v3.7h2.8V27z" fill="#fff" /></>}
      {kind === "ig" && <><defs><linearGradient id="igg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#FEDA75" /><stop offset=".3" stopColor="#FA7E1E" /><stop offset=".55" stopColor="#D62976" /><stop offset=".8" stopColor="#962FBF" /><stop offset="1" stopColor="#4F5BD5" /></linearGradient></defs>
        <rect width="32" height="32" rx="8" fill="url(#igg)" /><rect x="8" y="8" width="16" height="16" rx="5" fill="none" stroke="#fff" strokeWidth="2" /><circle cx="16" cy="16" r="3.8" fill="none" stroke="#fff" strokeWidth="2" /><circle cx="20.8" cy="11.2" r="1.2" fill="#fff" /></>}
      {kind === "tt" && <><rect width="32" height="32" rx="8" fill="#000" />
        <g fill="none" strokeWidth="2.6" strokeLinecap="round"><path d="M16.2 7.5v12.2a3.5 3.5 0 1 1-3.5-3.5M16.2 7.5c.4 2.5 2 4.2 4.8 4.4" stroke="#25F4EE" transform="translate(-1 -.5)" /><path d="M16.2 7.5v12.2a3.5 3.5 0 1 1-3.5-3.5M16.2 7.5c.4 2.5 2 4.2 4.8 4.4" stroke="#FE2C55" transform="translate(1 .5)" /><path d="M16.2 7.5v12.2a3.5 3.5 0 1 1-3.5-3.5M16.2 7.5c.4 2.5 2 4.2 4.8 4.4" stroke="#fff" /></g></>}
      {kind === "tg" && <><rect width="32" height="32" rx="8" fill="#229ED9" /><path d="M25.5 7.5L6.5 14.8l5.4 2 2.1 6.4 3.2-3.6 5 3.8z" fill="#fff" /></>}
      {kind === "x" && <><rect width="32" height="32" rx="8" fill="#000" /><path d="M9.5 9.5l13 13M22.5 9.5l-13 13" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" /></>}
      {kind === "other" && <><rect width="32" height="32" rx="8" fill="#6d5ef7" /><g fill="none" stroke="#fff" strokeWidth="1.8"><circle cx="16" cy="16" r="8" /><ellipse cx="16" cy="16" rx="3.6" ry="8" /><path d="M8 16h16" /></g></>}
    </svg>
  );
}
