"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import {
  INJURY_FREQUENCIES,
  INJURY_TYPES,
  PLAN_STYLES,
  PREFERENCE_TAGS,
  RACE_TYPES,
  SEXES,
  WEEKDAYS,
  YEARS_RUNNING,
  type PreferenceTag,
} from "@/engine/types";
import type { DistanceUnit } from "@/lib/units";
import { cn } from "@/lib/utils";
import {
  ChipGroup,
  ChoiceCards,
  describedBy,
  Field,
  inputClass,
  Segmented,
  SuffixInput,
} from "./fields";
import type { FieldError, PlanFormValues } from "./form-model";

export type StepErrors = Partial<Record<keyof PlanFormValues, FieldError>>;

interface StepProps {
  errors: StepErrors;
  unit: DistanceUnit;
  today: string;
}

const fid = (name: keyof PlanFormValues) => `field-${name}`;
const aria = (name: keyof PlanFormValues, errors: StepErrors, hint?: unknown) => ({
  id: fid(name),
  "aria-invalid": !!errors[name] || undefined,
  "aria-describedby": describedBy(fid(name), hint, errors[name]),
});

export function RaceStep({ errors, unit, today }: StepProps) {
  const t = useTranslations("form");
  const { register, control } = useFormContext<PlanFormValues>();
  const raceType = useWatch({ control, name: "raceType" });
  const needsDistance = raceType === "custom" || raceType === "trail";
  return (
    <div className="space-y-6">
      <Field id={fid("raceType")} label={t("raceType.label")} error={errors.raceType} asGroup>
        <Controller
          control={control}
          name="raceType"
          render={({ field }) => (
            <ChoiceCards
              name="raceType"
              value={field.value}
              onChange={field.onChange}
              invalid={!!errors.raceType}
              choices={RACE_TYPES.map((r) => ({ value: r, label: t(`raceType.${r}`) }))}
            />
          )}
        />
      </Field>
      {needsDistance && (
        <Field
          id={fid("distance")}
          label={t("distance.label")}
          hint={t("distance.hint")}
          error={errors.distance}
        >
          <SuffixInput
            {...register("distance")}
            {...aria("distance", errors, true)}
            inputMode="decimal"
            autoComplete="off"
            suffix={unit}
          />
        </Field>
      )}
      {raceType === "trail" && (
        <Field
          id={fid("elevationGain")}
          label={t("elevationGain.label")}
          hint={t("elevationGain.hint")}
          error={errors.elevationGain}
        >
          <SuffixInput
            {...register("elevationGain")}
            {...aria("elevationGain", errors, true)}
            inputMode="numeric"
            autoComplete="off"
            suffix={unit === "km" ? "m" : "ft"}
          />
        </Field>
      )}
      <Field id={fid("raceDate")} label={t("raceDate.label")} error={errors.raceDate}>
        <input
          type="date"
          min={today}
          className={inputClass}
          {...register("raceDate")}
          {...aria("raceDate", errors)}
        />
      </Field>
      <Field
        id={fid("startDate")}
        label={t("startDate.label")}
        hint={t("startDate.hint")}
        error={errors.startDate}
        optional
      >
        <input
          type="date"
          min={today}
          className={inputClass}
          {...register("startDate")}
          {...aria("startDate", errors, true)}
        />
      </Field>
    </div>
  );
}

export function FitnessStep({ errors, today }: StepProps) {
  const t = useTranslations("form");
  const { register } = useFormContext<PlanFormValues>();
  const timeField = (name: "prTime" | "watchTime" | "targetTime") => (
    <Field
      id={fid(name)}
      label={t(`${name}.label`)}
      hint={t(`${name}.hint`)}
      error={errors[name]}
      optional
    >
      <input
        className={inputClass}
        inputMode="numeric"
        autoComplete="off"
        placeholder={t(`${name}.placeholder`)}
        {...register(name)}
        {...aria(name, errors, true)}
      />
    </Field>
  );
  return (
    <div className="space-y-6">
      {timeField("prTime")}
      <Field
        id={fid("prDate")}
        label={t("prDate.label")}
        hint={t("prDate.hint")}
        error={errors.prDate}
        optional
      >
        <input
          type="date"
          max={today}
          className={inputClass}
          {...register("prDate")}
          {...aria("prDate", errors, true)}
        />
      </Field>
      {timeField("watchTime")}
      {timeField("targetTime")}
    </div>
  );
}

export function TrainingStep({ errors, unit }: StepProps) {
  const t = useTranslations("form");
  const tw = useTranslations("common");
  const { register, control } = useFormContext<PlanFormValues>();
  const days = useWatch({ control, name: "availableDays" });
  const distanceInput = (
    name: "currentVolume" | "longestRun" | "maxVolume",
    hint: boolean,
    optional = false,
  ) => (
    <Field
      id={fid(name)}
      label={t(`${name}.label`)}
      hint={hint ? t(`${name}.hint`) : undefined}
      error={errors[name]}
      optional={optional}
    >
      <SuffixInput
        {...register(name)}
        {...aria(name, errors, hint)}
        inputMode="decimal"
        autoComplete="off"
        suffix={name === "longestRun" ? unit : t("perWeek", { unit })}
      />
    </Field>
  );
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        {distanceInput("currentVolume", true)}
        {distanceInput("longestRun", false, true)}
      </div>
      {distanceInput("maxVolume", true)}
      <Field
        id={fid("yearsRunning")}
        label={t("yearsRunning.label")}
        error={errors.yearsRunning}
        asGroup
      >
        <Controller
          control={control}
          name="yearsRunning"
          render={({ field }) => (
            <ChoiceCards
              name="yearsRunning"
              value={field.value}
              onChange={field.onChange}
              columns={3}
              invalid={!!errors.yearsRunning}
              choices={YEARS_RUNNING.map((y) => ({ value: y, label: t(`yearsRunning.${y}`) }))}
            />
          )}
        />
      </Field>
      <Field
        id={fid("availableDays")}
        label={t("availableDays.label")}
        hint={t("availableDays.hint")}
        error={errors.availableDays}
        asGroup
      >
        <Controller
          control={control}
          name="availableDays"
          render={({ field }) => (
            <ChipGroup
              values={field.value}
              onChange={(v) => {
                field.onChange(WEEKDAYS.filter((d) => v.includes(d)));
              }}
              options={WEEKDAYS.map((d) => ({
                value: d,
                label: tw(`weekdaysShort.${d}`),
                title: tw(`weekdays.${d}`),
              }))}
            />
          )}
        />
      </Field>
      <Field id={fid("longRunDay")} label={t("longRunDay.label")} error={errors.longRunDay}>
        <select
          className={cn(inputClass, "appearance-auto")}
          {...register("longRunDay")}
          {...aria("longRunDay", errors)}
        >
          <option value="">{t("longRunDay.placeholder")}</option>
          {WEEKDAYS.filter((d) => days.includes(d)).map((d) => (
            <option key={d} value={d}>
              {tw(`weekdays.${d}`)}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

export function HealthStep({ errors }: StepProps) {
  const t = useTranslations("form");
  const { register, control } = useFormContext<PlanFormValues>();
  const injured = useWatch({ control, name: "currentlyInjured" });
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id={fid("age")} label={t("age.label")} error={errors.age}>
          <input
            className={inputClass}
            inputMode="numeric"
            autoComplete="off"
            {...register("age")}
            {...aria("age", errors)}
          />
        </Field>
        <Field id={fid("sex")} label={t("sex.label")} hint={t("sex.hint")} optional>
          <select
            className={cn(inputClass, "appearance-auto")}
            {...register("sex")}
            {...aria("sex", errors, true)}
          >
            <option value="">{t("sex.none")}</option>
            {SEXES.map((s) => (
              <option key={s} value={s}>
                {t(`sex.${s}`)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        id={fid("injuries")}
        label={t("injuries.label")}
        hint={t("injuries.hint")}
        asGroup
        optional
      >
        <Controller
          control={control}
          name="injuries"
          render={({ field }) => (
            <ul className="divide-y rounded-lg border">
              {INJURY_TYPES.map((type) => {
                const freq = field.value[type];
                const id = `injury-${type}`;
                return (
                  <li key={type} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
                    <label
                      htmlFor={id}
                      className="flex min-h-10 flex-1 cursor-pointer items-center gap-3 text-sm"
                    >
                      <input
                        id={id}
                        type="checkbox"
                        className="accent-primary size-5"
                        checked={!!freq}
                        onChange={(e) => {
                          const next = { ...field.value };
                          if (e.target.checked) next[type] = "occasionally";
                          else delete next[type];
                          field.onChange(next);
                        }}
                      />
                      {t(`injuries.${type}`)}
                    </label>
                    {freq && (
                      <select
                        aria-label={`${t(`injuries.${type}`)} — ${t("injuries.frequency")}`}
                        className={cn(inputClass, "h-10 w-auto appearance-auto text-sm")}
                        value={freq}
                        onChange={(e) =>
                          field.onChange({ ...field.value, [type]: e.target.value as typeof freq })
                        }
                      >
                        {INJURY_FREQUENCIES.map((f) => (
                          <option key={f} value={f}>
                            {t(`frequency.${f}`)}
                          </option>
                        ))}
                      </select>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        />
      </Field>

      <div className="space-y-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            className="accent-destructive size-5"
            {...register("currentlyInjured")}
          />
          {t("currentlyInjured.label")}
        </label>
        {injured && (
          <div
            role="alert"
            className="border-destructive/40 bg-destructive/5 flex gap-3 rounded-lg border p-3 text-sm"
          >
            <AlertTriangle className="text-destructive size-5 shrink-0" aria-hidden />
            <div className="space-y-1">
              <p>{t("currentlyInjured.warning")}</p>
              {errors.currentlyInjured && (
                <p className="text-destructive font-semibold">{t("errors.currently_injured")}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function StyleStep({ errors }: StepProps) {
  const t = useTranslations("form");
  const { control, setValue } = useFormContext<PlanFormValues>();
  const likes = useWatch({ control, name: "likes" });
  const dislikes = useWatch({ control, name: "dislikes" });
  const levelOf = (tag: PreferenceTag) =>
    likes.includes(tag) ? "like" : dislikes.includes(tag) ? "dislike" : "neutral";
  const setLevel = (tag: PreferenceTag, level: "like" | "neutral" | "dislike") => {
    setValue(
      "likes",
      level === "like" ? [...likes.filter((x) => x !== tag), tag] : likes.filter((x) => x !== tag),
    );
    setValue(
      "dislikes",
      level === "dislike"
        ? [...dislikes.filter((x) => x !== tag), tag]
        : dislikes.filter((x) => x !== tag),
    );
  };
  return (
    <div className="space-y-6">
      <Field id={fid("planStyle")} label={t("planStyle.label")} error={errors.planStyle} asGroup>
        <Controller
          control={control}
          name="planStyle"
          render={({ field }) => (
            <ChoiceCards
              name="planStyle"
              value={field.value}
              onChange={field.onChange}
              columns={1}
              choices={PLAN_STYLES.map((s) => ({
                value: s,
                label: t(`planStyle.${s}`),
                description: t(`planStyle.${s}Desc`),
              }))}
            />
          )}
        />
      </Field>
      <Field
        id={fid("likes")}
        label={t("preferences.label")}
        hint={t("preferences.hint")}
        asGroup
        optional
      >
        <ul className="space-y-3">
          {PREFERENCE_TAGS.map((tag) => (
            <li key={tag} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto]">
              <span className="text-sm font-medium">{t(`preferences.${tag}`)}</span>
              <Segmented
                label={t(`preferences.${tag}`)}
                value={levelOf(tag)}
                onChange={(v) => setLevel(tag, v)}
                options={(["dislike", "neutral", "like"] as const).map((v) => ({
                  value: v,
                  label: t(`preferences.${v}`),
                }))}
              />
            </li>
          ))}
        </ul>
      </Field>
    </div>
  );
}
