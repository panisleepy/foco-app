import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { Bell, Menu, Package, Settings2, Share2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useSound } from "../audio/SoundProvider";
import { GlassCard } from "../components/GlassCard";

type BackpackRow = { id: string; name: string; qty: number; description: string };

type SanctuaryScreenProps = {
  petEmoji: string;
  petName: string;
  onPetNameChange: (name: string) => void;
  petXp: number;
  backpack: BackpackRow[];
  onUseBackpackItem: (id: string) => void;
  focusStyleTags: string[];
  onOpenMenu?: () => void;
  todayFocusMinutes: number;
  settings: {
    pomodoroMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    longBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    hourFormat: "12h" | "24h";
    themePreset: "forest" | "midnight" | "charcoal";
  };
  onSettingsChange: (next: SanctuaryScreenProps["settings"]) => void;
};

export function SanctuaryScreen({
  petEmoji,
  petName,
  onPetNameChange,
  petXp,
  backpack,
  onUseBackpackItem,
  focusStyleTags,
  onOpenMenu,
  todayFocusMinutes,
  settings,
  onSettingsChange,
}: SanctuaryScreenProps) {
  const { play, playToggle } = useSound();
  const [showShareCard, setShowShareCard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const petLevel = Math.max(1, Math.floor(petXp / 60) + 1);
  const xpInLevel = petXp % 60;
  const xpForNext = 60;

  const shareText = useMemo(
    () =>
      `FOCO My Space\nToday: ${(todayFocusMinutes / 60).toFixed(1)}h focus\n${petName} ${petEmoji}\nLevel ${petLevel} · XP ${xpInLevel}/${xpForNext}\nFocus styles: ${focusStyleTags.join(", ") || "None yet"}`,
    [petName, petEmoji, petLevel, xpInLevel, focusStyleTags, todayFocusMinutes]
  );

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "FOCO Sanctuary", text: shareText });
        return;
      }
      await navigator.clipboard.writeText(shareText);
      setShowShareCard(true);
    } catch {
      setShowShareCard(true);
    }
  };

  const updateSettings = (patch: Partial<SanctuaryScreenProps["settings"]>) => {
    onSettingsChange({ ...settings, ...patch });
  };

  return (
    <motion.div
      className="flex min-h-full flex-col px-5 pb-32 pt-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
    >
      <header className="header-glass mb-2 flex items-center justify-between px-2 py-1.5 text-white">
        <button type="button" className="rounded-full p-2 opacity-90 hover:opacity-100" aria-label="Menu" onClick={onOpenMenu}>
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-serif text-lg font-semibold tracking-[0.14em]">FOCO</span>
        <div className="flex items-center gap-1">
          <button type="button" className="rounded-full p-2 opacity-90 hover:opacity-100" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-full p-2 opacity-90 hover:opacity-100"
            aria-label="Open settings"
            onClick={() => {
              setShowSettings(true);
              play("transition_up", 0.5);
            }}
          >
            <Settings2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-6 font-serif text-[1.85rem] font-semibold text-white">My Space</h1>

        <GlassCard className="mb-4 px-5 py-6">
          <div className="flex items-center gap-4">
            <div className="text-6xl leading-none">{petEmoji}</div>
            <div className="min-w-0 flex-1">
              <label htmlFor="sanctuary-pet-name" className="sr-only">
                Pet name
              </label>
              <input
                id="sanctuary-pet-name"
                value={petName}
                onChange={(e) => onPetNameChange(e.target.value)}
                className="w-full truncate border-b border-zinc-300/60 bg-transparent pb-1 font-serif text-2xl font-semibold text-zinc-900 outline-none focus:border-zinc-500 dark:border-white/25 dark:text-white dark:focus:border-white/65"
                placeholder="Pet name"
              />
              <p className="mt-1 font-sans text-xs text-zinc-500 dark:text-white/70">
                Lv. {petLevel} · XP {xpInLevel}/{xpForNext}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-white/15">
                <motion.div
                  className="h-full rounded-full bg-[#2D3A2D] dark:bg-white"
                  initial={false}
                  animate={{ width: `${Math.min(100, (xpInLevel / xpForNext) * 100)}%` }}
                />
              </div>
              <p className="mt-3 font-sans text-[11px] text-zinc-500 dark:text-white/60">
                Each completed pomodoro helps your companion grow.
              </p>
            <p className="mt-1 font-sans text-[11px] text-zinc-500 dark:text-white/60">
              Today: {(todayFocusMinutes / 60).toFixed(1)}h focused
            </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="mb-4 px-5 py-6">
          <p className="mb-4 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-white/55">
            Backpack
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {backpack.map((it) => (
              <div
                key={it.id}
                className="rounded-2xl border border-zinc-200/80 bg-white/95 p-3 dark:border-white/12 dark:bg-zinc-900/80"
              >
                <div className="mb-2 flex items-center justify-between">
                  <Package className="h-4 w-4 text-zinc-700 dark:text-white" />
                  <span className="font-sans text-[11px] tabular-nums text-zinc-600 dark:text-white/70">×{it.qty}</span>
                </div>
                <p className="line-clamp-1 font-sans text-xs font-semibold text-zinc-900 dark:text-white">{it.name}</p>
                <p className="mt-1 line-clamp-2 min-h-[30px] font-sans text-[10px] text-zinc-500 dark:text-white/55">
                  {it.description}
                </p>
                <button
                  type="button"
                  onClick={() => onUseBackpackItem(it.id)}
                  className="mt-2 w-full rounded-full bg-[#2D3A2D] px-3 py-1.5 font-sans text-[11px] font-semibold text-white dark:bg-white dark:text-black"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="px-5 py-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-white/55">
              Focus style tags
            </p>
            <button
              type="button"
              onClick={share}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200/70 bg-white/50 px-3 py-1 text-[11px] font-medium text-zinc-700 dark:border-white/20 dark:bg-white/10 dark:text-white"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {focusStyleTags.length === 0 && (
              <span className="font-sans text-xs text-zinc-500 dark:text-white/60">Keep focusing to unlock style tags.</span>
            )}
            {focusStyleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-zinc-200/80 bg-white/55 px-3 py-1.5 font-sans text-[11px] font-medium text-zinc-700 dark:border-white/20 dark:bg-white/10 dark:text-white"
              >
                {tag}
              </span>
            ))}
          </div>
        </GlassCard>
      </div>

      {showShareCard && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-5" onClick={() => setShowShareCard(false)}>
          <GlassCard className="w-full max-w-sm border-white/25 bg-black/85 px-5 py-6 text-white" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-xl font-semibold">FOCO My Space</p>
            <p className="mt-2 font-sans text-xs text-white/75">
              Today: {(todayFocusMinutes / 60).toFixed(1)}h focus
            </p>
            <p className="mt-1 font-sans text-sm text-white/90">
              {petName} {petEmoji}
            </p>
            <p className="mt-1 font-sans text-xs text-white/70">
              Level {petLevel} · XP {xpInLevel}/{xpForNext}
            </p>
            <p className="mt-4 font-sans text-[11px] text-white/80">Styles: {focusStyleTags.join(", ") || "None yet"}</p>
            <button
              type="button"
              onClick={() => setShowShareCard(false)}
              className="mt-5 w-full rounded-full bg-white py-2.5 font-sans text-xs font-semibold text-black"
            >
              Close
            </button>
          </GlassCard>
        </div>
      )}

      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="fixed inset-0 z-[140] flex items-center justify-center bg-black/55 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-md"
            >
              <div className="max-h-[86vh] overflow-y-auto rounded-3xl border border-white/20 bg-black/45 p-5 text-white backdrop-blur-[25px]">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-sans text-sm font-semibold uppercase tracking-[0.2em] text-white">Setting</p>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="rounded-full p-2 hover:bg-white/10"
                    aria-label="Close settings"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-6">
                  <section className="rounded-2xl border border-white/15 bg-white/10 p-4">
                    <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-white">Timer</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ["Pomodoro", "pomodoroMinutes"],
                        ["Short Break", "shortBreakMinutes"],
                        ["Long Break", "longBreakMinutes"],
                      ].map(([label, key]) => (
                        <div key={key}>
                          <p className="mb-1 font-sans text-[10px] text-white">{label}</p>
                          <input
                            type="number"
                            min={1}
                            value={settings[key as keyof typeof settings] as number}
                            onChange={(e) => updateSettings({ [key]: Math.max(1, Number(e.target.value) || 1) } as Partial<typeof settings>)}
                            className="w-full rounded-lg border border-white/20 bg-white/20 px-2 py-1.5 font-sans text-sm text-white outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <p className="mb-1 font-sans text-[10px] text-white">Long Break Interval</p>
                      <input
                        type="number"
                        min={1}
                        value={settings.longBreakInterval}
                        onChange={(e) => updateSettings({ longBreakInterval: Math.max(1, Number(e.target.value) || 1) })}
                        className="w-28 rounded-lg border border-white/20 bg-white/20 px-2 py-1.5 font-sans text-sm text-white outline-none"
                      />
                    </div>
                    <div className="mt-4 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateSettings({ autoStartBreaks: !settings.autoStartBreaks });
                          playToggle();
                        }}
                        className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/10 px-3 py-2 font-sans text-sm text-white"
                      >
                        Auto Start Breaks
                        <span className={`relative h-6 w-10 rounded-full ${settings.autoStartBreaks ? "bg-emerald-400" : "bg-white/35"}`}>
                          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${settings.autoStartBreaks ? "left-[18px]" : "left-0.5"}`} />
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateSettings({ autoStartPomodoros: !settings.autoStartPomodoros });
                          playToggle();
                        }}
                        className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/10 px-3 py-2 font-sans text-sm text-white"
                      >
                        Auto Start Pomodoros
                        <span className={`relative h-6 w-10 rounded-full ${settings.autoStartPomodoros ? "bg-emerald-400" : "bg-white/35"}`}>
                          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${settings.autoStartPomodoros ? "left-[18px]" : "left-0.5"}`} />
                        </span>
                      </button>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-white/15 bg-white/10 p-4">
                    <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-white">Theme & Format</p>
                    <div className="mb-3">
                      <p className="mb-2 font-sans text-[10px] text-white">Color Themes</p>
                      <div className="flex gap-2">
                        {[
                          ["forest", "#2D3A2D"],
                          ["midnight", "#1E3A5F"],
                          ["charcoal", "#2A2A2A"],
                        ].map(([name, color]) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => updateSettings({ themePreset: name as SanctuaryScreenProps["settings"]["themePreset"] })}
                            className={`h-8 w-8 rounded-lg border ${settings.themePreset === name ? "border-white" : "border-transparent"}`}
                            style={{ background: color }}
                            aria-label={`Theme ${name}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 font-sans text-[10px] text-white">Hour Format</p>
                      <div className="inline-flex rounded-full border border-white/20 bg-white/10 p-1">
                        {(["12h", "24h"] as const).map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => updateSettings({ hourFormat: fmt })}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${settings.hourFormat === fmt ? "bg-white text-black" : "text-white"}`}
                          >
                            {fmt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
