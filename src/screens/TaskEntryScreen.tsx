import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Briefcase,
  Calendar,
  Camera,
  ChevronDown,
  Clock,
  Code,
  Coffee,
  FileText,
  FolderOpen,
  Headphones,
  Laptop,
  Lightbulb,
  Mail,
  Mic,
  Music,
  Paintbrush,
  PenLine,
  Phone,
  Plus,
  Target,
  Video,
  X,
} from "lucide-react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { PomodoroDotPicker, normalizeEstimatePomos } from "../components/PomodoroDotPicker";
import { useSound } from "../audio/SoundProvider";
import { cn } from "../utils/cn";

export type TaskItem = {
  id: string;
  label: string;
  icon: string;
  /** Planned pomodoros (1–5); each block is 25 minutes */
  estimatePomodoros: number;
  /** Logged completed pomodoros — may exceed estimate until the task is archived */
  completedPomodoros: number;
};

export type HistoricalTaskItem = {
  id: string;
  label: string;
  icon: string;
  estimatePomodoros: number;
  /** Actual pomodoros logged before user checked complete */
  actualPomodoros: number;
  completedAt: number;
};

const MINUTES_PER_POMO = 25;

const TASK_ICONS: { id: string; Icon: LucideIcon }[] = [
  { id: "book", Icon: BookOpen },
  { id: "laptop", Icon: Laptop },
  { id: "mail", Icon: Mail },
  { id: "pen", Icon: PenLine },
  { id: "briefcase", Icon: Briefcase },
  { id: "coffee", Icon: Coffee },
  { id: "music", Icon: Music },
  { id: "headphones", Icon: Headphones },
  { id: "phone", Icon: Phone },
  { id: "calendar", Icon: Calendar },
  { id: "clock", Icon: Clock },
  { id: "target", Icon: Target },
  { id: "bulb", Icon: Lightbulb },
  { id: "code", Icon: Code },
  { id: "file", Icon: FileText },
  { id: "folder", Icon: FolderOpen },
  { id: "mic", Icon: Mic },
  { id: "video", Icon: Video },
  { id: "camera", Icon: Camera },
  { id: "brush", Icon: Paintbrush },
];

const LEGACY_ICON_ID: Record<string, string> = { wellness: "target" };

function resolveIconId(stored: string): string {
  return LEGACY_ICON_ID[stored] ?? stored;
}

function getIconComponent(storedId: string): LucideIcon {
  const id = resolveIconId(storedId);
  return TASK_ICONS.find((x) => x.id === id)?.Icon ?? BookOpen;
}

const TOUR_KEY = "foco_tasks_tour_done";

type TaskEntryScreenProps = {
  displayName: string;
  tasks: TaskItem[];
  historicalTasks: HistoricalTaskItem[];
  draft: string;
  onDraftChange: (v: string) => void;
  onAddTask: (label: string, iconId: string, estimatePomodoros: number) => void;
  onUpdateTask: (id: string, patch: Partial<Pick<TaskItem, "estimatePomodoros">>) => void;
  onArchiveTask: (id: string) => void;
  onRestoreHistoricalTask: (id: string) => void;
  onClearHistoricalTasks: () => void;
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onStartSession: () => void;
  onReuseTask: (task: TaskItem) => void;
  onOpenMenu?: () => void;
};

export function TaskEntryScreen({
  displayName,
  tasks,
  historicalTasks,
  draft,
  onDraftChange,
  onAddTask,
  onUpdateTask,
  onArchiveTask,
  onRestoreHistoricalTask,
  onClearHistoricalTasks,
  selectedTaskId,
  onSelectTask,
  onStartSession,
  onReuseTask,
  onOpenMenu,
}: TaskEntryScreenProps) {
  const { play } = useSound();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedIconId, setSelectedIconId] = useState("book");
  const [draftEstimate, setDraftEstimate] = useState(1);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [tourStep, setTourStep] = useState<1 | 2 | 3 | 4 | false>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(TOUR_KEY) === "1" ? false : 1;
  });

  const contentColumnRef = useRef<HTMLDivElement>(null);
  const tourAnchorInputRef = useRef<HTMLDivElement>(null);
  const tourAnchorEstimateRef = useRef<HTMLDivElement>(null);
  const tourAnchorStartRef = useRef<HTMLDivElement>(null);
  const [coachStyle, setCoachStyle] = useState<CSSProperties>({});

  const recalcCoachPosition = useCallback(() => {
    if (!tourStep) {
      setCoachStyle({});
      return;
    }
    const sanctuaryAnchor = document.querySelector('[data-tab="profile"]') as HTMLElement | null;
    const el =
      tourStep === 1
        ? tourAnchorInputRef.current
        : tourStep === 2
          ? tourAnchorEstimateRef.current
          : tourStep === 3
            ? sanctuaryAnchor
            : tourAnchorStartRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = Math.min(188, Math.max(160, 184));
    const estCardH = 208;
    let top = r.top + r.height / 2 - estCardH / 2;
    top = Math.max(12, Math.min(top, window.innerHeight - estCardH - 100));

    const col = contentColumnRef.current;
    let left: number;
    if (col) {
      const cr = col.getBoundingClientRect();
      left = cr.right - w - 8;
      if (left < cr.left + 8) left = cr.left + 8;
    } else {
      left = window.innerWidth - w - 16;
    }

    const sanctuary = tourStep === 3 && sanctuaryAnchor;
    if (sanctuary) {
      top = Math.max(14, sanctuary.getBoundingClientRect().top - 220);
      left = sanctuary.getBoundingClientRect().left - w + sanctuary.getBoundingClientRect().width;
    }

    setCoachStyle({
      position: "fixed",
      left,
      width: w,
      top,
      transform: "none",
      zIndex: 95,
    });
  }, [tourStep]);

  useLayoutEffect(() => {
    recalcCoachPosition();
  }, [recalcCoachPosition, tourStep]);

  useEffect(() => {
    if (!tourStep) return;
    const onResize = () => recalcCoachPosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    const id = window.requestAnimationFrame(onResize);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [tourStep, recalcCoachPosition, draft, tasks.length, selectedTaskId]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  useEffect(() => {
    if (!tourStep) return;
    play("notification", 0.42);
  }, [tourStep, play]);

  const finishTour = useCallback(() => {
    if (typeof localStorage !== "undefined") localStorage.setItem(TOUR_KEY, "1");
    setTourStep(false);
  }, []);

  const SelectedIcon = getIconComponent(selectedIconId);

  const addCurrent = () => {
    const t = draft.trim();
    if (!t) return;
    onAddTask(t, selectedIconId, draftEstimate);
    onDraftChange("");
    setDraftEstimate(1);
  };

  const updateDraftEstimateInput = (raw: string) => {
    const n = Number(raw);
    if (Number.isNaN(n)) {
      setDraftEstimate(1);
      return;
    }
    setDraftEstimate(normalizeEstimatePomos(n));
  };

  const updateTaskEstimateInput = (id: string, raw: string) => {
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    onUpdateTask(id, { estimatePomodoros: normalizeEstimatePomos(n) });
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const canStart = Boolean(selectedTask);

  const handleStart = () => {
    if (tourStep === 3) finishTour();
    onStartSession();
  };

  const tourHighlight = (step: 1 | 2 | 3 | 4) => tourStep === step;

  const formatHistTime = (ts: number) => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(ts);
    } catch {
      return "";
    }
  };

  return (
    <motion.div
      className="flex min-h-full flex-col px-5 pb-32 pt-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <AnimatePresence>
        {tourStep && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[80] bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <header className="header-glass relative z-[81] mb-6 flex items-center justify-between px-2 py-1.5 text-white">
        <button
          type="button"
          onClick={onOpenMenu}
          className="rounded-full p-2 opacity-80 hover:opacity-100"
          aria-label="Open menu"
        >
          <span className="block h-0.5 w-5 bg-white" />
        </button>
        <span className="font-serif text-lg font-semibold tracking-[0.14em]">FOCO</span>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-xs font-sans font-medium text-white"
          title={displayName}
        >
          {displayName.slice(0, 1).toUpperCase() || "?"}
        </div>
      </header>

      <div ref={contentColumnRef} className="relative z-[81] mx-auto w-full max-w-md flex-1">
        <h2 className="font-serif text-[1.55rem] font-semibold leading-tight text-white">Tasks</h2>

        <GlassCard className="mt-5 px-4 py-4">
          <p className="font-serif text-lg font-semibold text-zinc-900 dark:text-white">Add task</p>
          <div
            ref={tourAnchorInputRef}
            className={cn(
              "relative mt-4 flex gap-3 rounded-2xl transition-shadow",
              tourHighlight(1) && "relative z-[90] ring-2 ring-white ring-offset-2 ring-offset-black/20"
            )}
          >
            <div ref={wrapRef} className="relative flex-shrink-0">
              <motion.button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="dialog"
                aria-label="Choose task icon"
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200/80 bg-white/70 text-zinc-500 shadow-inner transition-[transform,box-shadow] hover:scale-[1.03] hover:text-zinc-700 hover:shadow-md active:scale-[0.97] dark:border-white/15 dark:bg-white/10 dark:text-white/70 dark:hover:text-white"
                whileTap={{ scale: 0.97 }}
              >
                <SelectedIcon className="h-5 w-5 stroke-[1.5]" />
              </motion.button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    role="dialog"
                    aria-label="Icons"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.22 }}
                    className="absolute bottom-[calc(100%+10px)] left-0 z-[80] w-[min(calc(100vw-2.5rem),280px)] rounded-2xl border border-white/30 bg-white/95 p-3 shadow-xl backdrop-blur-[20px] dark:border-white/15 dark:bg-black/80"
                  >
                    <div className="grid grid-cols-5 gap-2">
                      {TASK_ICONS.map(({ id, Icon }, idx) => (
                        <motion.button
                          key={id}
                          type="button"
                          aria-label={`Icon ${idx + 1}`}
                          aria-pressed={selectedIconId === id}
                          onClick={() => {
                            setSelectedIconId(id);
                            setMenuOpen(false);
                          }}
                          className={cn(
                            "flex aspect-square items-center justify-center rounded-xl border border-transparent text-zinc-400 transition-colors hover:bg-zinc-100/90 hover:text-zinc-700 dark:text-white/45 dark:hover:bg-white/10 dark:hover:text-white",
                            selectedIconId === id &&
                              "border-zinc-300/80 bg-zinc-100 text-zinc-800 ring-1 ring-zinc-900/10 dark:border-white/25 dark:bg-white/15 dark:text-white dark:ring-white/20"
                          )}
                          whileTap={{ scale: 0.94 }}
                        >
                          <Icon className="h-[18px] w-[18px] stroke-[1.5]" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="min-w-0 flex-1">
              <input
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCurrent();
                }}
                placeholder="What are you working on?"
                className="h-12 w-full rounded-2xl border border-zinc-200/80 bg-white/80 px-4 font-sans text-[15px] text-zinc-900 shadow-inner outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-white/45"
              />
            </div>
          </div>

          <div className="mt-5 border-t border-zinc-200/60 pt-4 dark:border-white/10">
            <p className="inline-flex items-center gap-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400/70 dark:text-white/35">
              <Clock className="h-3.5 w-3.5" />
              Estimate
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <PomodoroDotPicker value={draftEstimate} onChange={setDraftEstimate} />
              <input
                type="number"
                min={1}
                value={draftEstimate}
                onChange={(e) => updateDraftEstimateInput(e.target.value)}
                className="h-8 w-14 rounded-lg border border-zinc-300/80 bg-white/85 px-2 text-center font-sans text-xs text-zinc-700 outline-none dark:border-white/20 dark:bg-white/10 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <motion.button
              type="button"
              onClick={addCurrent}
              className="rounded-full bg-zinc-900 px-7 py-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition-[transform,box-shadow] hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] dark:bg-white dark:text-black"
              whileTap={{ scale: 0.98 }}
            >
              Add
            </motion.button>
          </div>
        </GlassCard>

        <p className="mb-2 mt-6 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:text-white/55">
          Task
        </p>
        <div className="space-y-2">
          {tasks.length === 0 && (
            <p className="rounded-2xl border border-dashed border-zinc-300/80 bg-white/30 py-8 text-center font-sans text-sm text-zinc-500 dark:border-white/20 dark:bg-white/5 dark:text-white/60">
              No tasks yet — add one above.
            </p>
          )}
          {tasks.map((t, index) => {
            const Ico = getIconComponent(t.icon);
            const selected = selectedTaskId === t.id;
            const est = normalizeEstimatePomos(t.estimatePomodoros);
            const bonus = t.completedPomodoros >= est;
            return (
              <GlassCard
                key={t.id}
                tabIndex={0}
                onClick={() => onSelectTask(t.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectTask(t.id);
                  }
                }}
                className={cn(
                  "cursor-pointer px-3 py-3 outline-none transition-[transform,box-shadow] sm:px-4",
                  selected &&
                    "ring-2 ring-[#2D3A2D]/85 ring-offset-2 ring-offset-transparent dark:ring-white/50 dark:ring-offset-transparent"
                )}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <button
                    type="button"
                    aria-label="Mark task complete and move to history"
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchiveTask(t.id);
                    }}
                    className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white/90 text-transparent transition-colors hover:border-emerald-600 hover:text-emerald-700 dark:border-white/30 dark:bg-white/10 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                  >
                    ✓
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 text-zinc-500 dark:bg-white/10 dark:text-white/75">
                        <Ico className="h-4 w-4 stroke-[1.5]" />
                      </div>
                      <p className="min-w-0 flex-1 font-sans text-sm font-medium text-zinc-900 dark:text-white">
                        {t.label}
                      </p>
                    </div>
                    <div
                      ref={index === 0 ? tourAnchorEstimateRef : undefined}
                      className={cn(
                        "mt-3 pl-[2.75rem]",
                        tourHighlight(2) && index === 0 && "relative z-[90] rounded-xl py-2 ring-2 ring-white ring-offset-2"
                      )}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3">
                        <PomodoroDotPicker
                          value={est}
                          onChange={(n) => onUpdateTask(t.id, { estimatePomodoros: n })}
                        />
                        <input
                          type="number"
                          min={1}
                          value={est}
                          onChange={(e) => updateTaskEstimateInput(t.id, e.target.value)}
                          className="h-8 w-14 rounded-lg border border-zinc-300/80 bg-white/85 px-2 text-center font-sans text-xs text-zinc-700 outline-none dark:border-white/20 dark:bg-white/10 dark:text-white"
                        />
                      </div>
                    </div>
                    <p className="mt-2 pl-[2.75rem] font-sans text-[11px] leading-snug text-zinc-600 dark:text-white/65">
                      Plan {MINUTES_PER_POMO * est} min ({est}×{MINUTES_PER_POMO} min)
                    </p>
                    <p className="mt-0.5 pl-[2.75rem] font-sans text-[11px] tabular-nums text-zinc-700 dark:text-white/70">
                      Logged {t.completedPomodoros} session{t.completedPomodoros !== 1 ? "s" : ""}
                      {bonus ? (
                        <span className="ml-2 font-medium text-amber-700 dark:text-amber-300"> · Bonus</span>
                      ) : null}
                    </p>
                  </div>
                  <div className="mt-1 flex min-w-[56px] flex-col items-end gap-2">
                    <span className="font-sans text-xs font-semibold tabular-nums text-zinc-700 dark:text-white/80">
                      {t.completedPomodoros}/{est}
                    </span>
                    <span className="font-sans text-[9px] uppercase tracking-wide text-zinc-400 dark:text-white/40">
                      done/plan
                    </span>
                  </div>
                  <motion.button
                    type="button"
                    className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white/80 text-zinc-700 dark:border-white/15 dark:bg-white/10 dark:text-white"
                    aria-label="Load into input"
                    onClick={(e) => {
                      e.stopPropagation();
                      const normalized = resolveIconId(t.icon);
                      setSelectedIconId(
                        TASK_ICONS.some((x) => x.id === normalized) ? normalized : "book"
                      );
                      setDraftEstimate(normalizeEstimatePomos(t.estimatePomodoros));
                      onReuseTask(t);
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="h-4 w-4" />
                  </motion.button>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {historicalTasks.length > 0 && (
          <>
            <div className="mb-2 mt-8 flex items-center justify-between">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:text-white/55">
                Historical tasks
              </p>
              <button
                type="button"
                onClick={() => setShowAllHistory(true)}
                className="font-sans text-[11px] text-zinc-600 underline underline-offset-2 dark:text-white/65"
              >
                See more
              </button>
            </div>
            <div className="space-y-2">
              {historicalTasks.slice(0, 3).map((h) => {
                const Ico = getIconComponent(h.icon);
                const estMin = h.estimatePomodoros * MINUTES_PER_POMO;
                const actMin = h.actualPomodoros * MINUTES_PER_POMO;
                return (
                  <GlassCard key={h.id} className="px-3 py-3 opacity-95 sm:px-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-white/70">
                        <Ico className="h-4 w-4 stroke-[1.5]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-sans text-sm font-medium text-zinc-800 line-through decoration-zinc-400 dark:text-white/85">
                          {h.label}
                        </p>
                        <p className="mt-2 font-sans text-[10px] leading-relaxed text-zinc-500 dark:text-white/55">
                          Est. {estMin} min ({h.estimatePomodoros} pomodoro
                          {h.estimatePomodoros !== 1 ? "s" : ""}) · Actual {actMin} min (
                          {h.actualPomodoros} logged)
                          {h.actualPomodoros !== h.estimatePomodoros ? (
                            <span className="text-zinc-600 dark:text-white/65">
                              {" "}
                              · Δ {h.actualPomodoros - h.estimatePomodoros > 0 ? "+" : ""}
                              {h.actualPomodoros - h.estimatePomodoros} vs est.
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 font-sans text-[9px] uppercase tracking-wide text-zinc-400 dark:text-white/40">
                          {formatHistTime(h.completedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRestoreHistoricalTask(h.id)}
                        className="rounded-full border border-zinc-300/90 px-3 py-1.5 font-sans text-[10px] font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-white/25 dark:text-white dark:hover:bg-white/10"
                      >
                        Restore
                      </button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </>
        )}

        <div
          ref={tourAnchorStartRef}
          className={cn(
            "mx-auto mt-8 max-w-sm",
            tourHighlight(4) && "relative z-[90] rounded-full ring-2 ring-white ring-offset-4 ring-offset-black/30"
          )}
        >
          <motion.button
            type="button"
            disabled={!canStart}
            onClick={handleStart}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-900 bg-zinc-950 py-3.5 font-sans text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-xl transition-[transform,box-shadow] hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white dark:text-black"
            whileTap={canStart ? { scale: 0.98 } : {}}
          >
            START
            <ChevronDown className="h-4 w-4 rotate-[-90deg]" aria-hidden />
          </motion.button>
          {!canStart && (
            <p className="mt-2 text-center font-sans text-[11px] text-white/50">Add a task to start.</p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {tourStep && (
          <motion.div
            className="pointer-events-auto"
            style={coachStyle}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.22 }}
          >
            <GlassCard className="max-h-[min(42vh,220px)] animate-[foco-breathe_4.6s_ease-in-out_infinite] overflow-y-auto rounded-2xl px-3 py-2.5 shadow-xl">
              <div className="flex items-start justify-between gap-1.5">
                <div className="min-w-0 pr-0.5">
                  <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-white/55">
                    Tour {tourStep}/4
                  </p>
                  <p className="mt-1.5 font-sans text-[11px] font-medium leading-snug text-zinc-900 dark:text-white">
                    {tourStep === 1 && "Define your focus here."}
                    {tourStep === 2 && "Estimate your effort in 25-min blocks."}
                    {tourStep === 3 &&
                      "Meet your pet here. Focus to help them grow and earn items."}
                    {tourStep === 4 && "Enter your focus sanctuary whenever you're ready."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={finishTour}
                  className="shrink-0 rounded-full p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Skip tour"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2.5 flex gap-1.5">
                {tourStep > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (tourStep === 2) setTourStep(1);
                      else if (tourStep === 3) setTourStep(2);
                      else if (tourStep === 4) setTourStep(3);
                    }}
                    className="flex-1 rounded-full border border-zinc-200 py-1.5 font-sans text-[11px] font-medium text-zinc-700 dark:border-white/20 dark:text-white"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (tourStep === 1) setTourStep(2);
                    else if (tourStep === 2) setTourStep(3);
                    else if (tourStep === 3) setTourStep(4);
                    else finishTour();
                  }}
                  className="flex-1 rounded-full bg-zinc-950 py-1.5 font-sans text-[11px] font-semibold text-white dark:bg-white dark:text-black"
                >
                  {tourStep === 4 ? "Done" : "Next"}
                </button>
              </div>
              <button
                type="button"
                onClick={finishTour}
                className="mt-1.5 w-full py-1 font-sans text-[10px] text-zinc-500 underline-offset-2 hover:underline dark:text-white/55"
              >
                Skip tour
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAllHistory && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-md"
            >
              <GlassCard className="max-h-[72vh] overflow-hidden px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-serif text-lg font-semibold text-zinc-900 dark:text-white">
                    Historical tasks
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAllHistory(false)}
                    aria-label="Close history"
                    className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:text-white/60 dark:hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-[56vh] space-y-2 overflow-y-auto pr-1">
                  {historicalTasks.map((h) => (
                    <GlassCard key={`modal-${h.id}`} className="px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-sans text-sm font-medium text-zinc-800 line-through dark:text-white/85">
                            {h.label}
                          </p>
                          <p className="mt-1 font-sans text-[10px] text-zinc-500 dark:text-white/60">
                            {h.actualPomodoros} / {h.estimatePomodoros} pomodoros · {formatHistTime(h.completedAt)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRestoreHistoricalTask(h.id)}
                          className="rounded-full border border-zinc-300/90 px-3 py-1.5 font-sans text-[10px] font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-white/25 dark:text-white dark:hover:bg-white/10"
                        >
                          Restore
                        </button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={onClearHistoricalTasks}
                    className="rounded-full border border-rose-300/80 px-4 py-2 font-sans text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-400/40 dark:text-rose-300 dark:hover:bg-rose-400/10"
                  >
                    Clear all
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAllHistory(false)}
                    className="rounded-full bg-zinc-900 px-4 py-2 font-sans text-xs font-semibold text-white dark:bg-white dark:text-black"
                  >
                    Done
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
