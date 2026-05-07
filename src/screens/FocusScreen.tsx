import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GlassCard } from "../components/GlassCard";
import { normalizeEstimatePomos } from "../components/PomodoroDotPicker";
import type { TaskItem } from "./TaskEntryScreen";
import { cn } from "../utils/cn";

function formatMmSs(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export type TimerPhase = "idle" | "focus" | "break";

const POMODORO_MINUTES = 25;

type FocusScreenProps = {
  timerPhase: TimerPhase;
  remainingSeconds: number;
  isRunning: boolean;
  activeTaskId: string | null;
  activeTaskLabel: string;
  tasks: TaskItem[];
  petEmoji: string;
  reflectionOpen?: boolean;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onStartSession: () => void;
  onToggleRunning: () => void;
  onTaskChange: (taskId: string) => void;
  onFinish: () => void;
  onSkipToNext: () => void;
};

export function FocusScreen({
  timerPhase,
  remainingSeconds,
  isRunning,
  activeTaskId,
  activeTaskLabel,
  tasks,
  petEmoji,
  reflectionOpen = false,
  selectedTaskId,
  onSelectTask,
  onStartSession,
  onToggleRunning,
  onTaskChange,
  onFinish,
  onSkipToNext,
}: FocusScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [idleTaskOpen, setIdleTaskOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const idleMenuRef = useRef<HTMLDivElement>(null);

  const liveFocus = timerPhase === "focus" && isRunning && remainingSeconds > 0;
  const liveBreak = timerPhase === "break" && isRunning && remainingSeconds > 0;
  const focusCompletedHold =
    timerPhase === "focus" && !isRunning && remainingSeconds === 0 && reflectionOpen;
  const live = liveFocus || liveBreak || focusCompletedHold;
  const countingState = liveFocus;

  const idlePreviewSeconds = POMODORO_MINUTES * 60;
  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : undefined;
  const canStart = Boolean(selectedTask);

  const selectedEst = selectedTask ? normalizeEstimatePomos(selectedTask.estimatePomodoros) : 0;
  const idleBonusNext = Boolean(selectedTask && selectedTask.completedPomodoros >= selectedEst);

  const focusTaskRunning = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : undefined;
  const focusEst = focusTaskRunning ? normalizeEstimatePomos(focusTaskRunning.estimatePomodoros) : 1;
  const bonusFocusRunning = Boolean(
    focusTaskRunning && focusTaskRunning.completedPomodoros >= focusEst
  );

  useEffect(() => {
    if (!menuOpen && !idleTaskOpen) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuOpen && menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
      if (idleTaskOpen && idleMenuRef.current && !idleMenuRef.current.contains(t))
        setIdleTaskOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen, idleTaskOpen]);

  const selectedLabel =
    tasks.find((t) => t.id === selectedTaskId)?.label ?? "Select a task";

  return (
    <motion.div
      className={cn(
        "relative flex min-h-full flex-col items-center justify-center px-5 pb-32 pt-6",
        countingState && "text-white"
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <AnimatePresence>
        {countingState && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.065) 1px, transparent 0)",
              backgroundSize: "12px 12px",
            }}
          />
        )}
      </AnimatePresence>

      {/* —— Idle: big clock + task picker + start —— */}
      {!live && (
        <div className="relative z-10 flex w-full max-w-md flex-col items-center">
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.35em] text-white/70">
            Focus
          </p>

          <div className="relative mx-auto flex aspect-square w-[min(88vw,20rem)] items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-white/5 blur-3xl" />
            <div className="pointer-events-none absolute inset-[4%] rounded-full border border-dashed border-white/20" />
            <div className="absolute inset-[10%] rounded-full border-[3px] border-white/25 bg-gradient-to-br from-zinc-900/95 to-black/90 shadow-[0_0_60px_rgba(0,0,0,0.4)]" />
            <div className="relative z-[1] flex flex-col items-center text-center">
              <span className="bg-gradient-to-b from-zinc-200 via-zinc-100 to-white bg-clip-text font-sans text-[clamp(3.5rem,14vw,5.5rem)] font-extralight tabular-nums leading-none tracking-tight text-transparent">
                {formatMmSs(idlePreviewSeconds)}
              </span>
              <span className="mt-4 text-3xl leading-none" aria-hidden>
                {petEmoji}
              </span>
              <p className="mt-3 max-w-[14rem] font-sans text-[11px] font-medium uppercase tracking-[0.25em] text-white/45">
                Ready
              </p>
            </div>
          </div>

          <p className="mt-8 max-w-sm text-center font-sans text-sm leading-relaxed text-white/70">
            Pick a task below. Each focus block is{" "}
            <span className="text-white/90">{POMODORO_MINUTES} minutes</span>. Tap Start when you&apos;re
            ready — you can always finish early.
          </p>

          <GlassCard className="mt-8 w-full px-4 py-3">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-white/55">
              Current task
            </p>
            <div className="relative mt-3" ref={idleMenuRef}>
              <motion.button
                type="button"
                onClick={() => setIdleTaskOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-2 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-3.5 text-left font-sans text-sm font-medium text-zinc-900 shadow-inner dark:border-white/15 dark:bg-white/10 dark:text-white"
                whileTap={{ scale: 0.99 }}
              >
                <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
                <ChevronDown className={cn("h-4 w-4 flex-shrink-0", idleTaskOpen && "rotate-180")} />
              </motion.button>
              <AnimatePresence>
                {idleTaskOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-52 overflow-y-auto rounded-2xl border border-white/20 bg-white/95 py-1 shadow-xl backdrop-blur-[20px] dark:border-white/15 dark:bg-black/75"
                  >
                    {tasks.length === 0 ? (
                      <p className="px-4 py-6 text-center font-sans text-sm text-zinc-500 dark:text-white/55">
                        Add tasks on the Tasks tab first.
                      </p>
                    ) : (
                      tasks.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            onSelectTask(t.id);
                            setIdleTaskOpen(false);
                          }}
                          className={cn(
                            "flex w-full px-4 py-3 text-left font-sans text-sm transition-colors",
                            t.id === selectedTaskId
                              ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                              : "text-zinc-900 hover:bg-zinc-100 dark:text-white dark:hover:bg-white/10"
                          )}
                        >
                          {t.label}
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>

          {idleBonusNext && (
            <p className="mt-6 max-w-sm text-center font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-amber-200/95">
              Bonus session next
            </p>
          )}
          <p className="mt-4 max-w-sm text-center font-sans text-[10px] leading-relaxed text-white/55">
            Past your planned pomodoros still counts toward the task until you ✓ complete it on Tasks.
          </p>

          <motion.button
            type="button"
            disabled={!canStart}
            onClick={onStartSession}
            className="mt-8 w-full max-w-sm rounded-full border border-transparent bg-[var(--foco-accent)] py-4 font-sans text-sm font-semibold uppercase tracking-[0.2em] text-[var(--foco-accent-contrast)] shadow-xl transition-[transform,box-shadow] hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            whileTap={canStart ? { scale: 0.98 } : {}}
          >
            Start
          </motion.button>
        </div>
      )}

      {/* —— Running: pomodoro / break / reflection hold —— */}
      {live && (
        <div className="relative z-10 flex min-h-[62vh] w-full flex-col items-center justify-center">
          <div className="mb-3 text-center">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.35em] text-white/75">
              {liveBreak ? "Break" : focusCompletedHold ? "Done" : bonusFocusRunning ? "Bonus session" : "Pomodoro"}
            </p>
            {liveFocus && bonusFocusRunning && (
              <p className="mt-2 font-sans text-[10px] text-white/55">Beyond your estimate — finish when ready, then ✓ on Tasks.</p>
            )}
          </div>
          <div className="relative z-10 mx-auto flex h-[min(72vw,16rem)] w-[min(72vw,16rem)] max-h-[16rem] max-w-[16rem] items-center justify-center sm:h-[13.5rem] sm:w-[13.5rem]">
            {liveBreak ? (
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-800/40 to-zinc-900/30 blur-xl" />
            ) : (
              <div className="absolute inset-0 rounded-full bg-zinc-500/20 blur-2xl" />
            )}
            <div
              className={cn(
                "pointer-events-none absolute inset-1 rounded-full border border-dashed opacity-50",
                liveBreak ? "border-emerald-200/50" : "border-white/35"
              )}
              aria-hidden
            />
            <div
              className={cn(
                "absolute inset-4 rounded-full border-[3px] shadow-2xl",
                liveBreak
                  ? "border-emerald-600/90 bg-gradient-to-br from-emerald-900/50 to-zinc-900/70"
                  : "border-zinc-100/90 bg-gradient-to-br from-zinc-900/90 to-black/80"
              )}
            />
            <div className="relative z-[1] text-center">
              <p
                className={cn(
                  "bg-gradient-to-b from-zinc-300 via-zinc-100 to-white bg-clip-text font-sans text-[clamp(2.25rem,10vw,2.75rem)] font-light tabular-nums tracking-tight text-transparent",
                  countingState && "animate-[foco-breathe_4.6s_ease-in-out_infinite]"
                )}
              >
                {formatMmSs(focusCompletedHold ? 0 : remainingSeconds)}
              </p>
              <p
                className={cn(
                  "mt-4 text-3xl leading-none",
                  countingState && "animate-[foco-pet-glow_3.4s_ease-in-out_infinite]"
                )}
                aria-hidden
              >
                {petEmoji}
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-8 w-full max-w-md px-1">
            <p className="text-center font-serif text-lg text-white">
              {liveBreak
                ? "Step away. Breathe."
                : focusCompletedHold
                  ? "Complete the reflection, then your break will start."
                  : "Stay with one thing."}
            </p>

            {liveFocus && (
              <div className="relative mx-auto mt-6 flex justify-center" ref={menuRef}>
                <motion.button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex max-w-full items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 font-sans text-sm font-medium text-white backdrop-blur-md transition-[transform,box-shadow] hover:scale-[1.02] hover:bg-white/15"
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="max-w-[220px] truncate">{activeTaskLabel || "Task"}</span>
                  <ChevronDown
                    className={cn("h-4 w-4 flex-shrink-0 transition-transform", menuOpen && "rotate-180")}
                  />
                </motion.button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-[calc(100%+10px)] left-1/2 z-30 w-[min(100%,280px)] -translate-x-1/2 rounded-2xl border border-white/20 bg-white/90 p-2 shadow-xl backdrop-blur-[20px] dark:border-white/15 dark:bg-black/60"
                    >
                      <p className="px-3 pb-2 pt-1 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-white/55">
                        Switch task (timer keeps running)
                      </p>
                      <div className="max-h-48 overflow-y-auto">
                        {tasks.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              onTaskChange(t.id);
                              setMenuOpen(false);
                            }}
                            className={cn(
                              "flex w-full rounded-xl px-3 py-2.5 text-left font-sans text-sm transition-colors",
                              t.id === activeTaskId
                                ? "bg-zinc-950 text-white dark:bg-white dark:text-black"
                                : "text-zinc-900 hover:bg-zinc-100 dark:text-white dark:hover:bg-white/10"
                            )}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {!focusCompletedHold && (
            <div className="relative z-10 mt-12 flex items-center gap-3">
              <motion.button
                type="button"
                onClick={liveBreak ? onFinish : onToggleRunning}
                className="rounded-full border border-white/25 bg-white/10 px-12 py-3 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md transition-[transform,box-shadow] hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {liveBreak ? "Skip break" : isRunning ? "Pause" : "Start"}
              </motion.button>
              <motion.button
                type="button"
                onClick={onSkipToNext}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-[transform,box-shadow] hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label={liveBreak ? "Next focus" : "End early and reflect"}
                title={liveBreak ? "Next focus" : "End early and reflect"}
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
