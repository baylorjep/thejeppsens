'use client';

import { useEffect, useState } from 'react';

const STEP_MS = 5000;

function rulesFor(label: string, pluralLabel: string): string[] {
  return [
    `32 sealed cases. Each one hides an NFL ${label.toLowerCase()}.`,
    "Pick one case to keep sealed: It's yours until the end.",
    `Open the rest to knock ${pluralLabel} off the board.`,
    'After every round, the Bank makes you an offer.',
    'Deal… or No Deal?',
  ];
}

interface Props {
  onComplete: () => void;
  label: string;
  pluralLabel: string;
}

export default function NflDealRulesIntro({ onComplete, label, pluralLabel }: Props) {
  const [index, setIndex] = useState(0);
  const RULES = rulesFor(label, pluralLabel);

  useEffect(() => {
    if (index < RULES.length - 1) {
      const t = setTimeout(() => setIndex((i) => i + 1), STEP_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(onComplete, STEP_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function advance() {
    if (index < RULES.length - 1) setIndex((i) => i + 1);
    else onComplete();
  }

  return (
    <div
      onClick={advance}
      className="flex min-h-screen cursor-pointer flex-col items-center justify-center px-6 text-center"
    >
      <p key={index} className="animate-case-reveal max-w-2xl text-2xl font-bold leading-snug text-slate-100 sm:text-4xl">
        {RULES[index]}
      </p>
    </div>
  );
}
