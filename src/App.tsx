import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSound } from "./audio/SoundProvider";
import { BottomNav, type TabKey } from "./components/BottomNav";
import { PageBackground } from "./components/PageBackground";
import { DistractionModal, ReflectionModal } from "./components/SessionModals";
import { ShimmerOverlay } from "./components/ShimmerOverlay";
import { ChooseCompanionScreen } from "./screens/ChooseCompanionScreen";
import { CreateAccountScreen } from "./screens/CreateAccountScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { FocusScreen, type TimerPhase } from "./screens/FocusScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { QuickThingsScreen } from "./screens/QuickThingsScreen";
import {
  TellUsAboutYouScreen,
  type AboutYouState,
} from "./screens/TellUsAboutYouScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { SanctuaryScreen } from "./screens/SanctuaryScreen";
import { normalizeEstimatePomos } from "./components/PomodoroDotPicker";
import {
  TaskEntryScreen,
  type HistoricalTaskItem,
  type TaskItem,
} from "./screens/TaskEntryScreen";
import { WelcomeScreen } from "./screens/WelcomeScreen";

type Stage = "welcome" | "email" | "name" | "about" | "legal" | "companion" | "main";
type ProfileSubpage = "sanctuary" | "settings";
type SidebarItem = "guide" | "milestones" | "support";
type FocusLogItem = {
  id: string;
  timestamp: number;
  project: string;
  task: string;
  minutes: number;
};

const SPARKLE_MS = 1100;
const XP_PER_POMO = 12;
const POMODORO_MINUTES = 25;

const PET_OPTIONS = ["🦊", "🐱", "🐶", "🐰"] as const;

const EMPTY_ABOUT: AboutYouState = {
  lifestyle: [],
  pursuits: [],
  focusType: [],
};

const LS_TASKS_KEY = "foco_tasks_v4";
const LS_HIST_KEY = "foco_historical_v1";
const LS_FOCUS_LOGS_KEY = "foco_focus_logs_v1";

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: "seed-1",
    label: "Read Chapter 4",
    icon: "book",
    estimatePomodoros: 3,
    completedPomodoros: 0,
  },
  {
    id: "seed-2",
    label: "Inbox Zero",
    icon: "mail",
    estimatePomodoros: 2,
    completedPomodoros: 1,
  },
];

function normalizeTaskRow(row: unknown): TaskItem | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  return {
    id: String(o.id ?? `${Date.now()}`),
    label: String(o.label ?? ""),
    icon: String(o.icon ?? "book"),
    estimatePomodoros: normalizeEstimatePomos(Number(o.estimatePomodoros) || 1),
    completedPomodoros: Math.max(0, Number(o.completedPomodoros) || 0),
  };
}

function loadTasksFromStorage(): TaskItem[] {
  try {
    const raw = localStorage.getItem(LS_TASKS_KEY);
    if (!raw) return DEFAULT_TASKS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_TASKS;
    const cleaned = parsed.map(normalizeTaskRow).filter(Boolean) as TaskItem[];
    return cleaned.length > 0 ? cleaned : DEFAULT_TASKS;
  } catch {
    return DEFAULT_TASKS;
  }
}

function normalizeHistRow(row: unknown): HistoricalTaskItem | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  return {
    id: String(o.id ?? `${Date.now()}`),
    label: String(o.label ?? ""),
    icon: String(o.icon ?? "book"),
    estimatePomodoros: normalizeEstimatePomos(Number(o.estimatePomodoros) || 1),
    actualPomodoros: Math.max(0, Number(o.actualPomodoros) || 0),
    completedAt: Number(o.completedAt) || Date.now(),
  };
}

function loadHistoricalFromStorage(): HistoricalTaskItem[] {
  try {
    const raw = localStorage.getItem(LS_HIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeHistRow).filter(Boolean) as HistoricalTaskItem[];
  } catch {
    return [];
  }
}

function normalizeFocusLogRow(row: unknown): FocusLogItem | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  return {
    id: String(o.id ?? `${Date.now()}`),
    timestamp: Number(o.timestamp) || Date.now(),
    project: String(o.project ?? "General"),
    task: String(o.task ?? "Focus session"),
    minutes: Math.max(1, Number(o.minutes) || POMODORO_MINUTES),
  };
}

function loadFocusLogsFromStorage(): FocusLogItem[] {
  try {
    const raw = localStorage.getItem(LS_FOCUS_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeFocusLogRow).filter(Boolean) as FocusLogItem[];
  } catch {
    return [];
  }
}

export default function App() {
  const { play, startLoop, stopLoop } = useSound();
  const [stage, setStage] = useState<Stage>("welcome");
  const [tab, setTab] = useState<TabKey>("tasks");
  const [profileSubpage, setProfileSubpage] = useState<ProfileSubpage>("sanctuary");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarSection, setSidebarSection] = useState<SidebarItem>("guide");
  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [shimmer, setShimmer] = useState(false);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [aboutYou, setAboutYou] = useState<AboutYouState>(() => ({ ...EMPTY_ABOUT }));
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>(loadTasksFromStorage);
  const [historicalTasks, setHistoricalTasks] = useState<HistoricalTaskItem[]>(
    loadHistoricalFromStorage
  );
  const [draft, setDraft] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [timerPhase, setTimerPhase] = useState<TimerPhase>("idle");
  const timerPhaseRef = useRef(timerPhase);
  timerPhaseRef.current = timerPhase;

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [focusTaskLabel, setFocusTaskLabel] = useState("");

  const [showReflect, setShowReflect] = useState(false);
  const [showDistraction, setShowDistraction] = useState(false);
  const [reflectionRecords, setReflectionRecords] = useState<
    { focusQuality: number; distractions: string[]; mood: string | null; timestamp: number }[]
  >([]);
  const [focusLogs, setFocusLogs] = useState<FocusLogItem[]>(loadFocusLogsFromStorage);
  const [distractionReasonLog, setDistractionReasonLog] = useState<string[]>([]);
  const [xpToast, setXpToast] = useState<{ text: string; nonce: number } | null>(null);

  const [notificationsOn, setNotificationsOn] = useState(true);
  const [darkTheme, setDarkTheme] = useState(false);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false);
  const [hourFormat, setHourFormat] = useState<"12h" | "24h">("24h");
  const [themePreset, setThemePreset] = useState<"forest" | "midnight" | "charcoal">("forest");
  const [completedSinceLongBreak, setCompletedSinceLongBreak] = useState(0);

  const [petEmoji, setPetEmoji] = useState<string>(PET_OPTIONS[0]);
  const [petName, setPetName] = useState("My pet");
  const [petXp, setPetXp] = useState(0);

  const [backpack, setBackpack] = useState<
    { id: string; name: string; qty: number; description: string }[]
  >([
    { id: "snack", name: "Energy Snack", qty: 2, description: "+ Pet energy (prototype)" },
    { id: "charm", name: "Focus Charm", qty: 1, description: "Next-session reward boost (prototype)" },
  ]);

  const shimmerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const companionConfirmLockRef = useRef(false);
  const prevStageForCompanionLockRef = useRef<Stage>(stage);
  const prevTabRef = useRef(tab);
  const prevStageRef = useRef(stage);

  const addXp = (n: number) => {
    setPetXp((prev) => prev + n);
  };
  const toastXp = (text: string) => {
    setXpToast({ text, nonce: Date.now() });
    window.setTimeout(() => setXpToast(null), 1800);
  };

  useEffect(() => {
    return () => {
      if (shimmerTimer.current) clearTimeout(shimmerTimer.current);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkTheme);
  }, [darkTheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themePreset);
  }, [themePreset]);

  useEffect(() => {
    if (prevTabRef.current !== tab && stage === "main") {
      play("transition_up", 0.32);
    }
    prevTabRef.current = tab;
  }, [tab, stage, play]);

  useEffect(() => {
    if (prevStageRef.current !== stage && stage !== "welcome") {
      play("transition_up", 0.36);
    }
    prevStageRef.current = stage;
  }, [stage, play]);

  useEffect(() => {
    const prev = prevStageForCompanionLockRef.current;
    if (stage === "companion" && prev !== "companion") {
      companionConfirmLockRef.current = false;
    }
    prevStageForCompanionLockRef.current = stage;
  }, [stage]);

  useEffect(() => {
    if (showReflect) startLoop("ringtone_loop", 0.62);
    else stopLoop("ringtone_loop");
  }, [showReflect, startLoop, stopLoop]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_TASKS_KEY, JSON.stringify(tasks));
    } catch {
      /* ignore */
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_HIST_KEY, JSON.stringify(historicalTasks));
    } catch {
      /* ignore */
    }
  }, [historicalTasks]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_FOCUS_LOGS_KEY, JSON.stringify(focusLogs));
    } catch {
      /* ignore */
    }
  }, [focusLogs]);

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      setRemainingSeconds((s) => {
        if (s <= 1) {
          window.queueMicrotask(() => {
            setIsRunning(false);
            const phase = timerPhaseRef.current;
            if (phase === "focus") {
              setShowReflect(true);
            } else if (phase === "break") {
              setIsRunning(false);
            }
          });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

  useEffect(() => {
    if (timerPhase !== "break" || remainingSeconds !== 0 || isRunning) return;
    if (autoStartPomodoros) {
      const task = tasks.find((t) => t.id === selectedTaskId);
      if (task) {
        setTimerPhase("focus");
        setRemainingSeconds(Math.max(1, pomodoroMinutes) * 60);
        setIsRunning(true);
        setFocusTaskId(task.id);
        setFocusTaskLabel(task.label);
        setTab("focus");
      } else {
        setTimerPhase("idle");
      }
    } else {
      setTimerPhase("idle");
    }
  }, [timerPhase, remainingSeconds, isRunning, autoStartPomodoros, tasks, selectedTaskId, pomodoroMinutes]);

  useEffect(() => {
    if (stage !== "main") return;
    if (selectedTaskId) return;
    if (tasks[0]) setSelectedTaskId(tasks[0].id);
  }, [stage, tasks, selectedTaskId]);

  useEffect(() => {
    if (!selectedTaskId) return;
    if (!tasks.some((t) => t.id === selectedTaskId)) {
      setSelectedTaskId(tasks[0]?.id ?? null);
    }
  }, [tasks, selectedTaskId]);

  const triggerSparkleThenMain = useCallback(() => {
    const name = displayName.trim();
    if (!name) return;

    setShimmer(true);
    if (shimmerTimer.current) clearTimeout(shimmerTimer.current);
    shimmerTimer.current = setTimeout(() => {
      setNickname((n) => (n.trim() ? n : name));
      setStage("main");
      setTab("tasks");
      setShimmer(false);
    }, SPARKLE_MS);
  }, [displayName]);

  const displayNameLetter = displayName.trim().slice(0, 1).toUpperCase() || "?";

  const addTask = (label: string, iconId: string, estimatePomodoros: number) => {
    const est = normalizeEstimatePomos(estimatePomodoros);
    setTasks((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        label,
        icon: iconId,
        estimatePomodoros: est,
        completedPomodoros: 0,
      },
    ]);
  };

  const updateTask = (id: string, patch: Partial<Pick<TaskItem, "estimatePomodoros">>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const merged = { ...t, ...patch };
        if (patch.estimatePomodoros != null) {
          merged.estimatePomodoros = normalizeEstimatePomos(patch.estimatePomodoros);
        }
        return merged;
      })
    );
  };

  const archiveTask = useCallback((id: string) => {
    let hist: HistoricalTaskItem | null = null;
    setTasks((prev) => {
      const t = prev.find((x) => x.id === id);
      if (!t) return prev;
      hist = {
        id: `${Date.now()}-hist-${id.slice(-8)}`,
        label: t.label,
        icon: t.icon,
        estimatePomodoros: normalizeEstimatePomos(t.estimatePomodoros),
        actualPomodoros: t.completedPomodoros,
        completedAt: Date.now(),
      };
      return prev.filter((x) => x.id !== id);
    });
    if (hist) {
      const entry = hist;
      setHistoricalTasks((prev) => [entry, ...prev]);
    }
    setSelectedTaskId((cur) => (cur === id ? null : cur));
    addXp(5);
    toastXp("+5 XP");
  }, []);

  const restoreHistoricalTask = useCallback(
    (histId: string) => {
      const h = historicalTasks.find((x) => x.id === histId);
      if (!h) return;
      const restored: TaskItem = {
        id: `${Date.now()}-restored-${histId.slice(-6)}`,
        label: h.label,
        icon: h.icon,
        estimatePomodoros: normalizeEstimatePomos(h.estimatePomodoros),
        completedPomodoros: h.actualPomodoros,
      };
      setHistoricalTasks((prev) => prev.filter((x) => x.id !== histId));
      setTasks((prev) => [restored, ...prev]);
      setSelectedTaskId(restored.id);
      addXp(3);
      toastXp("+3 XP");
    },
    [historicalTasks]
  );

  const clearHistoricalTasks = useCallback(() => {
    setHistoricalTasks([]);
  }, []);

  const beginFocusCountdown = useCallback(() => {
    const task = tasks.find((t) => t.id === selectedTaskId);
    if (!task) return false;
    const secs = Math.max(1, pomodoroMinutes) * 60;
    setTimerPhase("focus");
    setRemainingSeconds(secs);
    setIsRunning(true);
    setFocusTaskId(task.id);
    setFocusTaskLabel(task.label);
    setTab("focus");
    return true;
  }, [tasks, selectedTaskId, pomodoroMinutes]);

  const startSession = () => {
    beginFocusCountdown();
  };

  const toggleTimerRunning = useCallback(() => {
    if (timerPhaseRef.current === "idle") return;
    if (remainingSeconds <= 0) return;
    setIsRunning((prev) => !prev);
  }, [remainingSeconds]);

  const switchFocusTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    setFocusTaskId(task.id);
    setFocusTaskLabel(task.label);
  };

  const resetFocusState = () => {
    setTimerPhase("idle");
    setRemainingSeconds(0);
    setFocusTaskId(null);
    setFocusTaskLabel("");
  };

  const finishFocus = () => {
    if (timerPhaseRef.current === "break") {
      setIsRunning(false);
      setRemainingSeconds(0);
      if (!beginFocusCountdown()) {
        setTimerPhase("idle");
      }
      return;
    }
    if (timerPhaseRef.current === "focus" && isRunning) {
      setShowDistraction(true);
      return;
    }
    resetFocusState();
    setTab("tasks");
  };

  const skipToNext = useCallback(() => {
    if (timerPhaseRef.current === "break") {
      setIsRunning(false);
      setRemainingSeconds(0);
      if (!beginFocusCountdown()) {
        setTimerPhase("idle");
      }
      return;
    }
    if (timerPhaseRef.current === "focus") {
      setIsRunning(false);
      setRemainingSeconds(0);
      setShowReflect(true);
      return;
    }
  }, [beginFocusCountdown]);

  const handleDistractionPick = (reasonId: string) => {
    setDistractionReasonLog((prev) => [reasonId, ...prev]);
    setShowDistraction(false);
    setIsRunning(false);
    resetFocusState();
    setTab("tasks");
  };

  const handleDistractionDismiss = () => {
    setShowDistraction(false);
    setIsRunning(false);
    resetFocusState();
    setTab("tasks");
  };

  const handleReflectContinue = (summary: string, _wasDistracted: boolean) => {
    try {
      const parsed = JSON.parse(summary) as {
        focusQuality?: number;
        distractionIds?: string[];
        mood?: string | null;
      };
      setReflectionRecords((prev) => [
        {
          focusQuality: Number(parsed.focusQuality) || 0,
          distractions: Array.isArray(parsed.distractionIds) ? parsed.distractionIds : [],
          mood: parsed.mood ?? null,
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    } catch {
      // ignore malformed prototype payloads
    }
    setShowReflect(false);
    if (focusTaskId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === focusTaskId ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t
        )
      );
      const taskLabel = focusTaskLabel || tasks.find((t) => t.id === focusTaskId)?.label || "Focus session";
      setFocusLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          project: aboutYou.pursuits[0] || "General",
          task: taskLabel,
          minutes: POMODORO_MINUTES,
        },
        ...prev,
      ]);
      addXp(XP_PER_POMO);
      toastXp(`+${XP_PER_POMO} XP`);
    }
    setCompletedSinceLongBreak((prev) => prev + 1);
    const nextCount = completedSinceLongBreak + 1;
    const shouldLongBreak = nextCount % Math.max(1, longBreakInterval) === 0;
    const breakSeconds = (shouldLongBreak ? longBreakMinutes : shortBreakMinutes) * 60;
    setSelectedTaskId(null);
    setFocusTaskId(null);
    setFocusTaskLabel("");
    setTimerPhase("break");
    setRemainingSeconds(breakSeconds);
    setIsRunning(autoStartBreaks);
  };

  const handleReflectSkip = () => {
    setShowReflect(false);
    setReflectionRecords((prev) => [
      { focusQuality: 0, distractions: [], mood: null, timestamp: Date.now() },
      ...prev,
    ]);
    if (focusTaskId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === focusTaskId ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t
        )
      );
      const taskLabel = focusTaskLabel || tasks.find((t) => t.id === focusTaskId)?.label || "Focus session";
      setFocusLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          project: aboutYou.pursuits[0] || "General",
          task: taskLabel,
          minutes: POMODORO_MINUTES,
        },
        ...prev,
      ]);
      addXp(XP_PER_POMO);
      toastXp(`+${XP_PER_POMO} XP`);
    }
    setCompletedSinceLongBreak((prev) => prev + 1);
    const nextCount = completedSinceLongBreak + 1;
    const shouldLongBreak = nextCount % Math.max(1, longBreakInterval) === 0;
    const breakSeconds = (shouldLongBreak ? longBreakMinutes : shortBreakMinutes) * 60;
    setSelectedTaskId(null);
    setFocusTaskId(null);
    setFocusTaskLabel("");
    setTimerPhase("break");
    setRemainingSeconds(breakSeconds);
    setIsRunning(autoStartBreaks);
  };

  const reuseTaskDraft = (task: TaskItem) => {
    setDraft(task.label);
  };

  const consumeBackpackItem = (id: string) => {
    setBackpack((prev) =>
      prev
        .map((it) => (it.id === id && it.qty > 0 ? { ...it, qty: it.qty - 1 } : it))
        .filter((it) => it.qty > 0)
    );
    addXp(5);
  };
  const updateFocusLog = useCallback(
    (id: string, patch: Partial<Pick<FocusLogItem, "project" | "task" | "minutes">>) => {
      setFocusLogs((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                ...patch,
                minutes: patch.minutes != null ? Math.max(1, Math.round(patch.minutes)) : row.minutes,
              }
            : row
        )
      );
    },
    []
  );
  const deleteFocusLog = useCallback((id: string) => {
    setFocusLogs((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const showNav = stage === "main";
  const todayFocusMinutes = focusLogs.filter((r) => {
    const d = new Date(r.timestamp);
    const n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  }).reduce((sum, row) => sum + row.minutes, 0);
  const distractionBreakdown = ["Phone", "Social / notifications", "Wandering thoughts", "Fatigue", "Other"].map(
    (name, idx) => {
      const id = ["phone", "social", "mind", "fatigue", "other"][idx];
      const fromReflections = reflectionRecords.reduce(
        (sum, r) => sum + (r.distractions.includes(id) ? 1 : 0),
        0
      );
      const fromEarlyEnd = distractionReasonLog.filter((x) => x === id).length;
      const value = fromReflections + fromEarlyEnd;
      const colors = ["#2D3A2D", "#6B7280", "#9CA3AF", "#D1D5DB", "#E5E7EB"];
      return { name, value, color: colors[idx] };
    }
  );
  const aiInsight =
    distractionBreakdown[0].value + distractionBreakdown[1].value + distractionBreakdown[2].value > 0
      ? "You are most distracted by notifications and mind wandering. Try a stricter phone boundary during deep work."
      : "Great momentum. Your distraction signals are low this week — keep the same routine for deep work blocks.";
  const focusStyleTags = Array.from(
    new Set([
      ...aboutYou.focusType,
      ...aboutYou.pursuits.slice(0, 2),
      petXp >= 180 ? "Deep Worker" : "",
      reflectionRecords.some((r) => (r.focusQuality || 0) >= 4) ? "Flow Seeker" : "",
      reflectionRecords.some((r) => (r.mood || "").toLowerCase() === "calm") ? "Calm Finisher" : "",
      "Night Owl",
    ].filter(Boolean) as string[])
  );

  const displayLabel = nickname.trim() || displayName;
  const milestones = [
    petXp >= 60 ? "Level Up I unlocked" : "",
    petXp >= 180 ? "Level Up II unlocked" : "",
    reflectionRecords.length >= 5 ? "5 sessions streak reached" : "",
    historicalTasks.length >= 3 ? "Task finisher badge unlocked" : "",
  ].filter(Boolean);

  const handleSidebarAction = (item: SidebarItem) => {
    if (item === "guide") {
      if (typeof localStorage !== "undefined") localStorage.removeItem("foco_tasks_tour_done");
      setTab("tasks");
    }
    setSidebarSection(item);
  };

  return (
    <div className="relative mx-auto flex min-h-full w-full max-w-[1200px] flex-col font-sans text-zinc-900 dark:text-white">
      <PageBackground />
      <ShimmerOverlay active={shimmer} />

      <ReflectionModal
        open={showReflect}
        onContinue={handleReflectContinue}
        onSkip={handleReflectSkip}
      />
      <DistractionModal
        open={showDistraction}
        onPick={handleDistractionPick}
        onDismiss={handleDistractionDismiss}
      />

      <div className="relative z-10 min-h-full flex-1">
        <AnimatePresence mode="wait">
          {stage === "welcome" && (
            <WelcomeScreen
              key="flow-welcome"
              onSocialContinue={() => {
                setAboutYou({ ...EMPTY_ABOUT });
                setTermsAccepted(false);
                setPrivacyAccepted(false);
                setSignInEmail("");
                setSignInPassword("");
                setStage("name");
              }}
              onEmailContinue={() => {
                setAboutYou({ ...EMPTY_ABOUT });
                setTermsAccepted(false);
                setPrivacyAccepted(false);
                setStage("email");
              }}
            />
          )}
          {stage === "email" && (
            <CreateAccountScreen
              key="flow-email"
              email={signInEmail}
              password={signInPassword}
              onEmailChange={setSignInEmail}
              onPasswordChange={setSignInPassword}
              onNext={() => setStage("name")}
              onBackToWelcome={() => setStage("welcome")}
            />
          )}
          {stage === "name" && (
            <OnboardingScreen
              key="flow-name"
              name={displayName}
              onNameChange={setDisplayName}
              onContinue={() => setStage("about")}
              onBack={() => setStage(signInEmail || signInPassword ? "email" : "welcome")}
            />
          )}
          {stage === "about" && (
            <TellUsAboutYouScreen
              key="flow-about"
              value={aboutYou}
              onChange={setAboutYou}
              onContinue={() => setStage("legal")}
              onBack={() => setStage("name")}
              displayNameLetter={displayNameLetter}
            />
          )}
          {stage === "legal" && (
            <QuickThingsScreen
              key="flow-legal"
              termsAccepted={termsAccepted}
              privacyAccepted={privacyAccepted}
              onTermsToggle={() => setTermsAccepted((v) => !v)}
              onPrivacyToggle={() => setPrivacyAccepted((v) => !v)}
              onContinue={() => setStage("companion")}
              onBack={() => setStage("about")}
              displayNameLetter={displayNameLetter}
            />
          )}
          {stage === "companion" && (
            <ChooseCompanionScreen
              key="flow-companion"
              selectedEmoji={petEmoji}
              onSelect={setPetEmoji}
              onConfirm={() => {
                if (companionConfirmLockRef.current) return;
                if (!displayName.trim()) return;
                companionConfirmLockRef.current = true;
                play("celebration", 0.72);
                triggerSparkleThenMain();
              }}
              onBack={() => setStage("legal")}
              displayNameLetter={displayNameLetter}
            />
          )}
          {stage === "main" && tab === "tasks" && (
            <TaskEntryScreen
              key="main-tasks"
              displayName={displayLabel}
              tasks={tasks}
              historicalTasks={historicalTasks}
              draft={draft}
              onDraftChange={setDraft}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              onArchiveTask={archiveTask}
              onRestoreHistoricalTask={restoreHistoricalTask}
              onClearHistoricalTasks={clearHistoricalTasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              onStartSession={startSession}
              onReuseTask={reuseTaskDraft}
              onOpenMenu={() => setSidebarOpen(true)}
              pomodoroMinutes={pomodoroMinutes}
            />
          )}
          {stage === "main" && tab === "focus" && (
            <FocusScreen
              key="main-focus"
              timerPhase={timerPhase}
              remainingSeconds={remainingSeconds}
              isRunning={isRunning}
              activeTaskId={focusTaskId}
              activeTaskLabel={
                focusTaskLabel ||
                (focusTaskId ? tasks.find((t) => t.id === focusTaskId)?.label ?? "" : "")
              }
              tasks={tasks}
              petEmoji={petEmoji}
              reflectionOpen={showReflect}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              onStartSession={startSession}
              onToggleRunning={toggleTimerRunning}
              onTaskChange={switchFocusTask}
              onFinish={finishFocus}
              onSkipToNext={skipToNext}
            />
          )}
          {stage === "main" && tab === "stats" && (
            <DashboardScreen
              key="main-stats"
              displayName={displayLabel}
              distractionBreakdown={distractionBreakdown}
              aiInsight={aiInsight}
              focusLogs={focusLogs}
              onUpdateFocusLog={updateFocusLog}
              onDeleteFocusLog={deleteFocusLog}
              petEnergyToday={Math.round(todayFocusMinutes / POMODORO_MINUTES)}
              onOpenMenu={() => setSidebarOpen(true)}
            />
          )}
          {stage === "main" && tab === "profile" && (
            profileSubpage === "sanctuary" ? (
              <SanctuaryScreen
                key="main-sanctuary"
                petEmoji={petEmoji}
                petName={petName}
                onPetNameChange={setPetName}
                petXp={petXp}
                backpack={backpack}
                onUseBackpackItem={consumeBackpackItem}
                focusStyleTags={focusStyleTags}
                onOpenMenu={() => setSidebarOpen(true)}
                todayFocusMinutes={todayFocusMinutes}
                settings={{
                  pomodoroMinutes,
                  shortBreakMinutes,
                  longBreakMinutes,
                  longBreakInterval,
                  autoStartBreaks,
                  autoStartPomodoros,
                  hourFormat,
                  themePreset,
                }}
                onSettingsChange={(next) => {
                  setPomodoroMinutes(Math.max(1, Math.round(next.pomodoroMinutes)));
                  setShortBreakMinutes(Math.max(1, Math.round(next.shortBreakMinutes)));
                  setLongBreakMinutes(Math.max(1, Math.round(next.longBreakMinutes)));
                  setLongBreakInterval(Math.max(1, Math.round(next.longBreakInterval)));
                  setAutoStartBreaks(Boolean(next.autoStartBreaks));
                  setAutoStartPomodoros(Boolean(next.autoStartPomodoros));
                  setHourFormat(next.hourFormat);
                  setThemePreset(next.themePreset);
                  play("transition_up", 0.45);
                }}
              />
            ) : (
              <SettingsScreen
                key="main-settings"
                displayName={displayName}
                nickname={nickname}
                onNicknameChange={setNickname}
                notificationsOn={notificationsOn}
                onNotificationsChange={setNotificationsOn}
                darkTheme={darkTheme}
                onDarkThemeChange={setDarkTheme}
                onBack={() => setProfileSubpage("sanctuary")}
              />
            )
          )}
        </AnimatePresence>
      </div>

      {showNav && <BottomNav active={tab} onChange={setTab} />}
      <AnimatePresence>
        {xpToast && (
          <motion.div
            key={xpToast.nonce}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="pointer-events-none fixed bottom-[88px] left-1/2 z-[90] ml-[132px] -translate-x-1/2 rounded-full border border-emerald-300/45 bg-emerald-900/90 px-3 py-1.5 font-sans text-[11px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.32)] backdrop-blur-[20px]"
          >
            {xpToast.text}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close sidebar"
              className="fixed inset-0 z-[110] bg-black/45 backdrop-blur-[4px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280, opacity: 0.2 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0.2 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 top-0 z-[120] h-full w-[min(78vw,300px)] border-r border-white/20 bg-black/70 p-5 text-white backdrop-blur-[20px]"
            >
              <p className="font-serif text-xl font-semibold">FOCO</p>
              <p className="mt-1 font-sans text-xs text-white/70">Quick navigation</p>
              <div className="mt-6 space-y-2">
                <button type="button" onClick={() => handleSidebarAction("guide")} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-left font-sans text-sm font-medium hover:bg-white/15">
                  Guide
                </button>
                <button type="button" onClick={() => handleSidebarAction("milestones")} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-left font-sans text-sm font-medium hover:bg-white/15">
                  Milestones
                </button>
                <button type="button" onClick={() => handleSidebarAction("support")} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-left font-sans text-sm font-medium hover:bg-white/15">
                  Support
                </button>
              </div>
              {sidebarSection === "guide" && (
                <div className="mt-7 rounded-2xl border border-white/20 bg-white/10 p-3">
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-white/65">Guide</p>
                  <p className="mt-2 font-sans text-xs leading-relaxed text-white/85">
                    Restart onboarding tooltips and revisit the core flow: Add task → estimate → My Space → start focus.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof localStorage !== "undefined") localStorage.removeItem("foco_tasks_tour_done");
                      setTab("tasks");
                      setSidebarOpen(false);
                    }}
                    className="mt-3 w-full rounded-full border border-white/25 bg-white/10 py-2 text-xs font-semibold"
                  >
                    Restart Tooltips
                  </button>
                </div>
              )}
              {sidebarSection === "milestones" && (
                <div className="mt-7 rounded-2xl border border-white/20 bg-white/10 p-3">
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-white/65">Unlocked milestones</p>
                  <ul className="mt-2 space-y-1.5 font-sans text-xs text-white/85">
                    {milestones.length === 0 && <li>Keep focusing to unlock your first milestone.</li>}
                    {milestones.map((m) => (
                      <li key={m}>• {m}</li>
                    ))}
                  </ul>
                  <p className="mt-3 font-sans text-[11px] text-white/65">
                    Next target: reach 10 reflected sessions for "Consistent Finisher".
                  </p>
                </div>
              )}
              {sidebarSection === "support" && (
                <div className="mt-7 rounded-2xl border border-white/20 bg-white/10 p-3">
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-white/65">Support</p>
                  <p className="mt-2 font-sans text-xs leading-relaxed text-white/85">
                    We read every feedback note. Tell us where your focus flow breaks and what you'd like next.
                  </p>
                  <button
                    type="button"
                    onClick={() => window.open("mailto:feedback@foco.app?subject=FOCO%20Feedback", "_blank")}
                    className="mt-3 w-full rounded-full border border-white/25 bg-white/10 py-2 text-xs font-semibold"
                  >
                    Send Feedback
                  </button>
                  <p className="mt-2 font-sans text-[11px] text-white/65">
                    Or share quick notes in-app after your next session reflection.
                  </p>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
