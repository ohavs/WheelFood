"use client";

import { useEffect, useRef } from "react";
import type { Meal } from "@/lib/types";

const SLICE_COLORS = [
  "var(--wf-slice-1)",
  "var(--wf-slice-2)",
  "var(--wf-slice-3)",
  "var(--wf-slice-4)",
  "var(--wf-slice-5)",
  "var(--wf-slice-6)",
  "var(--wf-slice-7)",
  "var(--wf-slice-8)",
  "var(--wf-slice-9)",
  "var(--wf-slice-10)",
  "var(--wf-slice-11)",
  "var(--wf-slice-12)",
];

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = CENTER - 8;

function polar(angleDeg: number, radius: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)];
}

function slicePath(index: number, slice: number): string {
  const [x0, y0] = polar(index * slice, RADIUS);
  const [x1, y1] = polar((index + 1) * slice, RADIUS);
  const largeArc = slice > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${x0} ${y0} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x1} ${y1} Z`;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

interface Props {
  candidates: Meal[];
  /** Cumulative rotation in degrees; always increases so the wheel spins forward. */
  rotation: number;
  durationMs: number;
  spinning: boolean;
  onSpinEnd: () => void;
  onTick?: (progress: number) => void;
}

export function Wheel({ candidates, rotation, durationMs, spinning, onSpinEnd, onTick }: Props) {
  const discRef = useRef<HTMLDivElement>(null);
  const count = Math.max(candidates.length, 1);
  const slice = 360 / count;

  // Read the live transform each frame so ticks land on real slice crossings
  // rather than on a guessed easing curve.
  useEffect(() => {
    if (!spinning || !onTick) return;
    const node = discRef.current;
    if (!node) return;

    let frame = 0;
    let lastIndex = -1;
    const startedAt = performance.now();

    const read = () => {
      const transform = getComputedStyle(node).transform;
      let angle = 0;
      if (transform && transform !== "none") {
        const values = transform.match(/matrix\(([^)]+)\)/);
        if (values) {
          const [a, b] = values[1].split(",").map(Number);
          angle = (Math.atan2(b, a) * 180) / Math.PI;
        }
      }
      const normalized = ((angle % 360) + 360) % 360;
      const index = Math.floor(normalized / slice);
      if (lastIndex !== -1 && index !== lastIndex) {
        const progress = Math.min((performance.now() - startedAt) / durationMs, 1);
        onTick(progress);
      }
      lastIndex = index;
      frame = requestAnimationFrame(read);
    };

    frame = requestAnimationFrame(read);
    return () => cancelAnimationFrame(frame);
  }, [spinning, slice, durationMs, onTick]);

  // Labels sit tangentially, so the usable width is the slice chord at the
  // label radius — narrow slices need both a smaller face and a harder trim.
  const fontSize = count > 9 ? 11 : count > 6 ? 12.5 : 14.5;
  const emojiSize = count > 9 ? 15 : count > 6 ? 18 : 21;
  const maxChars = count > 9 ? 7 : count > 6 ? 10 : 13;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(88vw,26rem)] select-none">
      {/* Pointer */}
      <div className="pointer-events-none absolute -top-1 left-1/2 z-20 -translate-x-1/2">
        <svg width="34" height="40" viewBox="0 0 34 40" aria-hidden="true">
          <path
            d="M17 39 C 10 26, 3 21, 3 14 A 14 14 0 1 1 31 14 C 31 21, 24 26, 17 39 Z"
            fill="var(--wf-text)"
            stroke="var(--wf-bg)"
            strokeWidth="2.5"
          />
          <circle cx="17" cy="14" r="4.5" fill="var(--wf-bg)" />
        </svg>
      </div>

      {/* Rim. `overflow-hidden` matters: the disc below is a square, and a
          rotated square's corners stick out past the circle. Unclipped they
          widen the document's scroll area, which lets the whole page pan
          sideways and rubber-band while the wheel spins. */}
      <div className="absolute inset-0 overflow-hidden rounded-full bg-[var(--wf-text)]/10 p-[3%] shadow-pop">
        <div
          ref={discRef}
          className="h-full w-full rounded-full will-change-transform"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? `transform ${durationMs}ms cubic-bezier(0.16, 0.84, 0.28, 1)` : "none",
          }}
          onTransitionEnd={(event) => {
            if (event.propertyName === "transform") onSpinEnd();
          }}
        >
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full" role="img" aria-label="גלגל המנות">
            <defs>
              <filter id="wf-slice-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.18" />
              </filter>
            </defs>

            {candidates.length === 0 ? (
              <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="var(--wf-surface-muted)" />
            ) : (
              candidates.map((meal, index) => {
                const mid = (index + 0.5) * slice;
                const [tx, ty] = polar(mid, RADIUS * 0.66);
                // Slices past the horizontal would render their label upside
                // down; rotating them another half turn keeps every label
                // readable, and flipping the offsets keeps the emoji outward.
                const flipped = mid > 90 && mid < 270;
                const labelAngle = flipped ? mid + 180 : mid;
                const emojiY = flipped ? emojiSize * 0.9 : -emojiSize * 0.35;
                const nameY = flipped ? -fontSize * 0.6 : fontSize * 1.05;
                return (
                  <g key={meal.id}>
                    <path
                      d={slicePath(index, slice)}
                      fill={SLICE_COLORS[index % SLICE_COLORS.length]}
                      stroke="var(--wf-bg-elevated)"
                      strokeWidth="1.5"
                    />
                    <g
                      transform={`translate(${tx} ${ty}) rotate(${labelAngle})`}
                      filter="url(#wf-slice-shadow)"
                    >
                      <text
                        textAnchor="middle"
                        y={emojiY}
                        fontSize={emojiSize}
                        style={{ userSelect: "none" }}
                      >
                        {meal.emoji}
                      </text>
                      <text
                        textAnchor="middle"
                        y={nameY}
                        fontSize={fontSize}
                        fontWeight={700}
                        fill="#fff"
                        style={{ userSelect: "none" }}
                      >
                        {truncate(meal.name, maxChars)}
                      </text>
                    </g>
                  </g>
                );
              })
            )}

            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="var(--wf-bg-elevated)"
              strokeWidth="6"
            />
          </svg>
        </div>
      </div>

      {/* Hub */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 grid h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-bg-elevated shadow-card">
        <span className="text-[min(5vw,1.4rem)]">🍽️</span>
      </div>
    </div>
  );
}
