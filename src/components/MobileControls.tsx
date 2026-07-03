// On-Screen Touch-Steuerung. Setzt dieselben window-Key-Events wie eine Tastatur.
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

function fire(key: string, down: boolean) {
  const evt = new KeyboardEvent(down ? "keydown" : "keyup", { key, bubbles: true });
  window.dispatchEvent(evt);
}

function TouchButton({ label, keyName, className = "" }: { label: string; keyName: string; className?: string }) {
  const [active, setActive] = useState(false);
  const down = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setActive(true);
    fire(keyName, true);
    if ("vibrate" in navigator) navigator.vibrate?.(10);
  };
  const up = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setActive(false);
    fire(keyName, false);
  };
  return (
    <button
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={up}
      onContextMenu={(e) => e.preventDefault()}
      className={`pointer-events-auto flex items-center justify-center rounded-full border-2 bg-card/70 font-mono text-2xl backdrop-blur-md select-none active:scale-95 transition-transform ${active ? "border-primary bg-primary/30" : "border-white/30"} ${className}`}
      style={{ WebkitTapHighlightColor: "transparent", touchAction: "none" }}
    >
      {label}
    </button>
  );
}

export function MobileControls() {
  const isMobile = useIsMobile();
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    // Auto-Show wenn Touch-Device (auch Tablets ohne mobile-breakpoint).
    if (typeof window !== "undefined" && "ontouchstart" in window) setForceShow(true);
  }, []);

  if (!isMobile && !forceShow) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {/* Links: Lenkung */}
      <div className="absolute bottom-6 left-6 flex flex-col items-center gap-2">
        <div className="flex gap-2">
          <TouchButton label="◀" keyName="ArrowLeft" className="h-16 w-16" />
          <TouchButton label="▶" keyName="ArrowRight" className="h-16 w-16" />
        </div>
      </div>

      {/* Rechts: Gas/Bremse/Rückwärts */}
      <div className="absolute bottom-6 right-6 flex items-end gap-3">
        <TouchButton label="⏪" keyName="ArrowDown" className="h-14 w-14" />
        <TouchButton label="🅱" keyName=" " className="h-16 w-16" />
        <TouchButton label="⛽" keyName="ArrowUp" className="h-20 w-20" />
      </div>
    </div>
  );
}
