import type { PropsWithChildren, HTMLAttributes } from "react";
import { cn } from "../utils/cn";

type GlassCardProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & { className?: string }
>;

export function GlassCard({ children, className, ...rest }: GlassCardProps) {
  return (
    <div className={cn("glass-panel", className)} {...rest}>
      {children}
    </div>
  );
}
