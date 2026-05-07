import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { BackButton } from "../components/BackButton";
import { GlassCard } from "../components/GlassCard";
import { cn } from "../utils/cn";

const LIFESTYLE = ["Student", "Creator", "Professional"] as const;
const PURSUITS = [
  "Reading",
  "Wellness",
  "Meditation",
  "Mindfulness",
  "Photography",
  "Coding",
  "Writing",
] as const;
const FOCUS_TYPES = ["Deep Work", "Productivity", "Creative Flow"] as const;

export type AboutYouState = {
  lifestyle: string[];
  pursuits: string[];
  focusType: string[];
};

type TellUsAboutYouScreenProps = {
  value: AboutYouState;
  onChange: (next: AboutYouState) => void;
  onContinue: () => void;
  onBack: () => void;
  displayNameLetter: string;
};

function Pill({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 font-sans text-[11px] font-medium transition-colors",
        selected
          ? "border-[#2D3A2D] bg-[#2D3A2D] text-white dark:border-[#2D3A2D] dark:bg-[#2D3A2D]"
          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
      )}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}

export function TellUsAboutYouScreen({
  value,
  onChange,
  onContinue,
  onBack,
  displayNameLetter,
}: TellUsAboutYouScreenProps) {
  const { lifestyle, pursuits, focusType } = value;
  const canContinue = lifestyle.length > 0 && pursuits.length > 0 && focusType.length > 0;

  const [showLifestyleOther, setShowLifestyleOther] = useState(false);
  const [showFocusOther, setShowFocusOther] = useState(false);
  const [lifestyleOtherInput, setLifestyleOtherInput] = useState("");
  const [focusOtherInput, setFocusOtherInput] = useState("");

  const toggleCategory = (key: "lifestyle" | "pursuits" | "focusType", item: string) => {
    const source = value[key];
    const set = new Set(source);
    if (set.has(item)) set.delete(item);
    else set.add(item);
    onChange({ ...value, [key]: [...set] });
  };

  const submitOther = (key: "lifestyle" | "focusType", raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const source = value[key];
    if (!source.some((x) => x.toLowerCase() === text.toLowerCase())) {
      onChange({ ...value, [key]: [...source, text] });
    }
    if (key === "lifestyle") {
      setLifestyleOtherInput("");
      setShowLifestyleOther(false);
    } else {
      setFocusOtherInput("");
      setShowFocusOther(false);
    }
  };

  return (
    <motion.div
      className="flex min-h-full flex-col px-5 pb-28 pt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className="relative z-[1] mb-6 flex items-center justify-between text-white">
        <BackButton onClick={onBack} />
        <span className="font-serif text-base font-semibold tracking-[0.14em]">FOCO</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-xs font-medium">
          {displayNameLetter || "?"}
        </div>
      </header>

      <p className="relative z-[1] mb-3 text-[9px] font-sans font-semibold uppercase tracking-[0.35em] text-white/55">
        Refined onboarding setup
      </p>

      <GlassCard className="relative z-[1] flex flex-col border-zinc-200/80 bg-white/88 px-6 py-8 pb-10 dark:border-zinc-200/70 dark:bg-white/88">
        <h1 className="font-serif text-[1.45rem] font-semibold leading-tight text-zinc-900 dark:text-white">
          Tell us about you
        </h1>
        <p className="mt-3 font-serif text-[13px] leading-relaxed text-zinc-500 dark:text-white/65">
          Select a few elements that define your focus to help us curate your sanctuary.
        </p>

        <div className="mt-9 space-y-10">
          <section>
            <p className="mb-3 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-400 dark:text-white/50">
              Lifestyle
            </p>
            <div className="flex flex-wrap gap-2">
              {LIFESTYLE.map((id) => (
                <Pill
                  key={id}
                  selected={lifestyle.includes(id)}
                  onClick={() => toggleCategory("lifestyle", id)}
                >
                  {id}
                </Pill>
              ))}
              <Pill selected={showLifestyleOther} onClick={() => setShowLifestyleOther((v) => !v)}>
                + Other
              </Pill>
            </div>
            {showLifestyleOther && (
              <input
                autoFocus
                value={lifestyleOtherInput}
                onChange={(e) => setLifestyleOtherInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitOther("lifestyle", lifestyleOtherInput);
                }}
                placeholder="Add lifestyle..."
                className="mt-3 w-full rounded-xl border border-zinc-200/90 bg-white/80 px-3 py-2 font-sans text-[12px] text-zinc-700 outline-none placeholder:text-zinc-400 dark:border-white/20 dark:bg-white/10 dark:text-white dark:placeholder:text-white/45"
              />
            )}
          </section>

          <section>
            <p className="mb-3 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-400 dark:text-white/50">
              Pursuit
            </p>
            <div className="flex flex-wrap gap-2">
              {PURSUITS.map((id) => (
                <Pill
                  key={id}
                  selected={pursuits.includes(id)}
                  onClick={() => toggleCategory("pursuits", id)}
                >
                  {id}
                </Pill>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-3 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-400 dark:text-white/50">
              Focus type
            </p>
            <div className="flex flex-wrap gap-2">
              {FOCUS_TYPES.map((id) => (
                <Pill
                  key={id}
                  selected={focusType.includes(id)}
                  onClick={() => toggleCategory("focusType", id)}
                >
                  {id}
                </Pill>
              ))}
              <Pill selected={showFocusOther} onClick={() => setShowFocusOther((v) => !v)}>
                + Other
              </Pill>
            </div>
            {showFocusOther && (
              <input
                autoFocus
                value={focusOtherInput}
                onChange={(e) => setFocusOtherInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitOther("focusType", focusOtherInput);
                }}
                placeholder="Add focus type..."
                className="mt-3 w-full rounded-xl border border-zinc-200/90 bg-white/80 px-3 py-2 font-sans text-[12px] text-zinc-700 outline-none placeholder:text-zinc-400 dark:border-white/20 dark:bg-white/10 dark:text-white dark:placeholder:text-white/45"
              />
            )}
          </section>
        </div>

        <motion.button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className="mt-12 flex w-full items-center justify-center gap-2 rounded-full bg-[#2D3A2D] py-4 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-40"
          whileHover={canContinue ? { scale: 1.02 } : {}}
          whileTap={canContinue ? { scale: 0.98 } : {}}
        >
          Continue
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </motion.button>
      </GlassCard>
    </motion.div>
  );
}
