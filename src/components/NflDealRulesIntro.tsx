'use client';

import { useEffect, useState } from 'react';

const RULES = [
  '32 sealed cases. Each one hides an NFL quarterback.',
  "Pick one case to keep sealed — it's yours until the end.",
  'Open the rest to knock QBs off the board.',
  'After every round, the Bank makes you an offer.',
  'Deal… or No Deal?',
];

const STEP_MS = 1800;

export default function NflDealRulesIntro() {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    if (visibleCount >= RULES.length) return;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [visibleCount]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      {RULES.slice(0, visibleCount).map((line, i) => (
        <p key={i} className="animate-case-reveal text-lg font-semibold text-slate-200 sm:text-xl">
          {line}
        </p>
      ))}
    </div>
  );
}
