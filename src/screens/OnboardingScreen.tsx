import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { BackButton } from "../components/BackButton";
import { GlassCard } from "../components/GlassCard";

type OnboardingScreenProps = {
  name: string;
  onNameChange: (v: string) => void;
  onContinue: () => void;
  onBack: () => void;
};

export function OnboardingScreen({ name, onNameChange, onContinue, onBack }: OnboardingScreenProps) {
  const canContinue = name.trim().length > 0;

  return (
    <motion.div
      className="flex min-h-full flex-col items-center justify-center px-6 pb-28 pt-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.header
        className="mb-10 w-full max-w-md text-white"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.45 }}
      >
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} />
          <span className="font-serif text-[1.65rem] font-semibold tracking-[0.12em]">FOCO</span>
          <span className="h-8 w-8" aria-hidden />
        </div>
        <p className="mx-auto mt-3 max-w-xs text-center text-sm font-sans font-medium text-zinc-400 dark:text-white/65">
          Focus together, grow together
        </p>
      </motion.header>

      <GlassCard className="w-full max-w-md px-7 py-9">
        <div className="mb-8 flex justify-center">
          <Sparkles className="h-6 w-6 text-zinc-800 dark:text-white" aria-hidden />
        </div>
        <h1 className="mb-10 text-center font-serif text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          What shall we call you?
        </h1>
        <div className="mb-12">
          <label htmlFor="display-name" className="sr-only">
            Your name
          </label>
          <input
            id="display-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Your Name"
            className="w-full border-b border-zinc-300 bg-transparent pb-2.5 font-sans text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-800 dark:border-white/25 dark:text-white dark:placeholder:text-white/45 dark:focus:border-white"
          />
        </div>
        <motion.button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className="flex w-full items-center justify-center rounded-full bg-[#2D3A2D] py-4 font-sans text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-black/10 transition-[transform,box-shadow] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black"
          whileHover={canContinue ? { scale: 1.02, boxShadow: "0 16px 40px rgba(0,0,0,0.18)" } : {}}
          whileTap={canContinue ? { scale: 0.98 } : {}}
        >
          Continue
        </motion.button>
      </GlassCard>
    </motion.div>
  );
}
