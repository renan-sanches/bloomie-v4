"use client";

import { useState } from "react";

interface GlossaryTooltipProps {
  term: string;
  definition: string;
  children: React.ReactNode;
}

export function GlossaryTooltip({ term, definition, children }: GlossaryTooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="border-b border-dashed border-brand-green cursor-help">
        {children}
      </span>
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white rounded-[16px] shadow-[0px_4px_24px_rgba(0,0,0,0.12)] p-3 z-50 text-sm pointer-events-none">
          <p className="font-bold text-brand-carbon">{term}</p>
          <p className="text-brand-carbon/60 text-xs mt-1">{definition}</p>
        </div>
      )}
    </span>
  );
}
