import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect, useRef } from "react";

type ShimmerOverlayProps = {
  active: boolean;
};

export function ShimmerOverlay({ active }: ShimmerOverlayProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const burst = (scalar: number) => {
      confetti({
        particleCount: Math.round(90 * scalar),
        spread: 72,
        startVelocity: 38,
        ticks: 240,
        gravity: 1.05,
        scalar,
        origin: { x: 0.5, y: 0.42 },
        colors: ["#ffffff", "#fef9c3", "#e4e4e7", "#d4d4d8", "#a3a3a3"],
      });
    };

    const id = window.requestAnimationFrame(() => {
      burst(1);
      window.setTimeout(() => burst(0.85), 140);
      window.setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.65 },
          colors: ["#ffffff", "#fef08a"],
        });
      }, 90);
      window.setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.65 },
          colors: ["#ffffff", "#e4e4e7"],
        });
      }, 90);
    });

    return () => window.cancelAnimationFrame(id);
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-white via-white to-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.82, times: [0, 0.28, 1], ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 90% 55% at 50% 38%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.25) 52%, transparent 74%)",
            }}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: [0, 0.95, 0], scale: [0.9, 1.04, 1.08] }}
            transition={{ duration: 0.85, ease: "easeOut" }}
          />
          {[...Array(24)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,1)]"
              style={{
                left: `${6 + ((i * 41) % 88)}%`,
                top: `${10 + ((i * 29) % 78)}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.2, 1.6, 0.1],
              }}
              transition={{
                duration: 0.7,
                delay: i * 0.018,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
