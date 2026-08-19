"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { SegmentedControl, Toggle } from "@/components/ui/Field";
import { t } from "@/lib/strings";
import { useStore, type BackendStatus } from "@/lib/store";
import { usePwaInstall } from "@/lib/usePwaInstall";
import type { AppData, Settings } from "@/lib/types";

const APP_VERSION = "0.2.0";
const WHEEL_SIZES = [6, 8, 10, 12];

const STORAGE_LABEL: Record<BackendStatus, string> = {
  connecting: t.settings.storageConnecting,
  cloud: t.settings.storageCloud,
  local: t.settings.storageLocal,
  fallback: t.settings.storageFallback,
};

const STORAGE_BODY: Record<BackendStatus, string> = {
  connecting: "",
  cloud: t.settings.storageCloudBody,
  local: t.settings.storageLocalBody,
  fallback: t.settings.storageFallbackBody,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-sm font-bold text-ink-muted">{title}</h2>
      <Card className="px-4 py-2">{children}</Card>
    </section>
  );
}

export default function SettingsPage() {
  const store = useStore();
  const { canInstall, installed, install } = usePwaInstall();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const exportData = () => {
    const payload: AppData = {
      meals: store.meals,
      history: store.history,
      filters: store.filters,
      settings: store.settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wheelfood-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File) => {
    setImportError(null);
    try {
      const parsed = JSON.parse(await file.text()) as Partial<AppData>;
      if (!Array.isArray(parsed.meals)) throw new Error("bad file");
      await store.importData(parsed);
    } catch {
      setImportError("הקובץ לא תקין");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold">{t.settings.title}</h1>

      <Section title={t.settings.appearance}>
        <div className="py-2">
          <p className="mb-2 text-[0.95rem] font-medium text-ink">{t.settings.theme}</p>
          <SegmentedControl<Settings["theme"]>
            value={store.settings.theme}
            onChange={(theme) => void store.setSettings({ theme })}
            options={[
              { value: "system", label: t.settings.themeSystem },
              { value: "light", label: t.settings.themeLight },
              { value: "dark", label: t.settings.themeDark },
            ]}
          />
        </div>
      </Section>

      <Section title={t.settings.feedback}>
        <Toggle
          checked={store.settings.haptics}
          onChange={(haptics) => void store.setSettings({ haptics })}
          label={t.settings.haptics}
        />
        <Toggle
          checked={store.settings.sound}
          onChange={(sound) => void store.setSettings({ sound })}
          label={t.settings.sound}
        />
        <Toggle
          checked={store.settings.reduceMotion}
          onChange={(reduceMotion) => void store.setSettings({ reduceMotion })}
          label={t.settings.reduceMotion}
        />
      </Section>

      <Section title={t.settings.wheel}>
        <div className="py-3">
          <p className="mb-2 text-[0.95rem] font-medium text-ink">{t.settings.wheelSize}</p>
          <div className="flex gap-2">
            {WHEEL_SIZES.map((size) => (
              <Chip
                key={size}
                selected={store.settings.wheelSize === size}
                onClick={() => void store.setSettings({ wheelSize: size })}
              >
                {size}
              </Chip>
            ))}
          </div>
        </div>
      </Section>

      <Section title={t.settings.install}>
        <div className="flex items-center justify-between gap-3 py-3">
          <p className="text-sm text-ink-muted">
            {installed ? t.settings.installed : t.settings.installBody}
          </p>
          {!installed && canInstall ? (
            <Button size="sm" onClick={() => void install()}>
              {t.settings.installAction}
            </Button>
          ) : null}
        </div>
      </Section>

      <Section title={t.settings.data}>
        <div className="flex flex-col gap-3 py-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  store.backend === "cloud"
                    ? "bg-mint"
                    : store.backend === "connecting"
                      ? "bg-accent"
                      : store.backend === "fallback"
                        ? "bg-danger"
                        : "bg-ink-muted"
                }`}
              />
              <span className="text-[0.95rem] font-medium text-ink">{STORAGE_LABEL[store.backend]}</span>
            </div>
            <p className="text-xs text-ink-muted">{STORAGE_BODY[store.backend]}</p>
            {store.backendError ? (
              <p className="mt-1 break-words font-mono text-[0.7rem] text-danger">{store.backendError}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={exportData}>
              {t.settings.exportData}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              {t.settings.importData}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (window.confirm(t.settings.resetConfirm)) void store.resetAll();
              }}
            >
              {t.settings.resetData}
            </Button>
          </div>
          {importError ? <p className="text-sm text-danger">{importError}</p> : null}
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importData(file);
              event.target.value = "";
            }}
          />
        </div>
      </Section>

      <Section title={t.settings.about}>
        <div className="flex items-center justify-between py-3 text-sm">
          <span className="text-ink-muted">{t.settings.version}</span>
          <span className="font-mono text-ink">{APP_VERSION}</span>
        </div>
      </Section>
    </div>
  );
}
