/**
 * Full-viewport backdrop: dark organic wash at top, easing to white.
 * Variant is controlled from My Space → Settings (UI backdrop).
 */
export type UiBackdropId = "noir" | "blue" | "green" | "bluePink";

export const UI_BACKDROP_OPTIONS: { id: UiBackdropId; label: string }[] = [
  { id: "noir", label: "Noir" },
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
  { id: "bluePink", label: "Blue-Pink Gradient" },
];

/** Compact gradient for settings swatches (top band only). */
export const UI_BACKDROP_SWATCH: Record<UiBackdropId, string> = {
  noir: "linear-gradient(180deg, #000000 0%, #52525b 60%, #fafafa 100%)",
  blue: "linear-gradient(180deg, #020617 0%, #1e40af 55%, #f1f5f9 100%)",
  green: "linear-gradient(180deg, #052e16 0%, #166534 55%, #f0fdf4 100%)",
  bluePink: "linear-gradient(180deg, #dbeafe 0%, #e9d5ff 45%, #fbcfe8 100%)",
};

/** Light blue (top) → light pink (bottom), full viewport — no white band. */
const BLUE_PINK_FULL: string =
  "linear-gradient(180deg, #dbeafe 0%, #e0e7ff 18%, #e9d5ff 42%, #f5d0fe 68%, #fbcfe8 88%, #fce7f3 100%)";

const LAYERS: Record<
  Exclude<UiBackdropId, "bluePink">,
  {
    stripe: string;
    orbLeft: string;
    orbMid: string;
  }
> = {
  noir: {
    stripe:
      "linear-gradient(180deg, #000000 0%, rgba(24,24,27,0.94) 32%, rgba(250,250,250,1) 88%, #ffffff 100%)",
    orbLeft:
      "radial-gradient(closest-side, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 45%, transparent 72%)",
    orbMid:
      "radial-gradient(closest-side, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.12) 55%, transparent 70%)",
  },
  blue: {
    stripe:
      "linear-gradient(180deg, #020617 0%, rgba(30,58,138,0.9) 30%, rgba(241,245,249,1) 88%, #ffffff 100%)",
    orbLeft:
      "radial-gradient(closest-side, rgba(37,99,235,0.72) 0%, rgba(59,130,246,0.35) 42%, transparent 72%)",
    orbMid:
      "radial-gradient(closest-side, rgba(30,64,175,0.5) 0%, rgba(96,165,250,0.14) 55%, transparent 70%)",
  },
  green: {
    stripe:
      "linear-gradient(180deg, #052e16 0%, rgba(22,101,52,0.88) 30%, rgba(240,253,244,1) 88%, #ffffff 100%)",
    orbLeft:
      "radial-gradient(closest-side, rgba(22,101,52,0.78) 0%, rgba(34,197,94,0.32) 45%, transparent 72%)",
    orbMid:
      "radial-gradient(closest-side, rgba(20,83,45,0.48) 0%, rgba(74,222,128,0.12) 55%, transparent 70%)",
  },
};

type PageBackgroundProps = {
  backdrop: UiBackdropId;
};

export function PageBackground({ backdrop }: PageBackgroundProps) {
  if (backdrop === "bluePink") {
    return (
      <div
        className="pointer-events-none fixed inset-0 -z-10 min-h-[100dvh] overflow-hidden"
        style={{ background: BLUE_PINK_FULL }}
      >
        <div
          className="absolute -left-[15%] -top-[20%] h-[min(75vh,520px)] w-[min(95vw,620px)] rounded-full opacity-70 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(191,219,254,0.95) 0%, rgba(224,231,255,0.35) 48%, transparent 72%)",
          }}
        />
        <div
          className="absolute -bottom-[18%] -right-[12%] h-[min(70vh,480px)] w-[min(90vw,560px)] rounded-full opacity-65 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(251,207,232,0.92) 0%, rgba(252,231,243,0.4) 50%, transparent 74%)",
          }}
        />
      </div>
    );
  }

  const c = LAYERS[backdrop];
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white">
      <div className="absolute inset-x-0 top-0 h-[62%]" style={{ background: c.stripe }} />
      <div
        className="absolute -left-[18%] -top-[28%] h-[520px] w-[620px] rounded-full blur-3xl"
        style={{ background: c.orbLeft }}
      />
      <div
        className="absolute left-1/2 top-[2%] h-[440px] w-[480px] -translate-x-1/2 rounded-full blur-[90px]"
        style={{ background: c.orbMid }}
      />
    </div>
  );
}
