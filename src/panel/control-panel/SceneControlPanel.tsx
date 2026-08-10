"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Settings, X } from "lucide-react";

import { cn } from "@/src/lib/utils";
import { DetailTab } from "./DetailTab";
import { DisplayTab } from "./DisplayTab";
import { LightingTab } from "./LightingTab";
import { TimelineTab } from "./TimelineTab";

export type SceneTabKey = "display" | "lighting" | "detail" | "timeline";

type SceneTabDefinition = {
  key: SceneTabKey;
  label: string;
  content: ReactNode;
};

const SCENE_TABS: SceneTabDefinition[] = [
  {
    key: "display",
    label: "顯示",
    content: (
      <div style={{ maxWidth: "100%" }}>
        <DisplayTab />
      </div>
    ),
  },
  {
    key: "lighting",
    label: "光影風格",
    content: (
      <div style={{ maxWidth: "100%" }}>
        <LightingTab />
      </div>
    ),
  },
  {
    key: "detail",
    label: "細節程度",
    content: (
      <div style={{ maxWidth: "100%" }}>
        <DetailTab />
      </div>
    ),
  },
  {
    key: "timeline",
    label: "時間軸",
    content: (
      <div style={{ maxWidth: "100%" }}>
        <TimelineTab />
      </div>
    ),
  },
];

function getSceneTabs(): SceneTabDefinition[] {
  return SCENE_TABS;
}

export function SceneControlPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState<SceneTabKey>("display");

  const openSettings = () => {
    setActiveTabKey("display");
    setIsOpen((prev) => !prev);
  };

  const closeSettings = () => {
    setIsOpen(false);
  };

  const setTab = (tab: SceneTabKey) => {
    setActiveTabKey(tab);
    setIsOpen(true);
  };

  const tabs = useMemo(() => getSceneTabs(), []);
  const activeTab = tabs.find((tab) => tab.key === activeTabKey) ?? tabs[0];

  const isPanelVisible = isOpen;

  return (
    <>
      <button
        type="button"
        onClick={openSettings}
        className="pointer-events-auto absolute top-4 right-4 z-30 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3 py-2 text-xs font-medium text-white/85 shadow-lg backdrop-blur transition hover:bg-black/75"
        aria-expanded={isPanelVisible}
        aria-label={isPanelVisible ? "切換到設定抽屜" : "開啟設定抽屜"}
      >
        <Settings className="size-4" />
        Settings
      </button>

      <section
        aria-hidden={!isPanelVisible}
        className={cn(
          "absolute top-16 right-0 z-30 w-[min(420px,calc(100vw-1.5rem))] rounded-xl border border-white/10 bg-black/70 px-4 py-4 shadow-2xl backdrop-blur-md transform-gpu transition-transform duration-300 ease-out",
          isPanelVisible
            ? "pointer-events-auto translate-x-0"
            : "pointer-events-none translate-x-full",
        )}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">Scene Settings</p>
            <button
              type="button"
              onClick={closeSettings}
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 p-1.5 text-white/80 transition hover:bg-white/10"
              aria-label="關閉設定抽屜"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map((tab) => (
                <ControlTabButton
                  key={tab.key}
                  label={tab.label}
                  active={activeTabKey === tab.key}
                  onClick={() => setTab(tab.key)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">{activeTab?.content}</div>
        </div>
      </section>
    </>
  );
}

function ControlTabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "rounded-full border border-sky-300/70 bg-sky-400/20 px-4 py-2 text-sm font-medium text-white"
          : "rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
      }
    >
      {label}
    </button>
  );
}
