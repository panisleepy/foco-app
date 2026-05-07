import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { GlassCard } from "./GlassCard";

type ReflectionModalProps = {
  open: boolean;
  onContinue: (summary: string, wasDistracted: boolean) => void;
  onSkip: () => void;
};

export function ReflectionModal({ open, onContinue, onSkip }: ReflectionModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [focusQuality, setFocusQuality] = useState(0);
  const [distractionIds, setDistractionIds] = useState<string[]>([]);
  const [mood, setMood] = useState<(typeof MOOD_OPTIONS)[number]["id"] | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setFocusQuality(0);
      setDistractionIds([]);
      setMood(null);
    }
  }, [open]);

  const goNext = () => {
    if (step < 3) {
      setStep((s) => (s + 1) as 2 | 3);
      return;
    }
    const summary = JSON.stringify({
      focusQuality,
      distractionIds,
      mood,
    });
    onContinue(summary, distractionIds.length > 0);
  };

  const skip = () => {
    onSkip();
  };

  const toggleDistraction = (id: string) => {
    setDistractionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center px-4 pb-28 pt-10 sm:items-center sm:pb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={skip} />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="px-6 py-7">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:text-white/55">
                  Reflection {step}/3
                </p>
                <button
                  type="button"
                  onClick={skip}
                  className="font-sans text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-white/65"
                >
                  Skip
                </button>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-200/70 dark:bg-white/12">
                <motion.div
                  className="h-full rounded-full bg-[#2D3A2D] dark:bg-white/80"
                  animate={{ width: `${(step / 3) * 100}%` }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                />
              </div>

              <div className="mt-5 min-h-[190px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 22 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -22 }}
                    transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {step === 1 && (
                      <>
                        <h3 className="font-serif text-xl font-semibold text-zinc-900 dark:text-white">
                          How was your flow?
                        </h3>
                        <p className="mt-2 font-sans text-sm text-zinc-600 dark:text-white/70">
                          Tap one dot to rate this session.
                        </p>
                        <div className="mt-8 flex items-center justify-center gap-3">
                          {[1, 2, 3, 4, 5].map((i) => {
                            const active = i <= focusQuality;
                            const color =
                              i === 1
                                ? "from-zinc-300/70 to-zinc-100/70"
                                : i === 2
                                  ? "from-zinc-300/80 to-zinc-100/90"
                                  : i === 3
                                    ? "from-emerald-200/90 to-emerald-100"
                                    : i === 4
                                      ? "from-emerald-400 to-emerald-300"
                                      : "from-[#1f5537] to-[#2D7A4F]";
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setFocusQuality(i)}
                                aria-label={`Flow quality ${i}`}
                                className={`h-6 w-6 rounded-full border transition-all ${
                                  active
                                    ? `bg-gradient-to-br ${color} border-white/40 shadow-[0_0_14px_rgba(31,85,55,0.36)]`
                                    : "border-zinc-300/70 bg-white/35 backdrop-blur-sm dark:border-white/30 dark:bg-white/8"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <h3 className="font-serif text-xl font-semibold text-zinc-900 dark:text-white">
                          Any distractions?
                        </h3>
                        <p className="mt-2 font-sans text-sm text-zinc-600 dark:text-white/70">
                          Select all that applied.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {DISTRACTION_REASONS.map((r) => {
                            const selected = distractionIds.includes(r.id);
                            return (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => toggleDistraction(r.id)}
                                className={`rounded-full border px-4 py-2 font-sans text-xs font-medium transition ${
                                  selected
                                    ? "border-[#2D3A2D]/80 bg-[#2D3A2D]/85 text-white dark:border-white/45 dark:bg-white/20"
                                    : "border-zinc-200/70 bg-white/40 text-zinc-800 backdrop-blur-md hover:bg-white/55 dark:border-white/20 dark:bg-white/8 dark:text-white"
                                }`}
                              >
                                {r.label}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {step === 3 && (
                      <>
                        <h3 className="font-serif text-xl font-semibold text-zinc-900 dark:text-white">
                          How do you feel now?
                        </h3>
                        <p className="mt-2 font-sans text-sm text-zinc-600 dark:text-white/70">
                          Pick one mood for this check-in.
                        </p>
                        <div className="mt-5 grid grid-cols-2 gap-2">
                          {MOOD_OPTIONS.map((m) => {
                            const selected = mood === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setMood(m.id)}
                                className={`rounded-2xl border px-3 py-3 text-left font-sans text-sm transition ${
                                  selected
                                    ? "border-[#2D3A2D]/80 bg-[#2D3A2D]/85 text-white dark:border-white/45 dark:bg-white/20"
                                    : "border-zinc-200/75 bg-white/40 text-zinc-800 backdrop-blur-md dark:border-white/20 dark:bg-white/8 dark:text-white"
                                }`}
                              >
                                <span className="mr-1.5">{m.icon}</span>
                                {m.label}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-6 flex gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                    className="flex-1 rounded-full border border-zinc-200 py-3 font-sans text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={goNext}
                  className="flex-1 rounded-full bg-[#2D3A2D] py-3 font-sans text-sm font-semibold text-white shadow-md transition hover:opacity-95 dark:bg-white dark:text-black"
                >
                  {step === 3 ? "Continue" : "Next"}
                </button>
              </div>
              <button
                type="button"
                onClick={skip}
                className="mt-3 w-full text-center font-sans text-[11px] text-zinc-500 underline-offset-2 hover:underline dark:text-white/60"
              >
                Skip to dashboard
              </button>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const MOOD_OPTIONS = [
  { id: "calm", label: "Calm", icon: "😌" },
  { id: "accomplished", label: "Accomplished", icon: "✅" },
  { id: "exhausted", label: "Exhausted", icon: "😮‍💨" },
  { id: "neutral", label: "Neutral", icon: "😐" },
] as const;

const DISTRACTION_REASONS = [
  { id: "phone", label: "Phone" },
  { id: "social", label: "Social / notifications" },
  { id: "mind", label: "Wandering thoughts" },
  { id: "fatigue", label: "Fatigue" },
  { id: "other", label: "Other" },
] as const;

type DistractionModalProps = {
  open: boolean;
  onPick: (reasonId: string) => void;
  onDismiss: () => void;
};

export function DistractionModal({ open, onPick, onDismiss }: DistractionModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center px-4 pb-28 pt-10 sm:items-center sm:pb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onDismiss} />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="relative z-10 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="px-6 py-7">
              <h3 className="font-serif text-xl font-semibold text-zinc-900 dark:text-white">Ended early</h3>
              <p className="mt-2 font-sans text-sm text-zinc-600 dark:text-white/70">
                What pulled you away? (optional)
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {DISTRACTION_REASONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onPick(r.id)}
                    className="rounded-full border border-zinc-200/90 bg-white/80 px-4 py-2.5 font-sans text-xs font-medium text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onDismiss}
                className="mt-6 w-full rounded-full border border-zinc-200 py-3 font-sans text-sm text-zinc-600 dark:border-white/20 dark:text-white/75"
              >
                Close
              </button>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
