"use client";

import type { ReactNode } from "react";

type Props = {
  label: string;
  value: string;
  valueSuffix?: string;
  badge?: string;
  /** 0..100 */
  ratio?: number;
  footer?: ReactNode;
};

/**
 * Bracket frame card inspired by image 4.
 * - Corner brackets on a hairline border.
 * - Big tabular value, a thin progress meter, and a footer slot.
 */
export default function BracketCard({
  label,
  value,
  valueSuffix,
  badge,
  ratio = 0,
  footer,
}: Props) {
  const pct = Math.max(0, Math.min(100, ratio));
  return (
    <div className="relative">
      <div className="bracket-frame relative rounded-[6px] border border-white/[0.08] bg-[#0a0a0a] p-4">
        <span className="bracket-tr" />
        <span className="bracket-bl" />

        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</p>
          {badge ? (
            <span className="inline-flex items-center rounded-[3px] border border-[#F5C518]/30 bg-[#F5C518]/[0.08] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#F5C518]">
              {badge}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-[32px] font-semibold leading-none tracking-tight text-white tabular">
            {value}
          </span>
          {valueSuffix ? (
            <span className="text-[14px] font-medium text-white/55">{valueSuffix}</span>
          ) : null}
        </div>

        {/* progress bar */}
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background:
                pct < 40
                  ? "linear-gradient(90deg, #F5C518, #FF5C1F)"
                  : "linear-gradient(90deg, #FF5C1F, #FFD84D)",
            }}
          />
        </div>

        {/* dashed gauge ticks */}
        <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-white/30 tabular">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>

        {footer ? <div className="mt-3 border-t border-white/[0.06] pt-3">{footer}</div> : null}
      </div>
    </div>
  );
}
