import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  Moon,
  Trash2,
  User,
  UserPlus,
  KeyRound,
} from "lucide-react";
import { GlassCard } from "../components/GlassCard";

type SettingsScreenProps = {
  displayName: string;
  nickname: string;
  onNicknameChange: (v: string) => void;
  notificationsOn: boolean;
  onNotificationsChange: (v: boolean) => void;
  darkTheme: boolean;
  onDarkThemeChange: (v: boolean) => void;
  onBack: () => void;
};

export function SettingsScreen({
  displayName,
  nickname,
  onNicknameChange,
  notificationsOn,
  onNotificationsChange,
  darkTheme,
  onDarkThemeChange,
  onBack,
}: SettingsScreenProps) {
  const row = (
    icon: ReactNode,
    label: string,
    right?: ReactNode,
    danger?: boolean
  ) => (
    <motion.button
      type="button"
      className={`flex w-full items-center gap-3 rounded-2xl px-1 py-3.5 text-left transition-colors hover:bg-black/[0.03] active:scale-[0.99] dark:hover:bg-white/5 ${
        danger ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-white"
      }`}
      whileTap={{ scale: 0.99 }}
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100/80 dark:bg-white/10">
        {icon}
      </span>
      <span className={`flex-1 font-sans text-[15px] font-medium ${danger ? "" : ""}`}>{label}</span>
      {right !== undefined ? (
        right
      ) : !danger ? (
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-zinc-400 dark:text-white/45" />
      ) : null}
    </motion.button>
  );

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative h-8 w-[52px] flex-shrink-0 rounded-full transition-colors ${
        on ? "bg-[var(--foco-accent)]" : "bg-zinc-200 dark:bg-white/25"
      }`}
    >
      <motion.span
        className="absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm"
        animate={{ left: on ? 26 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      />
    </button>
  );

  return (
    <motion.div
      className="flex min-h-full flex-col px-5 pb-32 pt-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
    >
      <header className="header-glass mb-2 flex items-center justify-between px-2 py-1.5 text-white">
        <button type="button" className="rounded-full p-2 opacity-90 hover:opacity-100" aria-label="Back" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-serif text-lg font-semibold tracking-[0.14em]">FOCO</span>
        <span className="h-9 w-9" aria-hidden />
      </header>

      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-6 font-serif text-[1.85rem] font-semibold text-white">Settings</h1>

        <GlassCard className="px-4 py-2">
          <p className="px-1 pt-3 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-white/55">
            Profile
          </p>
          <div className="border-b border-zinc-200/60 py-2 dark:border-white/10">
            <div className="flex items-center gap-3 rounded-2xl px-1 py-2">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100/80 text-zinc-800 dark:bg-white/10 dark:text-white">
                <User className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <label htmlFor="nickname" className="sr-only">
                  Edit nickname
                </label>
                <p className="font-sans text-xs text-zinc-500 dark:text-white/65">Nickname</p>
                <input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => onNicknameChange(e.target.value)}
                  placeholder={displayName || "Your name"}
                  className="mt-1 w-full border-b border-transparent bg-transparent font-sans text-[15px] font-medium text-zinc-900 outline-none focus:border-zinc-400 dark:text-white dark:placeholder:text-white/45 dark:focus:border-white/40"
                />
              </div>
            </div>
          </div>

          <p className="mt-5 px-1 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-white/55">
            Account
          </p>
          <div className="-mx-1 border-b border-zinc-200/60 pb-1 dark:border-white/10">
            {row(<UserPlus className="h-5 w-5 text-zinc-700 dark:text-white" />, "Account Management")}
          </div>
          <div className="-mx-1 border-b border-zinc-200/60 pb-1 dark:border-white/10">
            {row(<KeyRound className="h-5 w-5 text-zinc-700 dark:text-white" />, "Reset Password")}
          </div>

          <p className="mt-5 px-1 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-white/55">
            Preferences
          </p>
          <motion.button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl px-1 py-3.5 text-left hover:bg-black/[0.03] dark:hover:bg-white/5"
            whileTap={{ scale: 0.99 }}
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100/80 dark:bg-white/10">
              <Bell className="h-5 w-5 text-zinc-700 dark:text-white" />
            </span>
            <span className="flex-1 font-sans text-[15px] font-medium text-zinc-900 dark:text-white">
              Push Notifications
            </span>
            <Toggle on={notificationsOn} onToggle={() => onNotificationsChange(!notificationsOn)} />
          </motion.button>
          <motion.button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl px-1 py-3.5 text-left hover:bg-black/[0.03] dark:hover:bg-white/5"
            whileTap={{ scale: 0.99 }}
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100/80 dark:bg-white/10">
              <Moon className="h-5 w-5 text-zinc-700 dark:text-white" />
            </span>
            <span className="flex-1 font-sans text-[15px] font-medium text-zinc-900 dark:text-white">Dark Theme</span>
            <Toggle on={darkTheme} onToggle={() => onDarkThemeChange(!darkTheme)} />
          </motion.button>

          <p className="mt-4 px-1 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-white/55">
            Data &amp; Privacy
          </p>
          <div className="-mx-1 border-b border-zinc-200/60 pb-1 dark:border-white/10">
            {row(<Download className="h-5 w-5 text-zinc-700 dark:text-white" />, "Export Personal Data")}
          </div>
          <div className="-mx-1 border-b border-zinc-200/60 pb-1 dark:border-white/10">
            {row(<Trash2 className="h-5 w-5 text-zinc-700 dark:text-white" />, "Clear Local Cache")}
          </div>

          <p className="mt-4 px-1 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-red-500">
            Danger zone
          </p>
          <div className="-mx-1 pb-2">{row(<Trash2 className="h-5 w-5" />, "Delete Account", null, true)}</div>
        </GlassCard>
      </div>
    </motion.div>
  );
}
