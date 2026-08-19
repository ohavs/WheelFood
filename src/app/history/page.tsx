"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { t } from "@/lib/strings";
import { useStore } from "@/lib/store";
import type { SpinRecord } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function dayLabel(timestamp: number): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = today.getTime() - new Date(timestamp).setHours(0, 0, 0, 0);
  if (diff === 0) return t.history.today;
  if (diff === DAY_MS) return t.history.yesterday;
  return new Date(timestamp).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
  });
}

function groupByDay(history: SpinRecord[]): [string, SpinRecord[]][] {
  const groups = new Map<string, SpinRecord[]>();
  for (const record of history) {
    const key = dayLabel(record.at);
    const bucket = groups.get(key);
    if (bucket) bucket.push(record);
    else groups.set(key, [record]);
  }
  return [...groups.entries()];
}

export default function HistoryPage() {
  const store = useStore();
  const groups = useMemo(() => groupByDay(store.history), [store.history]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{t.history.title}</h1>
        {store.history.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm(t.history.clearConfirm)) void store.clearHistory();
            }}
          >
            {t.history.clear}
          </Button>
        ) : null}
      </header>

      {store.history.length === 0 ? (
        <EmptyState emoji="🕰️" title={t.history.empty} body={t.history.emptyBody} />
      ) : (
        groups.map(([day, records]) => (
          <section key={day} className="flex flex-col gap-2">
            <h2 className="px-1 text-sm font-bold text-ink-muted">{day}</h2>
            {records.map((record) => (
              <Card key={record.id} className="flex items-center gap-3 p-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-muted text-2xl">
                  {record.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{record.mealName}</span>
                  <span className="block text-xs text-ink-muted">
                    {new Date(record.at).toLocaleTimeString("he-IL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    record.accepted ? "bg-mint-soft text-mint" : "bg-surface-muted text-ink-muted"
                  }`}
                >
                  {record.accepted ? t.history.accepted : t.history.skipped}
                </span>
              </Card>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
