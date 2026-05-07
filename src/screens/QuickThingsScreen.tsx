import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { BackButton } from "../components/BackButton";
import { GlassCard } from "../components/GlassCard";
import { cn } from "../utils/cn";

type QuickThingsScreenProps = {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  onTermsToggle: () => void;
  onPrivacyToggle: () => void;
  onContinue: () => void;
  onBack: () => void;
  displayNameLetter: string;
};

function Row({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-2xl border border-transparent py-3 text-left transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/5"
    >
      <span
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2",
          checked
            ? "border-[#2D3A2D] bg-[#2D3A2D] text-white dark:border-[#2D3A2D] dark:bg-[#2D3A2D]"
            : "border-zinc-300 bg-white dark:border-white/30 dark:bg-white/5"
        )}
        aria-hidden
      >
        {checked ? <Check className="h-4 w-4 stroke-[3]" /> : null}
      </span>
      <span className="font-sans text-[15px] font-medium text-zinc-900 dark:text-white">{label}</span>
    </button>
  );
}

export function QuickThingsScreen({
  termsAccepted,
  privacyAccepted,
  onTermsToggle,
  onPrivacyToggle,
  onContinue,
  onBack,
  displayNameLetter,
}: QuickThingsScreenProps) {
  const canContinue = termsAccepted && privacyAccepted;

  return (
    <motion.div
      className="flex min-h-full flex-col px-5 pb-28 pt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className="relative z-[1] mb-8 flex items-center justify-between text-white">
        <BackButton onClick={onBack} />
        <span className="font-serif text-base font-semibold tracking-[0.14em]">FOCO</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-xs font-medium">
          {displayNameLetter || "?"}
        </div>
      </header>

      <div className="relative z-[1] mx-auto w-full max-w-md flex-1">
        <GlassCard className="px-6 py-8">
          <h1 className="font-serif text-[1.45rem] font-semibold tracking-tight text-zinc-900 dark:text-white">
            A few quick things
          </h1>
          <p className="mt-3 font-serif text-[13px] leading-relaxed text-zinc-500 dark:text-white/65">
            Please review and accept to continue your journey.
          </p>

          <div className="mt-8 space-y-1 border-t border-zinc-100 pt-6 dark:border-white/10">
            <Row checked={termsAccepted} label="Terms of Service" onToggle={onTermsToggle} />
            <Row checked={privacyAccepted} label="Privacy Policy" onToggle={onPrivacyToggle} />
          </div>

          <motion.button
            type="button"
            disabled={!canContinue}
            onClick={onContinue}
            className="mt-10 flex w-full items-center justify-center gap-2 rounded-full bg-[#2D3A2D] py-4 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-40"
            whileHover={canContinue ? { scale: 1.02 } : {}}
            whileTap={canContinue ? { scale: 0.98 } : {}}
          >
            Continue
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </motion.button>
        </GlassCard>
      </div>
    </motion.div>
  );
}
