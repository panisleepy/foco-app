import { ChevronLeft } from "lucide-react";

type BackButtonProps = {
  onClick: () => void;
  className?: string;
};

export function BackButton({ onClick, className }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      className={`rounded-full border border-white/30 bg-white/10 p-2 text-white transition hover:bg-white/20 ${className ?? ""}`}
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
  );
}
