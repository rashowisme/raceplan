"use client";

import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { TrainingPlan } from "@/engine/types";
import type { Formatter } from "@/features/plan-calendar/format";

export function ExportPdfButton({ plan, f }: { plan: TrainingPlan; f: Formatter }) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const onClick = async () => {
    setState("busy");
    try {
      const { downloadPlanPdf } = await import("./download");
      await downloadPlanPdf(plan, f);
      setState("idle");
    } catch (e) {
      console.error(e);
      setState("error");
    }
  };
  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={onClick} disabled={state === "busy"}>
        {state === "busy" ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : (
          <FileDown aria-hidden />
        )}
        {state === "busy" ? f.t("pdf.exporting") : f.t("pdf.export")}
      </Button>
      {state === "error" && (
        <p role="alert" className="text-destructive text-xs">
          {f.t("pdf.error")}
        </p>
      )}
    </div>
  );
}
