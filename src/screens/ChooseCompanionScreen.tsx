import { motion } from "framer-motion";
import { BackButton } from "../components/BackButton";
import { GlassCard } from "../components/GlassCard";
import { cn } from "../utils/cn";

const COMPANIONS: { emoji: string; label: string }[] = [
  { emoji: "🦊", label: "FOX" },
  { emoji: "🐱", label: "CAT" },
  { emoji: "🐶", label: "DOG" },
  { emoji: "🐰", label: "BUNNY" },
];

type ChooseCompanionScreenProps = {
  selectedEmoji: string;
  onSelect: (emoji: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  displayNameLetter: string;
};

export function ChooseCompanionScreen({
  selectedEmoji,
  onSelect,
  onConfirm,
  onBack,
  displayNameLetter,
}: ChooseCompanionScreenProps) {
  return (
    <motion.div
      className="flex min-h-full flex-col px-5 pb-28 pt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
    >
      <header className="relative z-[1] mb-6 flex items-center justify-between text-white">
        <BackButton onClick={onBack} />
        <span className="font-serif text-base font-semibold tracking-[0.14em]">FOCO</span>
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/10 text-xs font-medium">
          {displayNameLetter || "?"}
        </div>
      </header>

      <div className="relative z-[1] mx-auto w-full max-w-md flex-1">
        <h1 className="font-serif text-[1.55rem] font-semibold leading-tight text-white">
          Choose your companion
        </h1>
        <p className="mt-2 max-w-sm font-serif text-[13px] leading-relaxed text-white/70">
          Select a starter pet to accompany you on your focus journey.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {COMPANIONS.map(({ emoji, label }) => {
            const selected = selectedEmoji === emoji;
            return (
              <GlassCard
                key={label}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(emoji)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(emoji);
                  }
                }}
                className={cn(
                  "cursor-pointer px-4 py-6 text-center transition-[transform,box-shadow] hover:scale-[1.02]",
                  selected &&
                    "ring-2 ring-[var(--foco-accent)] ring-offset-2 ring-offset-transparent"
                )}
              >
                <div className="text-4xl leading-none">{emoji}</div>
                <p className="mt-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-white/55">
                  {label}
                </p>
              </GlassCard>
            );
          })}
        </div>

        <button
          type="button"
          data-sound="off"
          onClick={onConfirm}
          className="mt-10 w-full rounded-full bg-[var(--foco-accent)] py-4 font-sans text-sm font-semibold text-[var(--foco-accent-contrast)] shadow-xl transition-[transform,box-shadow] hover:scale-[1.02] active:scale-[0.98]"
        >
          Confirm selection
        </button>
      </div>
    </motion.div>
  );
}
