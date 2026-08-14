"use client";

import { useState } from "react";
import { ChevronLeft, PanelLeftOpen } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { ControlPanel } from "./ControlPanel";

/**
 * LeftPanel：浮在地圖之上的左側操作面板外殼（Google Maps 風格）。
 *
 * 職責單一＝「面板的開合與定位」。開合是純 UI 局部狀態（只有這個外殼關心），
 * 故用 useState，不放進 workspace store（store 只管跨島共享的意圖狀態）。
 *
 * 內容委派給 ControlPanel；本元件只負責：標題列、收合/展開、捲動。
 */
export function LeftPanel() {
  const [open, setOpen] = useState(true);

  return (
    <>
      {/* 面板本體：收合時向左滑出視口 */}
      <aside
        aria-hidden={!open}
        className={cn(
          "pointer-events-auto absolute top-4 bottom-4 left-4 z-20 flex w-[min(430px,calc(100vw-2rem))] flex-col overflow-hidden bg-[#0c1724]/80 shadow-[0_18px_55px_rgba(9,15,22,0.48)] backdrop-blur-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-[calc(100%+1.5rem)]",
        )}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#bfe3ff]/70 to-transparent" />

        <header className="flex items-center justify-between px-4 pb-4 pt-4">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#d9745f] shadow-[0_0_18px_rgba(217,116,95,0.9)]" />
              <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-slate-300/80">
                Route overview
              </span>
            </div>
            <h1 className="truncate text-[1.15rem] font-semibold tracking-[-0.04em] text-slate-50">
              Iceland Insight
            </h1>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label="收合面板"
            className="h-9 w-9 rounded-full text-slate-200 hover:bg-white/5 hover:text-white"
          >
            <ChevronLeft className="size-4" />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <ControlPanel />
        </div>
      </aside>

      <Button
        variant="secondary"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="展開面板"
        className={cn(
          "pointer-events-auto absolute top-4 left-4 z-20 h-11 w-11 rounded-full border border-white/10 bg-[#0f1d2b]/85 text-slate-50 shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-200 hover:bg-[#122334]",
          open ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <PanelLeftOpen className="size-4" />
      </Button>
    </>
  );
}