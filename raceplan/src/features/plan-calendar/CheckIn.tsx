"use client";

import { Bandage, BatteryLow, Bone, OctagonPause, Play, Thermometer, Undo2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addCheckIn, openPause, undoCheckIn, type LogResult } from "@/engine";
import { diffDays } from "@/engine/dates";
import type { CheckInKind, TrainingPlan } from "@/engine/types";
import { getPlanRepository, PLAN_CHANGED_EVENT } from "@/storage";
import { formatDateLong, type Formatter } from "./format";
import { CURRENT_PLAN_ID } from "./useCurrentPlan";

const KINDS = [
  { kind: "tired", Icon: BatteryLow },
  { kind: "pain", Icon: Bandage },
  { kind: "sick", Icon: Thermometer },
  { kind: "injured", Icon: Bone },
] as const satisfies readonly { kind: CheckInKind; Icon: unknown }[];

export const CHECK_IN_CARD_ID = "check-in";

/**
 * §13.1 check-ins: "How do you feel?" (tired, pain, sick, injured), and
 * while sick or injured, the paused plan with "I'm back".
 */
export function CheckInCard({
  f,
  stored,
  today,
}: {
  f: Formatter;
  /** The stored plan (original + log), not the adapted one. */
  stored: TrainingPlan;
  today: string;
}) {
  const [failed, setFailed] = useState(false);
  if (diffDays(stored.raceDate, today) >= 0) return null;

  const pause = openPause(stored.log);
  const last = stored.log?.checkIns?.at(-1);
  const notedToday = last?.date === today ? last.kind : null;

  const save = async (r: LogResult) => {
    if (!r.ok) {
      setFailed(true);
      return;
    }
    setFailed(false);
    await getPlanRepository().save(r.plan, CURRENT_PLAN_ID);
    window.dispatchEvent(new Event(PLAN_CHANGED_EVENT));
  };
  const add = (kind: CheckInKind) => void save(addCheckIn(stored, kind, { today }));
  const undo = notedToday && (
    <Button variant="ghost" size="sm" onClick={() => void save(undoCheckIn(stored, { today }))}>
      <Undo2 aria-hidden />
      {f.t("checkIn.undo")}
    </Button>
  );
  const error = failed && (
    <p role="alert" className="text-destructive text-xs">
      {f.t("checkIn.error")}
    </p>
  );

  if (pause) {
    return (
      <section
        id={CHECK_IN_CARD_ID}
        aria-labelledby="check-in-title"
        className="border-destructive/40 bg-destructive/5 scroll-mt-20 space-y-3 rounded-xl border p-4 print:hidden"
      >
        <h2 id="check-in-title" className="flex items-center gap-2 font-semibold">
          <OctagonPause className="text-destructive size-5" aria-hidden />
          {f.t("checkIn.pausedTitle")}
        </h2>
        <p className="text-sm">
          {f.t(`checkIn.paused.${pause.kind}`, { date: formatDateLong(f.locale, pause.since) })}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => add("back")} className="h-11">
            <Play aria-hidden />
            {f.t("checkIn.back")}
          </Button>
          {undo}
        </div>
        <p className="text-muted-foreground text-xs">{f.t("checkIn.backHint")}</p>
        {error}
      </section>
    );
  }

  return (
    <section
      id={CHECK_IN_CARD_ID}
      aria-labelledby="check-in-title"
      className="bg-card scroll-mt-20 space-y-3 rounded-xl border p-4 print:hidden"
    >
      <h2 id="check-in-title" className="font-semibold">
        {f.t("checkIn.title")}
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {KINDS.map(({ kind, Icon }) => (
          <button
            key={kind}
            type="button"
            onClick={() => add(kind)}
            className="focus-visible:ring-ring hover:bg-muted flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
            {f.t(`checkIn.${kind}`)}
          </button>
        ))}
      </div>
      {notedToday ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p role="status" className="text-sm">
            {f.t(`checkIn.noted.${notedToday}`)}
          </p>
          {undo}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">{f.t("checkIn.hint")}</p>
      )}
      {error}
    </section>
  );
}
