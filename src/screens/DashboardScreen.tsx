import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Flame,
  Menu,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GlassCard } from "../components/GlassCard";

type FocusLog = { id: string; timestamp: number; project: string; task: string; minutes: number };

type DashboardScreenProps = {
  displayName: string;
  distractionBreakdown: { name: string; value: number; color: string }[];
  aiInsight: string;
  focusLogs: FocusLog[];
  onUpdateFocusLog: (id: string, patch: Partial<{ project: string; task: string; minutes: number }>) => void;
  onDeleteFocusLog: (id: string) => void;
  petEnergyToday: number;
  onOpenMenu?: () => void;
};

function fmt(totalMin: number) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function fmtDateShort(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function rangeText(start: Date, end: Date) {
  return `${start.getMonth() + 1}/${start.getDate()}~${end.getMonth() + 1}/${end.getDate()}`;
}

function weekBounds(base: Date, offset = 0) {
  const start = new Date(base);
  const day = (base.getDay() + 6) % 7;
  start.setDate(base.getDate() - day + offset * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function monthBounds(base: Date, offset = 0) {
  const start = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return { start, end };
}

function yearBounds(base: Date, offset = 0) {
  const start = new Date(base.getFullYear() + offset, 0, 1);
  const end = new Date(base.getFullYear() + offset, 11, 31);
  return { start, end };
}

function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function currentDayStreak(logs: FocusLog[]) {
  const days = new Set(logs.map((l) => dayKey(l.timestamp)));
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth() + 1}-${cursor.getDate()}`;
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function downloadCsv(rows: FocusLog[]) {
  const header = "DATE,PROJECT,TASK,MINUTES";
  const body = rows.map((r) => {
    const safeProject = r.project.replace(/"/g, '""');
    const safeTask = r.task.replace(/"/g, '""');
    return `"${fmtDateShort(r.timestamp)}","${safeProject}","${safeTask}",${r.minutes}`;
  });
  const blob = new Blob([[header, ...body].join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `foco-focus-logs-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function DashboardScreen({
  displayName,
  distractionBreakdown,
  aiInsight,
  focusLogs,
  onUpdateFocusLog,
  onDeleteFocusLog,
  petEnergyToday,
  onOpenMenu,
}: DashboardScreenProps) {
  const [view, setView] = useState<"summary" | "detail">("summary");
  const [range, setRange] = useState<"week" | "month" | "year">("week");
  const [periodOffset, setPeriodOffset] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editProject, setEditProject] = useState("");
  const [editTask, setEditTask] = useState("");
  const [editMinutes, setEditMinutes] = useState("25");
  const [swipedRowId, setSwipedRowId] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const topDistracted = distractionBreakdown.length
    ? distractionBreakdown.reduce((a, b) => (b.value > a.value ? b : a))
    : { name: "None", value: 0, color: "#d4d4d8" };

  const now = new Date();
  const week = weekBounds(now, periodOffset);
  const month = monthBounds(now, periodOffset);
  const year = yearBounds(now, periodOffset);
  const period = range === "week" ? week : range === "month" ? month : year;
  const periodTitle = range === "year" ? `${period.start.getFullYear()} Year` : `${period.start.getMonth() + 1}月`;
  const periodRange = rangeText(period.start, period.end);
  const periodLabel = range === "week" ? "This Week" : range === "month" ? "This Month" : "This Year";
  const logsInPeriod = useMemo(
    () => focusLogs.filter((row) => row.timestamp >= period.start.getTime() && row.timestamp <= period.end.getTime()),
    [focusLogs, period.start, period.end]
  );
  const uniqueDays = new Set(focusLogs.map((r) => dayKey(r.timestamp))).size;
  const totalMinutes = focusLogs.reduce((sum, row) => sum + row.minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const streak = currentDayStreak(focusLogs);

  const trendData = useMemo(() => {
    if (range === "week") {
      const buckets = Array.from({ length: 7 }, (_, idx) => {
        const d = new Date(period.start);
        d.setDate(period.start.getDate() + idx);
        return {
          key: `week-${idx}`,
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          hours: 0,
          dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
        };
      });
      logsInPeriod.forEach((row) => {
        const d = new Date(row.timestamp);
        const idx = Math.floor(
          (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
            new Date(period.start.getFullYear(), period.start.getMonth(), period.start.getDate()).getTime()) /
            (24 * 3600 * 1000)
        );
        if (idx >= 0 && idx < buckets.length) buckets[idx].hours += row.minutes / 60;
      });
      return buckets;
    }
    if (range === "month") {
      const days = period.end.getDate();
      const buckets = Array.from({ length: days }, (_, idx) => ({
        key: `month-${idx + 1}`,
        label: String(idx + 1),
        hours: 0,
        dateLabel: `${period.start.getMonth() + 1}/${idx + 1}`,
      }));
      logsInPeriod.forEach((row) => {
        const d = new Date(row.timestamp);
        const idx = d.getDate() - 1;
        if (idx >= 0 && idx < buckets.length) buckets[idx].hours += row.minutes / 60;
      });
      return buckets;
    }
    const buckets = Array.from({ length: 12 }, (_, idx) => ({
      key: `year-${idx}`,
      label: `${idx + 1}M`,
      hours: 0,
      dateLabel: `${period.start.getFullYear()}/${idx + 1}`,
    }));
    logsInPeriod.forEach((row) => {
      const d = new Date(row.timestamp);
      buckets[d.getMonth()].hours += row.minutes / 60;
    });
    return buckets;
  }, [range, logsInPeriod, period.start, period.end]);
  const active = trendData[selectedPoint] ?? trendData[0];

  const metricCards = [
    { label: "Hours Focused", value: totalHours, icon: Clock3 },
    { label: "Days Accessed", value: uniqueDays, icon: CalendarDays },
    { label: "Day Streak", value: streak, icon: Flame },
  ];

  const startEdit = (id: string, project: string, task: string, minutes: number) => {
    setEditingId(id);
    setEditProject(project);
    setEditTask(task);
    setEditMinutes(String(minutes));
  };

  const saveEdit = () => {
    if (!editingId) return;
    onUpdateFocusLog(editingId, {
      project: editProject.trim() || "General",
      task: editTask.trim() || "Focus session",
      minutes: Number(editMinutes) || 1,
    });
    setEditingId(null);
  };

  return (
    <motion.div
      className="flex min-h-full flex-col px-5 pb-32 pt-6"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="header-glass mb-2 flex items-center justify-between px-2 py-1.5 text-white">
        <button type="button" className="rounded-full p-2 opacity-90 transition-opacity hover:opacity-100" aria-label="Menu" onClick={onOpenMenu}>
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-serif text-lg font-semibold tracking-[0.14em]">FOCO</span>
        <button type="button" className="rounded-full p-2 opacity-90 transition-opacity hover:opacity-100" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
      </header>

      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-[1.85rem] font-semibold text-white">Pomodoro Analytics</h1>
            <p className="mt-1 font-sans text-sm text-zinc-300">Overview and detailed focus logs.</p>
          </div>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-xs font-sans font-semibold text-white" title={displayName}>
            {displayName.slice(0, 1).toUpperCase() || "?"}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {metricCards.map((card) => (
            <GlassCard key={card.label} className="border-zinc-200/80 bg-white/88 px-3 py-3 dark:border-zinc-200/80 dark:bg-white/88">
              <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900/8 text-zinc-900">
                <card.icon className="h-4 w-4" />
              </div>
              <p className="font-sans text-lg font-semibold text-zinc-900">{card.value}</p>
              <p className="font-sans text-[10px] uppercase tracking-[0.12em] text-zinc-700">{card.label}</p>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="mb-4 border-zinc-200/80 bg-white/88 px-5 py-6 dark:border-zinc-200/80 dark:bg-white/88">
          <div className="mb-4 inline-flex rounded-full border border-zinc-200 bg-white p-1">
            {(["week", "month", "year"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRange(r);
                  setPeriodOffset(0);
                  setSelectedPoint(0);
                }}
                className={`rounded-full px-3 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-wide transition ${range === r ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"}`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="mb-4 flex items-center justify-between">
            <button type="button" onClick={() => { setPeriodOffset((v) => v - 1); setSelectedPoint(0); }} className="rounded-full border border-zinc-300 p-1.5 text-zinc-700 hover:bg-zinc-100" aria-label="Previous period">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700">{periodLabel}</p>
            <button type="button" onClick={() => { setPeriodOffset((v) => Math.min(0, v + 1)); setSelectedPoint(0); }} className="rounded-full border border-zinc-300 p-1.5 text-zinc-700 hover:bg-zinc-100" aria-label="Next period">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-600">{periodTitle} · {periodRange}</p>
          <p className="mt-2 font-sans text-[3rem] font-semibold tabular-nums leading-[1] text-zinc-900">{fmt(logsInPeriod.reduce((sum, row) => sum + row.minutes, 0))}</p>

          <div className="mt-5 h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} onClick={(state) => { const idx = state.activeTooltipIndex; if (typeof idx === "number") setSelectedPoint(idx); }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d4d4d8" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#71717a", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#71717a", fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(2)} h`, "Focus"]} />
                <Bar dataKey="hours" radius={[8, 8, 2, 2]}>
                  {trendData.map((row) => (
                    <Cell key={row.key} fill={row.key === active?.key ? "#18181b" : "#52525b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 rounded-2xl bg-zinc-900 px-4 py-3 text-white">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-white">Selected Range Point</p>
            <p className="mt-1 font-sans text-xs text-white/85">{active?.dateLabel || "-"} · {(active?.hours || 0).toFixed(2)}h</p>
          </div>
        </GlassCard>

        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex rounded-full border border-white/25 bg-white/10 p-1">
            {(["summary", "detail"] as const).map((id) => (
              <button key={id} type="button" onClick={() => setView(id)} className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${view === id ? "bg-white text-black" : "text-white/85"}`}>
                {id}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === "summary" ? (
            <motion.div key="summary" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <GlassCard className="mb-4 border-zinc-200/80 bg-white/88 px-5 py-6 dark:border-zinc-200/80 dark:bg-white/88">
                <p className="mb-5 font-serif text-lg font-semibold text-zinc-900">Distraction breakdown</p>
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative mx-auto h-44 w-44 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={distractionBreakdown} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={2} dataKey="value" stroke="none">
                          {distractionBreakdown.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-serif text-xl font-semibold text-zinc-900">{topDistracted.value}</span>
                      <span className="font-sans text-[11px] text-zinc-600">{topDistracted.name}</span>
                    </div>
                  </div>
                  <div className="w-full flex-1 space-y-3 font-sans">
                    {distractionBreakdown.map((d) => (
                      <div key={d.name} className="flex items-center gap-3 text-sm">
                        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: d.color }} />
                        <span className="flex-1 text-zinc-700">{d.name}</span>
                        <span className="font-medium tabular-nums text-zinc-900">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="border-zinc-200/80 bg-white/88 px-5 py-6 dark:border-zinc-200/80 dark:bg-white/88">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white">
                  <Sparkles className="h-4 w-4 text-zinc-700" />
                </div>
                <p className="font-serif text-lg font-semibold text-zinc-900">AI focus insight</p>
                <p className="mt-3 font-sans text-sm leading-relaxed text-zinc-700">{aiInsight}</p>
                <p className="mt-4 rounded-xl bg-emerald-100 px-3 py-2 font-sans text-xs font-medium text-emerald-900">
                  Your pet gained {petEnergyToday} energy today from these sessions.
                </p>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div key="detail" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <GlassCard className="border-zinc-200/80 bg-white/88 px-4 py-5 sm:px-5 dark:border-zinc-200/80 dark:bg-white/88">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-serif text-lg font-semibold text-zinc-900">Focus Time Detail</p>
                  <button type="button" onClick={() => downloadCsv(focusLogs)} className="rounded-full border border-zinc-300 p-2 text-zinc-700 hover:bg-zinc-100" aria-label="Download data" title="Download data">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
                <div className="hidden rounded-xl bg-zinc-900 px-3 py-2 md:block">
                  <div className="grid grid-cols-[90px_120px_1fr_80px_62px] gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-white">
                    <span>DATE</span>
                    <span>PROJECT</span>
                    <span>TASK</span>
                    <span>MINUTES</span>
                    <span></span>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {focusLogs.length === 0 && <p className="py-6 text-center font-sans text-sm text-zinc-500">No focus logs yet.</p>}
                  {focusLogs.map((row) => (
                    <div
                      key={row.id}
                      className="group relative overflow-hidden rounded-xl px-2 py-2 hover:bg-zinc-100/80"
                      onTouchStart={(e) => setTouchStartX(e.changedTouches[0]?.clientX ?? null)}
                      onTouchEnd={(e) => {
                        if (touchStartX == null) return;
                        const dx = (e.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
                        if (dx < -34) setSwipedRowId(row.id);
                        if (dx > 22) setSwipedRowId(null);
                        setTouchStartX(null);
                      }}
                    >
                      {editingId === row.id ? (
                        <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-[90px_120px_1fr_80px_62px]">
                          <span className="font-sans text-xs text-zinc-700">{fmtDateShort(row.timestamp)}</span>
                          <input value={editProject} onChange={(e) => setEditProject(e.target.value)} className="rounded border border-zinc-300 px-2 py-1 text-xs" />
                          <input value={editTask} onChange={(e) => setEditTask(e.target.value)} className="rounded border border-zinc-300 px-2 py-1 text-xs" />
                          <input value={editMinutes} onChange={(e) => setEditMinutes(e.target.value)} className="rounded border border-zinc-300 px-2 py-1 text-xs" />
                          <button type="button" onClick={saveEdit} className="text-[11px] font-semibold text-zinc-800">Save</button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-1 font-sans text-xs text-zinc-800 md:grid-cols-[90px_120px_1fr_80px_62px] md:items-center md:gap-2">
                          <div className="flex items-center justify-between md:block">
                            <span className="font-medium md:font-normal">{fmtDateShort(row.timestamp)}</span>
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] md:hidden">{row.minutes} min</span>
                          </div>
                          <span className="truncate">{row.project}</span>
                          <span className="truncate">{row.task}</span>
                          <span className="hidden tabular-nums md:block">{row.minutes}</span>
                          <div className={`flex items-center justify-end gap-1 transition-opacity md:opacity-0 md:group-hover:opacity-100 ${swipedRowId === row.id ? "opacity-100" : "opacity-0 md:opacity-0"}`}>
                            <button type="button" onClick={() => startEdit(row.id, row.project, row.task, row.minutes)} className="rounded p-1 text-zinc-600 hover:bg-zinc-200" aria-label="Edit log">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => onDeleteFocusLog(row.id)} className="rounded p-1 text-zinc-600 hover:bg-zinc-200" aria-label="Delete log">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-2 font-sans text-[10px] text-zinc-500 md:hidden">
                  Swipe left on a row to show Edit/Delete.
                </p>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
