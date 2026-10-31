/**
 * Client-side PDF generation. Imported lazily (the renderer is large) and
 * never sends anything over the network.
 */
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import type { TrainingPlan } from "@/engine/types";
import type { Formatter } from "@/features/plan-calendar/format";
import { PlanDocument } from "./PlanDocument";

export function pdfFileName(plan: TrainingPlan): string {
  return `raceplan-${plan.profile.race.type}-${plan.raceDate}.pdf`;
}

export async function renderPlanPdf(plan: TrainingPlan, f: Formatter): Promise<Blob> {
  // `pdf()` expects a <Document> element.
  const doc = createElement(PlanDocument, { plan, f }) as unknown as Parameters<typeof pdf>[0];
  return pdf(doc).toBlob();
}

export async function downloadPlanPdf(plan: TrainingPlan, f: Formatter): Promise<void> {
  const blob = await renderPlanPdf(plan, f);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = pdfFileName(plan);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
