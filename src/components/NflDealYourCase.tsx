export default function NflDealYourCase({ number }: { number: number }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-500/10 to-slate-900 px-4 py-3 shadow-[0_0_24px_rgba(251,191,36,0.15)]">
      <div className="relative h-16 w-20 shrink-0">
        <div className="absolute -top-2 left-1/2 h-2.5 w-8 -translate-x-1/2 rounded-t-md border-2 border-b-0 border-amber-300/70" />
        <div className="animate-pulse-glow relative flex h-full w-full items-center justify-center rounded-md border-2 border-amber-400/70 bg-gradient-to-b from-amber-500/15 to-slate-900">
          <div className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-amber-300/30" />
          <div className="absolute left-1/2 top-1/2 h-4 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-amber-400/25" />
          <span className="relative text-xl font-black text-amber-200">{number}</span>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">Your case</p>
        <p className="text-sm text-slate-300">Sealed until the end.</p>
      </div>
    </div>
  );
}
