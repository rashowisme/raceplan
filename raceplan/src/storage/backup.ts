/**
 * Backup file: the stored plan (original + training log) as JSON, so a runner
 * can keep a copy or move their plan to another device. Nothing is uploaded.
 */
import { z } from "zod";
import { adaptPlan, checkPlan, validateProfile } from "@/engine";
import { isoDateSchema } from "@/engine/schema";
import {
  CHECK_IN_KINDS,
  SCHEMA_VERSION,
  WORKOUT_STATUSES,
  type TrainingPlan,
} from "@/engine/types";

const BACKUP_APP = "raceplan";
const BACKUP_VERSION = 1;

interface BackupFile {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  /** ISO timestamp, informative only. */
  savedAt: string;
  plan: TrainingPlan;
}

export function serializeBackup(plan: TrainingPlan, savedAt: string): string {
  const file: BackupFile = { app: BACKUP_APP, version: BACKUP_VERSION, savedAt, plan };
  return JSON.stringify(file);
}

export const backupFileName = (plan: TrainingPlan) =>
  `raceplan-${plan.profile.race.type}-${plan.raceDate}-backup.json`;

const envelopeSchema = z.object({
  app: z.literal(BACKUP_APP),
  version: z.literal(BACKUP_VERSION),
  plan: z
    .object({
      schemaVersion: z.literal(SCHEMA_VERSION),
      generatedOn: isoDateSchema,
      startDate: isoDateSchema,
      raceDate: isoDateSchema,
      weeks: z.array(z.object({ days: z.array(z.object({ date: isoDateSchema })) })).min(1),
      log: z
        .object({
          workouts: z.record(isoDateSchema, z.enum(WORKOUT_STATUSES)),
          checkIns: z
            .array(z.object({ date: isoDateSchema, kind: z.enum(CHECK_IN_KINDS) }))
            .optional(),
        })
        .optional(),
      frozenWeeks: z.number().int().min(0).optional(),
    })
    .loose(),
});

export type BackupError = "invalid_file" | "unsupported_version";

/**
 * Reads a backup file. The plan must be one this version of the app can
 * show: known schema, valid answers, and every safety rule holding.
 */
export function parseBackup(
  text: string,
): { ok: true; plan: TrainingPlan } | { ok: false; code: BackupError } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, code: "invalid_file" };
  }
  const env = envelopeSchema.safeParse(json);
  if (!env.success) {
    const plan = (json as { plan?: { schemaVersion?: unknown } } | null)?.plan;
    const otherVersion =
      (json as { app?: unknown } | null)?.app === BACKUP_APP &&
      typeof plan?.schemaVersion === "number" &&
      plan.schemaVersion !== SCHEMA_VERSION;
    return { ok: false, code: otherVersion ? "unsupported_version" : "invalid_file" };
  }
  // The schema only validates: its output strips nested fields, so keep the original.
  const plan = (json as { plan: TrainingPlan }).plan;
  try {
    const profile = validateProfile(plan.profile, { today: plan.generatedOn });
    // Both the stored weeks (also the caps for adapted weeks) and the plan shown.
    if (!profile.ok || checkPlan(plan).length > 0 || checkPlan(adaptPlan(plan)).length > 0)
      return { ok: false, code: "invalid_file" };
  } catch {
    // Structurally broken plans (hand-edited files) fail here.
    return { ok: false, code: "invalid_file" };
  }
  return { ok: true, plan };
}
