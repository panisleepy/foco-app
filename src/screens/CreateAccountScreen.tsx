import { motion } from "framer-motion";
import { BackButton } from "../components/BackButton";
import { GlassCard } from "../components/GlassCard";

type CreateAccountScreenProps = {
  email: string;
  password: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onNext: () => void;
  onBackToWelcome: () => void;
};

/**
 * Prototype: any input (including empty) can proceed — no real auth.
 */
export function CreateAccountScreen({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onNext,
  onBackToWelcome,
}: CreateAccountScreenProps) {
  return (
    <motion.div
      className="flex min-h-full flex-col items-center justify-center px-6 pb-28 pt-14"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
    >
      <motion.header
        className="mb-8 w-full max-w-md text-white"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between">
          <BackButton onClick={onBackToWelcome} />
          <span className="font-serif text-[1.65rem] font-semibold tracking-[0.12em]">FOCO</span>
          <span className="h-8 w-8" aria-hidden />
        </div>
      </motion.header>

      <GlassCard className="w-full max-w-md px-7 py-9 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Create account
        </h1>
        <p className="mt-2 font-serif text-sm text-zinc-500 dark:text-white/65">
          Begin your journey to absolute clarity.
        </p>

        <div className="mt-10 space-y-4">
          <label className="sr-only" htmlFor="signup-email">
            Email address
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Email address"
            className="w-full rounded-full border border-zinc-200/90 bg-white px-5 py-3.5 font-sans text-[15px] text-zinc-900 shadow-inner outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-white/45 dark:focus:border-white/40"
          />
          <label className="sr-only" htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Password"
            className="w-full rounded-full border border-zinc-200/90 bg-white px-5 py-3.5 font-sans text-[15px] text-zinc-900 shadow-inner outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-white/45 dark:focus:border-white/40"
          />
        </div>

        <button
          type="button"
          onClick={onNext}
          className="mt-10 flex w-full items-center justify-center rounded-full bg-[#2D3A2D] py-4 font-sans text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-lg transition-[transform,box-shadow] hover:scale-[1.02] active:scale-[0.98] dark:bg-[#2D3A2D]"
        >
          Next
        </button>

        <button
          type="button"
          onClick={onBackToWelcome}
          className="mt-8 w-full text-center font-sans text-[13px] text-zinc-500 dark:text-white/60"
        >
          Already have an account?{" "}
          <span className="font-medium text-zinc-800 underline decoration-zinc-300 underline-offset-2 dark:text-white">
            Log in
          </span>
        </button>
      </GlassCard>
    </motion.div>
  );
}
