"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { FieldError } from "./form-model";

export const inputClass =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 h-11 w-full min-w-0 rounded-lg border px-3 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-3 aria-invalid:ring-3 disabled:opacity-50";

interface FieldProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: FieldError;
  optional?: boolean;
  children: ReactNode;
  /** Render the label as a legend (for groups of controls). */
  asGroup?: boolean;
}

/** Label + control + hint + translated error, wired with aria attributes. */
export function Field({ id, label, hint, error, optional, children, asGroup }: FieldProps) {
  const t = useTranslations("form.errors");
  const tc = useTranslations("common");
  const labelContent = (
    <>
      {label}
      {optional && (
        <span className="text-muted-foreground ml-1 text-xs font-normal">({tc("optional")})</span>
      )}
    </>
  );
  const message = error
    ? t.has(error.message)
      ? t(error.message, error.params)
      : t("generic")
    : null;
  const body = (
    <>
      {hint && (
        <p id={`${id}-hint`} className="text-muted-foreground text-sm">
          {hint}
        </p>
      )}
      {children}
      {message && (
        <p id={`${id}-error`} role="alert" className="text-destructive text-sm font-medium">
          {message}
        </p>
      )}
    </>
  );
  if (asGroup) {
    return (
      <fieldset
        className="space-y-2"
        aria-describedby={describedBy(id, hint, error)}
        aria-invalid={!!error}
      >
        <legend className="mb-2 text-sm font-semibold">{labelContent}</legend>
        {body}
      </fieldset>
    );
  }
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold">
        {labelContent}
      </label>
      {body}
    </div>
  );
}

export function describedBy(id: string, hint: unknown, error: unknown): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

interface SuffixInputProps extends InputHTMLAttributes<HTMLInputElement> {
  suffix?: string;
}

/** Text input with a unit suffix (km, mi, m, ft…). */
export const SuffixInput = forwardRef<HTMLInputElement, SuffixInputProps>(function SuffixInput(
  { suffix, className, ...props },
  ref,
) {
  return (
    <div className="relative">
      <input ref={ref} className={cn(inputClass, suffix && "pr-12", className)} {...props} />
      {suffix && (
        <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm">
          {suffix}
        </span>
      )}
    </div>
  );
});

interface Choice<T extends string> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
}

/** Accessible radio group rendered as tappable cards. */
export function ChoiceCards<T extends string>({
  name,
  value,
  onChange,
  choices,
  columns = 2,
  invalid,
}: {
  name: string;
  value: T | "";
  onChange: (v: T) => void;
  choices: Choice<T>[];
  columns?: 1 | 2 | 3;
  invalid?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-2 sm:grid-cols-3",
      )}
    >
      {choices.map((c) => {
        const checked = c.value === value;
        return (
          <label
            key={c.value}
            className={cn(
              "has-focus-visible:ring-ring/50 relative flex min-h-12 cursor-pointer flex-col justify-center rounded-lg border p-3 transition-colors has-focus-visible:ring-3",
              checked ? "border-primary bg-primary/5 ring-primary ring-1" : "hover:bg-muted/60",
              invalid && !value && "border-destructive",
            )}
          >
            <input
              type="radio"
              name={name}
              value={c.value}
              checked={checked}
              onChange={() => onChange(c.value)}
              className="sr-only"
            />
            <span className="flex items-center justify-between gap-2 text-sm font-semibold">
              {c.label}
              {checked && <Check className="text-primary size-4 shrink-0" aria-hidden />}
            </span>
            {c.description && (
              <span className="text-muted-foreground mt-1 text-xs leading-5">{c.description}</span>
            )}
          </label>
        );
      })}
    </div>
  );
}

/** Multi-select chips (checkboxes). */
export function ChipGroup<T extends string>({
  values,
  onChange,
  options,
}: {
  values: T[];
  onChange: (v: T[]) => void;
  options: { value: T; label: string; title?: string }[];
}) {
  const id = useId();
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const checked = values.includes(o.value);
        return (
          <label
            key={o.value}
            title={o.title}
            className={cn(
              "has-focus-visible:ring-ring/50 flex min-h-11 min-w-12 cursor-pointer items-center justify-center rounded-full border px-4 text-sm font-semibold transition-colors select-none has-focus-visible:ring-3",
              checked ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted",
            )}
          >
            <input
              type="checkbox"
              id={`${id}-${o.value}`}
              className="sr-only"
              checked={checked}
              onChange={() =>
                onChange(checked ? values.filter((v) => v !== o.value) : [...values, o.value])
              }
            />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}

/** Three-way segmented control (e.g. dislike / neutral / like). */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="bg-muted flex rounded-lg p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "focus-visible:ring-ring min-h-9 flex-1 rounded-md px-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
            o.value === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
