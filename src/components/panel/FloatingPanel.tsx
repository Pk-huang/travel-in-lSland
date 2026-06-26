"use client";

import { useState } from "react";
import { ChevronLeft, PanelLeftOpen } from "lucide-react";

import { ControlPanel } from "@/src/components/panel/ControlPanel";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

/**
 * FloatingPanel：浮在地圖之上的操作面板外殼（Google Maps 風格）。
 *
 * 職責單一＝「面板的開合與定位」。開合是純 UI 局部狀態（只有這個外殼關心），
 * 故用 useState，不放進 workspace store（store 只管跨島共享的意圖狀態）。
 *
 * 內容委派給 ControlPanel；本元件只負責：標題列、收合/展開、捲動。
 */
export function FloatingPanel() {
  const [open, setOpen] = useState(true);

  return (
    <>
      {/* 面板本體：收合時向左滑出視口 */}
      <aside
        aria-hidden={!open}
        className={cn(
          "bg-card/80 border-border pointer-events-auto absolute top-4 bottom-4 left-4 z-20 flex w-[min(460px,calc(100vw-2rem))] flex-col rounded-xl border shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-[calc(100%+1.5rem)]",
        )}
      >
        {/* 標題列 */}
        <header className="border-border flex items-center justify-between border-b px-4 py-3">
          <div>
            <h1 className="text-lg leading-tight font-bold">Iceland Insight</h1>
            <p className="text-muted-foreground text-xs">即時冰島天氣與路況</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label="收合面板"
          >
            <ChevronLeft className="size-5" />
          </Button>
        </header>

        {/* 可捲動內容 */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <ControlPanel />
        </div>
      </aside>

      {/* 展開按鈕：僅在收合時顯示 */}
      <Button
        variant="secondary"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="展開面板"
        className={cn(
          "pointer-events-auto absolute top-4 left-4 z-20 shadow-lg backdrop-blur-md transition-opacity duration-200",
          open ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <PanelLeftOpen className="size-5" />
      </Button>
    </>
  );
}
