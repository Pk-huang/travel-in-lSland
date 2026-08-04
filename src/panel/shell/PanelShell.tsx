"use client";

import { Suspense } from "react";

import { InfoModeDock } from "@/src/panel/feature-blocks/InfoModeDock";
import { LeftPanel } from "@/src/panel/shell/leftpnel";
import { TimelineControl } from "@/src/panel/feature-blocks/TimelineControl";
import { WeatherDrawer } from "@/src/panel/feature-blocks/WeatherDrawer";

export function PanelShell() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="pointer-events-none absolute inset-0 flex flex-col">
        <div className="pointer-events-none flex flex-1">
          {/* 左側主區塊：放置主面板與主要內容 */}
          <div className="pointer-events-none relative flex h-full w-full max-w-[460px] items-start justify-start">
         
              <LeftPanel />
        
          </div>

          {/* 右側功能區塊：放置抽屜、模式切換、時間軸與其他功能內容 */}
          <div className="pointer-events-none relative flex-1">
            <WeatherDrawer />
            <InfoModeDock />
            <TimelineControl />
          </div>
        </div>
      </div>
    </div>
  );
}
