import { motion } from "framer-motion";
import {
  ClipboardList,
  Crosshair,
  BarChart3,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../utils/cn";

export type TabKey = "tasks" | "focus" | "stats" | "profile";

type Item = {
  key: TabKey;
  label: string;
  icon: LucideIcon;
};

const items: Item[] = [
  { key: "tasks", label: "Tasks", icon: ClipboardList },
  { key: "focus", label: "Focus", icon: Crosshair },
  { key: "stats", label: "Stats", icon: BarChart3 },
  { key: "profile", label: "My Space", icon: UserRound },
];

type BottomNavProps = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-3">
      <motion.nav
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass-nav pointer-events-auto flex w-[min(92vw,420px)] items-center justify-between px-4 py-2.5"
      >
        {items.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              data-tab={key}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-medium tracking-wide transition-all duration-200",
                "hover:scale-[1.04] active:scale-[0.97]",
                isActive ? "text-black dark:text-white" : "text-zinc-500 dark:text-white/55"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("h-[18px] w-[18px]", isActive && "stroke-[2.25px]")} />
              <span className="font-sans">{label}</span>
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
}
