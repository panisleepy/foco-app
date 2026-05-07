/**
 * Reference layout: pure black + organic blob at top, smooth fade to white.
 * Intentionally identical in light and dark theme per product spec.
 */
export function PageBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white">
      <div
        className="absolute inset-x-0 top-0 h-[62%]"
        style={{
          background:
            "linear-gradient(180deg, #000000 0%, rgba(24,24,27,0.94) 32%, rgba(250,250,250,1) 88%, #ffffff 100%)",
        }}
      />
      <div
        className="absolute -left-[18%] -top-[28%] h-[520px] w-[620px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 45%, transparent 72%)",
        }}
      />
      <div
        className="absolute left-1/2 top-[2%] h-[440px] w-[480px] -translate-x-1/2 rounded-full blur-[90px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.12) 55%, transparent 70%)",
        }}
      />
    </div>
  );
}
