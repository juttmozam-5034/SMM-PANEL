import { useEffect, useRef } from "react";
export default function Toast({ message, action, onClose }: { message: string; action?: { label: string; href: string }; onClose: () => void }) {
  const ref = useRef(onClose); ref.current = onClose;
  useEffect(() => { const t = setTimeout(() => ref.current(), 12000); return () => clearTimeout(t); }, []);
  return (
    <div role="status" className="slide-down fixed right-4 top-4 z-[60] w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-green-200 bg-white p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">✓</span>
        <div className="min-w-0 flex-1 text-sm"><p className="font-medium text-slate-900">{message}</p>
          {action && <a href={action.href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white hover:brightness-95">{action.label}</a>}</div>
        <button aria-label="Close" onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
      </div>
    </div>
  );
}
