"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/strings";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="wf-fade-in sticky top-0 z-30 -mx-4 mb-3 bg-accent-soft px-4 py-2 text-center text-xs font-semibold text-ink">
      {t.common.offline}
    </div>
  );
}
