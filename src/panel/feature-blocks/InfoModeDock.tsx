"use client";

import { useInfoModeState } from "@/src/app-shell/hooks/useInfoModeState";

export function InfoModeDock() {
  const { activeMode, options, toggleMode } = useInfoModeState();

  return (
    <div className="pointer-events-auto absolute right-4 bottom-4 z-30">
      <div className="rounded-2xl border border-white/15 bg-black/45 p-2 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-2">
          {options.map(({ id, label, Icon }) => {
            const isActive = activeMode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleMode(id)}
                aria-label={label}
                aria-pressed={isActive}
                title={label}
                className={
                  isActive
                    ? "inline-flex size-11 items-center justify-center rounded-xl border border-sky-300/80 bg-sky-400/20 text-sky-100"
                    : "inline-flex size-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/10"
                }
              >
                <Icon className="size-5" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
