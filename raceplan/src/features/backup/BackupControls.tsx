"use client";

import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { TrainingPlan } from "@/engine/types";
import { CURRENT_PLAN_ID } from "@/features/plan-calendar/useCurrentPlan";
import { downloadBlob } from "@/lib/download";
import { getPlanRepository, PLAN_CHANGED_EVENT } from "@/storage";
import { backupFileName, parseBackup, serializeBackup } from "@/storage/backup";

type Translate = (key: string) => string;

/** "Load a backup": file picker → validated plan → becomes the current plan. */
export function LoadBackupButton({
  t,
  confirmReplace,
  variant = "outline",
}: {
  t: Translate;
  /** Ask before replacing an existing plan. */
  confirmReplace: boolean;
  variant?: "outline" | "ghost";
}) {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const r = parseBackup(await file.text());
    if (input.current) input.current.value = "";
    if (!r.ok) {
      setMessage({ error: true, text: t(`backup.errors.${r.code}`) });
      return;
    }
    if (confirmReplace && !window.confirm(t("backup.confirmReplace"))) return;
    await getPlanRepository().save(r.plan, CURRENT_PLAN_ID);
    setMessage({ error: false, text: t("backup.loaded") });
    window.dispatchEvent(new Event(PLAN_CHANGED_EVENT));
  };

  return (
    <div className="space-y-1">
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <Button variant={variant} onClick={() => input.current?.click()}>
        <Upload aria-hidden />
        {t("backup.load")}
      </Button>
      {message && (
        <p
          role={message.error ? "alert" : "status"}
          className={message.error ? "text-destructive text-xs" : "text-muted-foreground text-xs"}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}

/** Plan page: why and how to keep a copy of the plan. */
export function BackupCard({ t, stored }: { t: Translate; stored: TrainingPlan }) {
  const save = () =>
    downloadBlob(
      new Blob([serializeBackup(stored, new Date().toISOString())], { type: "application/json" }),
      backupFileName(stored),
    );
  return (
    <section
      aria-labelledby="backup-title"
      className="bg-card space-y-3 rounded-xl border p-4 print:hidden"
    >
      <div>
        <h2 id="backup-title" className="font-semibold">
          {t("backup.title")}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">{t("backup.body")}</p>
      </div>
      <div className="flex flex-wrap items-start gap-2">
        <Button variant="outline" onClick={save}>
          <Download aria-hidden />
          {t("backup.save")}
        </Button>
        <LoadBackupButton t={t} confirmReplace />
      </div>
    </section>
  );
}
