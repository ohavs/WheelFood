import type { ReactNode } from "react";

export function EmptyState({
  emoji,
  title,
  body,
  action,
}: {
  emoji: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-surface-muted text-4xl">{emoji}</div>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {body ? <p className="max-w-xs text-sm text-ink-muted">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
