"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { Confetti, createConfetti, type ConfettiPiece } from "@/components/Confetti";
import { FilterSheet } from "@/components/FilterSheet";
import { ModeTabs } from "@/components/ModeTabs";
import { ResultSheet } from "@/components/ResultSheet";
import { Wheel } from "@/components/Wheel";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { playTick, playWin, vibrate } from "@/lib/feedback";
import { uid } from "@/lib/id";
import { seededRandom } from "@/lib/random";
import { collectTags, countActiveFilters, drawCandidates, filterMeals, pickWinner } from "@/lib/selection";
import { t } from "@/lib/strings";
import { useStore } from "@/lib/store";
import { MODE_KINDS, modeOf, type Meal, type Mode } from "@/lib/types";

const SPIN_MS = 4200;
const MIN_TURNS = 4;

export function WheelScreen() {
  const store = useStore();
  const { meals, history, filters, settings, ready } = store;

  const [rotations, setRotations] = useState<Record<Mode, number>>({ home: 0, out: 0 });
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Meal | null>(null);
  const [confetti, setConfetti] = useState<ConfettiPiece[] | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  /** Bumped by the shuffle button to redraw which meals appear on the wheel. */
  const [shuffleNonce, setShuffleNonce] = useState(0);

  const pendingWinner = useRef<Meal | null>(null);
  const currentSpinId = useRef<string | null>(null);

  const mode = filters.mode;
  const rotation = rotations[mode];

  const pool = useMemo(() => filterMeals(meals, filters, history), [meals, filters, history]);
  // Tags and counts follow the active side, so the filter sheet never offers a
  // tag that only exists on the other wheel.
  const modeMeals = useMemo(
    () => meals.filter((meal) => MODE_KINDS[mode].includes(meal.kind)),
    [meals, mode],
  );
  const tags = useMemo(() => collectTags(modeMeals), [modeMeals]);
  const counts = useMemo(
    () =>
      meals.reduce(
        (acc, meal) => {
          acc[modeOf(meal.kind)] += 1;
          return acc;
        },
        { home: 0, out: 0 } as Record<Mode, number>,
      ),
    [meals],
  );
  const activeFilterCount = countActiveFilters(filters);

  // The visible slices are a deterministic draw from the eligible pool: same
  // pool + same nonce always yields the same wheel, so render stays pure and
  // the server and client agree. The shuffle button re-seeds it.
  const candidates = useMemo(() => {
    const seed = `${mode}:${shuffleNonce}:${settings.wheelSize}:${pool.map((meal) => meal.id).join(",")}`;
    return drawCandidates(pool, settings.wheelSize, seededRandom(seed));
  }, [pool, settings.wheelSize, shuffleNonce, mode]);

  const reshuffle = useCallback(() => {
    if (spinning) return;
    setShuffleNonce((nonce) => nonce + 1);
    vibrate(settings.haptics, 8);
  }, [settings.haptics, spinning]);

  const spin = useCallback(() => {
    if (spinning || candidates.length === 0) return;

    const index = pickWinner(candidates);
    if (index < 0) return;

    const slice = 360 / candidates.length;
    const jitter = (Math.random() - 0.5) * slice * 0.6;
    const targetAngle = -(index * slice + slice / 2) + jitter;
    const delta = (((targetAngle - rotation) % 360) + 360) % 360;
    const turns = MIN_TURNS + Math.floor(Math.random() * 2);

    pendingWinner.current = candidates[index];
    currentSpinId.current = uid("spin");
    setSpinning(true);
    setRotations((prev) => ({ ...prev, [mode]: rotation + turns * 360 + delta }));
    vibrate(settings.haptics, 12);
  }, [candidates, rotation, spinning, settings.haptics, mode]);

  const onTick = useCallback(
    (progress: number) => {
      // Fade the click as the wheel slows so it reads as deceleration.
      playTick(settings.sound, 1 - progress * 0.7);
      vibrate(settings.haptics, 4);
    },
    [settings.sound, settings.haptics],
  );

  const onSpinEnd = useCallback(() => {
    if (!spinning) return;
    setSpinning(false);
    const meal = pendingWinner.current;
    if (!meal) return;

    setWinner(meal);
    setConfetti(createConfetti());
    playWin(settings.sound);
    vibrate(settings.haptics, [18, 60, 24]);
    window.setTimeout(() => setConfetti(null), 2600);

    // Record the spin immediately; `accepted` flips when the user confirms.
    void store.addSpin({
      id: currentSpinId.current ?? uid("spin"),
      mealId: meal.id,
      mealName: meal.name,
      emoji: meal.emoji,
      at: Date.now(),
      accepted: false,
    });
  }, [spinning, settings.sound, settings.haptics, store]);

  const acceptWinner = useCallback(() => {
    if (currentSpinId.current) void store.updateSpin(currentSpinId.current, { accepted: true });
    setWinner(null);
  }, [store]);

  const rerollWinner = useCallback(() => {
    setWinner(null);
    window.setTimeout(spin, 260);
  }, [spin]);

  if (!ready) {
    return <div className="grid min-h-[60vh] place-items-center text-ink-muted">{t.common.loading}</div>;
  }

  if (meals.length === 0) {
    return (
      <EmptyState
        emoji="🍽️"
        title={t.wheel.noMealsTitle}
        body={t.wheel.noMealsBody}
        action={
          <Link href="/meals">
            <Button>{t.wheel.emptyAction}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-5 pb-4">
      <header className="flex w-full items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold leading-tight">{t.tagline}</h1>
          <p className="text-sm text-ink-muted">{t.wheel.poolCount(pool.length)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reshuffle}
            disabled={pool.length <= candidates.length || spinning}
            aria-label="ערבב מנות"
            className="grid h-11 w-11 place-items-center rounded-full border border-border-soft bg-surface text-lg shadow-soft transition disabled:opacity-40"
          >
            🔀
          </button>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="relative inline-flex h-11 items-center gap-2 rounded-full border border-border-soft bg-surface px-4 text-sm font-semibold shadow-soft"
          >
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M3 5h14M6 10h8M8.5 15h3" />
            </svg>
            {t.filters.open}
            {activeFilterCount > 0 ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-ink-inverse">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      <ModeTabs
        value={mode}
        counts={counts}
        onChange={(next) => void store.setFilters({ ...filters, mode: next })}
      />

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-6">
        {modeMeals.length === 0 ? (
          <EmptyState
            emoji={mode === "home" ? "🍳" : "🛵"}
            title={mode === "home" ? t.wheel.emptyHome : t.wheel.emptyOut}
            body={mode === "home" ? t.wheel.emptyHomeBody : t.wheel.emptyOutBody}
            action={
              <Link href="/meals">
                <Button>{t.wheel.emptyAction}</Button>
              </Link>
            }
          />
        ) : pool.length === 0 ? (
          <EmptyState
            emoji="🫙"
            title={t.wheel.emptyTitle}
            body={t.wheel.emptyBody}
            action={
              <Button variant="secondary" onClick={() => setFiltersOpen(true)}>
                {t.filters.open}
              </Button>
            }
          />
        ) : (
          <>
            <Wheel
              candidates={candidates}
              rotation={rotation}
              durationMs={settings.reduceMotion ? 600 : SPIN_MS}
              spinning={spinning}
              onSpinEnd={onSpinEnd}
              onTick={settings.reduceMotion ? undefined : onTick}
            />

            <Button size="lg" onClick={spin} disabled={spinning} className="min-w-48 text-xl">
              {spinning ? t.wheel.spinning : t.wheel.spin}
            </Button>
          </>
        )}
      </div>

      {confetti ? <Confetti pieces={confetti} /> : null}

      {winner ? (
        <ResultSheet
          meal={winner}
          onAccept={acceptWinner}
          onReroll={rerollWinner}
          onClose={() => setWinner(null)}
        />
      ) : null}

      {filtersOpen ? (
        <FilterSheet
          onClose={() => setFiltersOpen(false)}
          filters={filters}
          availableTags={tags}
          onApply={(next) => void store.setFilters(next)}
        />
      ) : null}
    </div>
  );
}
