import { cn } from "../utils/cn";

export const POMO_ESTIMATE_MAX = 5;

/** Planned pomodoros (focus blocks). Numeric input is unbounded, minimum 1. */
export function normalizeEstimatePomos(n: number): number {
  return Math.max(1, Math.round(n));
}

type PomodoroDotPickerProps = {
  value: number;
  onChange: (n: number) => void;
  className?: string;
};

/**
 * Minimal dot row: filled dots = estimate (1–5). Deep green active, frosted inactive.
 */
export function PomodoroDotPicker({ value, onChange, className }: PomodoroDotPickerProps) {
  const v = Math.min(POMO_ESTIMATE_MAX, normalizeEstimatePomos(value));
  return (
    <div
      className={cn("flex items-center gap-2.5", className)}
      role="group"
      aria-label={`Estimated pomodoros: ${v}`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`Estimate ${i} session${i === 1 ? "" : "s"}`}
          aria-pressed={i <= v}
          onClick={(e) => {
            e.stopPropagation();
            onChange(i);
          }}
          className={cn(
            "h-4 w-4 shrink-0 rounded-full transition-[background,transform,box-shadow] active:scale-90",
            i <= v
              ? "bg-[#153828] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-black/25 dark:bg-[#1e4634] dark:ring-emerald-900/40"
              : "bg-white/45 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] backdrop-blur-[8px] ring-1 ring-white/80 dark:bg-white/18 dark:ring-white/40"
          )}
        />
      ))}
    </div>
  );
}
