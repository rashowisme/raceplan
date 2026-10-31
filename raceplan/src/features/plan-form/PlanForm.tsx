"use client";

import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { generatePlan } from "@/engine";
import { unitStore, useUnit } from "@/features/units/useUnit";
import { useRouter } from "@/i18n/navigation";
import { localToday } from "@/lib/today";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { CURRENT_PLAN_ID } from "@/features/plan-calendar/useCurrentPlan";
import { getPlanRepository, PLAN_CHANGED_EVENT } from "@/storage";
import { clearDraft, loadDraft, saveDraft, type FormDraft } from "./draft";
import { racePrefill } from "./race-prefill";
import {
  convertUnits,
  DEFAULT_VALUES,
  stepOfField,
  STEPS,
  validateStep,
  validateWithEngine,
  type FieldError,
  type PlanFormValues,
} from "./form-model";
import {
  FitnessStep,
  HealthStep,
  RaceStep,
  StyleStep,
  TrainingStep,
  type StepErrors,
} from "./steps";

const STEP_COMPONENTS = {
  race: RaceStep,
  fitness: FitnessStep,
  training: TrainingStep,
  health: HealthStep,
  style: StyleStep,
};

/** The form reads its draft from localStorage, so it only renders after hydration. */
const FORM_SKELETON = (
  <div className="mx-auto h-96 w-full max-w-xl animate-pulse px-4 py-10" aria-busy />
);

/** Reading the search params needs a Suspense boundary on a static page. */
export function PlanForm() {
  return (
    <Suspense fallback={FORM_SKELETON}>
      <HydratedPlanForm />
    </Suspense>
  );
}

function HydratedPlanForm() {
  const hydrated = useHydrated();
  const course = useSearchParams().get("course");
  if (!hydrated) return FORM_SKELETON;
  return <PlanFormInner initialDraft={loadDraft()} course={course} />;
}

function PlanFormInner({
  initialDraft,
  course,
}: {
  initialDraft: FormDraft | null;
  /** Race guide slug from "Create my plan for <race>" links. */
  course: string | null;
}) {
  const t = useTranslations("form");
  const router = useRouter();
  const [unit] = useUnit();
  // "Create my plan for <race>" links pre-fill the race step.
  const [prefill] = useState(() =>
    racePrefill(
      initialDraft ? convertUnits(initialDraft.values, initialDraft.unit, unit) : DEFAULT_VALUES,
      course,
      unit,
      localToday(),
    ),
  );
  const form = useForm<PlanFormValues>({
    defaultValues:
      prefill?.values ??
      (initialDraft ? convertUnits(initialDraft.values, initialDraft.unit, unit) : DEFAULT_VALUES),
  });
  const [step, setStep] = useState(() =>
    prefill ? 0 : Math.min(initialDraft?.step ?? 0, STEPS.length - 1),
  );
  const [errors, setErrors] = useState<StepErrors>({});
  const [refusal, setRefusal] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [restored, setRestored] = useState(initialDraft !== null);
  const [today] = useState(() => localToday());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const unitRef = useRef(unit);

  // Convert typed distances when the unit toggle changes.
  useEffect(
    () =>
      unitStore.subscribe(() => {
        const next = unitStore.get();
        if (next === unitRef.current) return;
        form.reset(convertUnits(form.getValues(), unitRef.current, next));
        unitRef.current = next;
        setErrors({});
      }),
    [form],
  );

  // Clear a field's error as soon as the user edits it.
  const { subscribe } = form;
  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: ({ name }) => {
          const field = name?.split(".")[0] as keyof PlanFormValues | undefined;
          if (!field) return;
          setErrors((prev) => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
          });
        },
      }),
    [subscribe],
  );

  // Persist the draft on every change.
  const values = useWatch({ control: form.control });
  useEffect(() => {
    saveDraft({ values: form.getValues(), unit: unitRef.current, step });
  }, [values, step, form]);

  const stepId = STEPS[step]!;
  const StepComponent = STEP_COMPONENTS[stepId];
  const isLast = step === STEPS.length - 1;

  const toErrorMap = (list: FieldError[]): StepErrors =>
    Object.fromEntries(list.map((e) => [e.field, e])) as StepErrors;

  const goTo = (next: number) => {
    setStep(next);
    setErrors({});
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const focusFirstError = (list: FieldError[]) => {
    requestAnimationFrame(() => {
      const first = list[0];
      if (!first) return;
      const el =
        document.getElementById(`field-${first.field}`) ??
        document.querySelector("[aria-invalid=true]");
      (el as HTMLElement | null)?.focus?.();
    });
  };

  const onNext = () => {
    const list = validateStep(stepId, form.getValues(), unit, today);
    setErrors(toErrorMap(list));
    if (list.length > 0) return focusFirstError(list);
    goTo(step + 1);
  };

  const onSubmit = async () => {
    setRefusal(null);
    const v = form.getValues();
    // Re-validate every step, jump to the first one with an error.
    for (let i = 0; i < STEPS.length; i++) {
      const list = validateStep(STEPS[i]!, v, unit, today);
      if (list.length > 0) {
        setStep(i);
        setErrors(toErrorMap(list));
        return focusFirstError(list);
      }
    }
    const checked = validateWithEngine(v, unit, today);
    if (!checked.ok) {
      if (checked.refusal) return setRefusal(checked.refusal);
      const first = checked.errors[0];
      if (first) {
        setStep(STEPS.indexOf(stepOfField(first.field)));
        setErrors(toErrorMap(checked.errors));
        focusFirstError(checked.errors);
      }
      return;
    }
    setSubmitting(true);
    // Keep a time trial result entered on the previous plan (it's fitness data).
    const previous = await getPlanRepository().load(CURRENT_PLAN_ID);
    const timeTrialResult = previous?.plan.profile.timeTrialResult;
    const result = generatePlan(
      timeTrialResult ? { ...checked.profile, timeTrialResult } : checked.profile,
      { today },
    );
    if (!result.ok) {
      setSubmitting(false);
      return setRefusal(result.refusal.code);
    }
    await getPlanRepository().save(result.plan, CURRENT_PLAN_ID);
    window.dispatchEvent(new Event(PLAN_CHANGED_EVENT));
    router.push("/plan");
  };

  const startOver = () => {
    clearDraft();
    form.reset(DEFAULT_VALUES);
    setRestored(false);
    setRefusal(null);
    goTo(0);
  };

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (isLast) void onSubmit();
          else onNext();
        }}
        className="mx-auto w-full max-w-xl px-4 py-6 sm:py-10"
      >
        <div className="mb-6">
          <p className="text-muted-foreground text-sm font-medium">
            {t("stepOf", { current: step + 1, total: STEPS.length })}
          </p>
          <ol className="mt-2 flex gap-1.5" aria-hidden>
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")}
              />
            ))}
          </ol>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-5 text-2xl font-bold tracking-tight outline-none"
          >
            {t(`steps.${stepId}`)}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t(`stepIntro.${stepId}`)}</p>
        </div>

        {prefill && step === 0 && (
          <p role="status" className="bg-primary/5 mb-6 rounded-lg px-3 py-2 text-sm">
            {t("racePrefilled", { name: prefill.guide.name })}
          </p>
        )}
        {restored && !prefill && step === 0 && (
          <div className="bg-muted mb-6 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm">
            <span>{t("draftRestored")}</span>
            <Button type="button" variant="ghost" size="sm" onClick={startOver}>
              <RotateCcw aria-hidden />
              {t("startOver")}
            </Button>
          </div>
        )}

        <StepComponent errors={errors} unit={unit} today={today} />

        {refusal && (
          <div
            role="alert"
            className="border-destructive/40 bg-destructive/5 mt-6 flex gap-3 rounded-lg border p-3 text-sm"
          >
            <AlertTriangle className="text-destructive size-5 shrink-0" aria-hidden />
            <p>{t(`refusal.${refusal}` as "refusal.invalid_input")}</p>
          </div>
        )}

        <div className="bg-background/95 sticky bottom-0 -mx-4 mt-8 flex gap-3 border-t px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 sm:flex-none"
              onClick={() => goTo(step - 1)}
            >
              <ArrowLeft aria-hidden />
              {t("back")}
            </Button>
          )}
          <Button
            type="submit"
            className="h-11 flex-[2] sm:ml-auto sm:flex-none sm:px-6"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                {t("generating")}
              </>
            ) : isLast ? (
              <>
                <Sparkles aria-hidden />
                {t("submit")}
              </>
            ) : (
              <>
                {t("next")}
                <ArrowRight aria-hidden />
              </>
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
