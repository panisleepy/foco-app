import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import type { PropsWithChildren } from "react";

type SoundName =
  | "tap_01"
  | "type_01"
  | "toggle_on"
  | "toggle_off"
  | "transition_up"
  | "notification"
  | "celebration"
  | "ringtone_loop";

type SoundContextValue = {
  play: (name: SoundName, volume?: number) => void;
  playToggle: (on: boolean) => void;
  startLoop: (name: Extract<SoundName, "ringtone_loop">, volume?: number) => void;
  stopLoop: (name: Extract<SoundName, "ringtone_loop">) => void;
};

const SOUND_FILES: Record<SoundName, string> = {
  tap_01: "/sounds/tap_01.wav",
  type_01: "/sounds/type_01.wav",
  toggle_on: "/sounds/toggle_on.wav",
  toggle_off: "/sounds/toggle_off.wav",
  transition_up: "/sounds/transition_up.wav",
  notification: "/sounds/notification.wav",
  celebration: "/sounds/celebration.wav",
  ringtone_loop: "/sounds/ringtone_loop.wav",
};

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: PropsWithChildren) {
  const cacheRef = useRef<Partial<Record<SoundName, HTMLAudioElement>>>({});
  const lastTapRef = useRef(0);
  const lastTypeRef = useRef(0);
  const loopsRef = useRef<Partial<Record<"ringtone_loop", HTMLAudioElement>>>({});

  useEffect(() => {
    (Object.keys(SOUND_FILES) as SoundName[]).forEach((name) => {
      const audio = new Audio(SOUND_FILES[name]);
      audio.preload = "auto";
      cacheRef.current[name] = audio;
    });
  }, []);

  const play = useCallback((name: SoundName, volume = 0.5) => {
    const src = cacheRef.current[name];
    if (!src) return;
    try {
      const audio = src.cloneNode(true) as HTMLAudioElement;
      audio.volume = Math.max(0, Math.min(1, volume));
      void audio.play();
    } catch {
      // ignore autoplay/runtime issues
    }
  }, []);

  const playToggle = useCallback(
    (on: boolean) => {
      play(on ? "toggle_on" : "toggle_off", 0.5);
    },
    [play]
  );

  const stopLoop = useCallback((name: "ringtone_loop") => {
    const current = loopsRef.current[name];
    if (!current) return;
    current.pause();
    current.currentTime = 0;
    loopsRef.current[name] = undefined;
  }, []);

  const startLoop = useCallback(
    (name: "ringtone_loop", volume = 0.65) => {
      const src = cacheRef.current[name];
      if (!src) return;
      stopLoop(name);
      try {
        const audio = src.cloneNode(true) as HTMLAudioElement;
        audio.loop = true;
        audio.volume = Math.max(0, Math.min(1, volume));
        loopsRef.current[name] = audio;
        void audio.play();
      } catch {
        // ignore autoplay/runtime issues
      }
    },
    [stopLoop]
  );

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const control = target.closest("button, [role='button'], a");
      if (!control) return;
      /** First button tap while session ringtone plays: mute immediately */
      if (loopsRef.current.ringtone_loop) {
        stopLoop("ringtone_loop");
      }
      if (control.getAttribute("data-sound") === "off") return;
      const now = Date.now();
      if (now - lastTapRef.current < 55) return;
      lastTapRef.current = now;
      play("tap_01", 0.26);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [play, stopLoop]);

  useEffect(() => {
    const onType = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const isTypingTarget =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.getAttribute("contenteditable") === "true";
      if (!isTypingTarget) return;
      if (event.key.length !== 1 && event.key !== "Backspace" && event.key !== "Delete") return;
      const now = Date.now();
      if (now - lastTypeRef.current < 65) return;
      lastTypeRef.current = now;
      play("type_01", 0.2);
    };
    document.addEventListener("keydown", onType, true);
    return () => document.removeEventListener("keydown", onType, true);
  }, [play]);

  useEffect(() => {
    return () => {
      stopLoop("ringtone_loop");
    };
  }, [stopLoop]);

  const value = useMemo<SoundContextValue>(
    () => ({
      play,
      playToggle,
      startLoop,
      stopLoop,
    }),
    [play, playToggle, startLoop, stopLoop]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used within SoundProvider");
  return ctx;
}

