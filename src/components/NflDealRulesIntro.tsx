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

function dynastyRulesFor(teamName: string): string[] {
  return [
    `${teamName} needs five cornerstone picks: QB, RB, WR, TE, and D/ST.`,
    'Each stage is its own Deal or No Deal board.',
    'Whatever player or defense you finish with gets locked onto your roster.',
    'After the final stage, we simulate the season and reveal your record.',
    'Build the team. Beat the Bank.',
  ];
}

interface Props {
  onComplete: () => void;
  label: string;
  pluralLabel: string;
  variant?: 'single' | 'dynasty';
  teamName?: string;
}

export default function NflDealRulesIntro({ onComplete, label, pluralLabel, variant = 'single', teamName = 'Your Dynasty' }: Props) {
  const [index, setIndex] = useState(0);
  const RULES = variant === 'dynasty' ? dynastyRulesFor(teamName) : rulesFor(label, pluralLabel);

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
