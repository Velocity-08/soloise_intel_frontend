"use client";

import { useMemo, useRef, useState } from "react";

export type ChartBucket = {
  label: string;
  t0: number;
  t1: number;
  success: number;
  error: number;
};

type Props = {
  buckets: ChartBucket[];
  height?: number;
};

/**
 * Pixel-style stacked bar chart (image 3 vibe).
 * - Pure SVG, no deps.
 * - Hover any column for a tooltip with details.
 * - Orange = success, yellow = errors.
 */
export default function UsageChart({ buckets, height = 220 }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [mouseX, setMouseX] = useState(0);

  const max = useMemo(() => {
    const m = Math.max(1, ...buckets.map((b) => b.success + b.error));
    // round up to a "nice" number for grid lines
    const pow = Math.pow(10, Math.floor(Math.log10(m)));
    return Math.ceil(m / pow) * pow;
  }, [buckets]);

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  const padL = 28;
  const padR = 8;
  const padT = 14;
  const padB = 22;

  const wDefault = 880; // viewBox width; SVG scales to container
  const innerW = wDefault - padL - padR;
  const innerH = height - padT - padB;
  const colCount = buckets.length || 1;
  const colW = innerW / colCount;
  const barW = Math.max(2, Math.min(colW * 0.74, 28));
  const total = buckets.reduce((sum, b) => sum + b.success + b.error, 0);
  const totalSuccess = buckets.reduce((sum, b) => sum + b.success, 0);
  const totalError = buckets.reduce((sum, b) => sum + b.error, 0);

  function onMove(e: React.MouseEvent<SVGRectElement>, index: number) {
    setHover(index);
    if (wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      setMouseX(e.clientX - rect.left);
    }
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-white/55">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-[2px] bg-[#FF5C1F]" />
          Success
          <span className="tabular text-white/75">{totalSuccess.toLocaleString()}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-[2px] bg-[#F5C518]" />
          Error
          <span className="tabular text-white/75">{totalError.toLocaleString()}</span>
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-white/40">
          Total
          <span className="tabular text-white/85">{total.toLocaleString()}</span>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${wDefault} ${height}`}
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="bar-success" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF7A2D" />
            <stop offset="100%" stopColor="#FF5C1F" />
          </linearGradient>
          <linearGradient id="bar-error" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD84D" />
            <stop offset="100%" stopColor="#F5C518" />
          </linearGradient>
        </defs>

        {/* Y grid */}
        {gridLines.map((g, i) => {
          const y = padT + innerH * (1 - g);
          const valueAt = Math.round(max * g);
          return (
            <g key={i}>
              <line
                x1={padL}
                x2={wDefault - padR}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
                strokeDasharray={i === 0 ? "0" : "2 3"}
              />
              <text
                x={padL - 6}
                y={y + 3}
                fontSize="9"
                textAnchor="end"
                fill="rgba(255,255,255,0.35)"
                fontFamily="var(--font-geist-mono), ui-monospace, monospace"
              >
                {valueAt}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {buckets.map((b, i) => {
          const total = b.success + b.error;
          const x = padL + i * colW + (colW - barW) / 2;
          const colCenter = padL + i * colW + colW / 2;
          const totalH = (total / max) * innerH;
          const successH = (b.success / max) * innerH;
          const errorH = (b.error / max) * innerH;
          const isHover = hover === i;

          return (
            <g key={i}>
              {/* invisible hover column for nice UX */}
              <rect
                x={padL + i * colW}
                y={padT}
                width={colW}
                height={innerH}
                fill="transparent"
                onMouseEnter={(e) => onMove(e, i)}
                onMouseMove={(e) => onMove(e, i)}
              />

              {isHover ? (
                <line
                  x1={colCenter}
                  x2={colCenter}
                  y1={padT}
                  y2={padT + innerH}
                  stroke="rgba(255,255,255,0.12)"
                  strokeDasharray="2 2"
                />
              ) : null}

              {/* error stack on top of success */}
              {total > 0 ? (
                <>
                  <rect
                    x={x}
                    y={padT + innerH - totalH}
                    width={barW}
                    height={errorH}
                    fill="url(#bar-error)"
                    opacity={isHover ? 1 : 0.85}
                    rx={1}
                  />
                  <rect
                    x={x}
                    y={padT + innerH - successH}
                    width={barW}
                    height={successH}
                    fill="url(#bar-success)"
                    opacity={isHover ? 1 : 0.92}
                    rx={1}
                  />
                </>
              ) : (
                <rect
                  x={x}
                  y={padT + innerH - 2}
                  width={barW}
                  height={2}
                  fill="rgba(255,255,255,0.08)"
                  rx={1}
                />
              )}
            </g>
          );
        })}

        {/* X axis labels — show ~6 evenly */}
        {buckets.map((b, i) => {
          const step = Math.max(1, Math.ceil(buckets.length / 6));
          if (i % step !== 0 && i !== buckets.length - 1) return null;
          const x = padL + i * colW + colW / 2;
          return (
            <text
              key={`l-${i}`}
              x={x}
              y={height - 6}
              fontSize="9"
              textAnchor="middle"
              fill="rgba(255,255,255,0.35)"
              fontFamily="var(--font-geist-mono), ui-monospace, monospace"
            >
              {b.label}
            </text>
          );
        })}

        {/* Bottom axis line */}
        <line
          x1={padL}
          x2={wDefault - padR}
          y1={padT + innerH}
          y2={padT + innerH}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      </svg>

      {/* Tooltip — DOM, positioned over chart */}
      {hover !== null && buckets[hover] ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-[8px] border border-white/[0.12] bg-black/95 px-2.5 py-2 text-[11px] text-white shadow-[0_8px_24px_-4px_rgba(0,0,0,0.7)] backdrop-blur"
          style={{
            left: Math.max(
              60,
              Math.min(
                mouseX,
                (wrapRef.current?.clientWidth ?? 600) - 60
              )
            ),
            top: 16,
          }}
        >
          <p className="font-mono text-white/55">{buckets[hover].label}</p>
          <div className="mt-1 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-[1px] bg-[#FF5C1F]" />
              Success
              <span className="tabular text-white">{buckets[hover].success}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-[1px] bg-[#F5C518]" />
              Error
              <span className="tabular text-white">{buckets[hover].error}</span>
            </span>
          </div>
          <p className="mt-1 text-white/45">
            Total <span className="tabular text-white">{buckets[hover].success + buckets[hover].error}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
