"use client";

const COLORS = [
  "var(--wf-slice-1)",
  "var(--wf-slice-3)",
  "var(--wf-slice-5)",
  "var(--wf-slice-7)",
  "var(--wf-slice-9)",
  "var(--wf-slice-10)",
];

export interface ConfettiPiece {
  id: number;
  left: number;
  drift: string;
  delay: number;
  duration: number;
  size: number;
  color: string;
  round: boolean;
}

/**
 * Builds a burst. Call this from an event handler — never during render — so
 * the randomness stays outside React's render pass.
 */
export function createConfetti(count = 36): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    drift: `${(Math.random() - 0.5) * 30}vw`,
    delay: Math.random() * 0.4,
    duration: 1.9 + Math.random() * 1.3,
    size: 6 + Math.random() * 7,
    color: COLORS[i % COLORS.length],
    round: Math.random() > 0.6,
  }));
}

/** Cheap CSS-only celebration. No canvas, no dependency. */
export function Confetti({ pieces }: { pieces: ConfettiPiece[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          style={{
            position: "absolute",
            left: `${piece.left}%`,
            top: 0,
            width: piece.size,
            height: piece.size * (piece.round ? 1 : 1.8),
            background: piece.color,
            borderRadius: piece.round ? "50%" : "2px",
            animation: `wf-confetti-fall ${piece.duration}s linear ${piece.delay}s forwards`,
            ["--wf-drift" as string]: piece.drift,
          }}
        />
      ))}
    </div>
  );
}
