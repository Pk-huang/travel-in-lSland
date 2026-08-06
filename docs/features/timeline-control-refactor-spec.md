# 功能規格：時間軸控制與場景設定面板重構

## Implementation Status (2026-08-06)

- 狀態：已完成實作
- 目前成果：時間軸與場景設定邏輯已拆分為更小的面板元件與 controller hooks，並將抽屜開合與分頁狀態收回到面板元件本身。
- 主要落地檔案：
  - [src/panel/control-panel/SceneControlPanel.tsx](src/panel/control-panel/SceneControlPanel.tsx)
  - [src/panel/control-panel/TimelineTab.tsx](src/panel/control-panel/TimelineTab.tsx)
  - [src/panel/control-panel/DisplayTab.tsx](src/panel/control-panel/DisplayTab.tsx)
  - [src/panel/control-panel/LightingTab.tsx](src/panel/control-panel/LightingTab.tsx)
  - [src/panel/control-panel/DetailTab.tsx](src/panel/control-panel/DetailTab.tsx)
  - [src/panel/control-panel/useTimelineIntentController.ts](src/panel/control-panel/useTimelineIntentController.ts)
  - [src/panel/control-panel/useDisplaySettingsController.ts](src/panel/control-panel/useDisplaySettingsController.ts)
  - [src/panel/control-panel/useLightingSettingsController.ts](src/panel/control-panel/useLightingSettingsController.ts)
  - [src/panel/control-panel/useTerrainDetailController.ts](src/panel/control-panel/useTerrainDetailController.ts)
- 後續建議：可在下一階段補上針對 timeline / scene panel 的互動回歸測試，進一步鎖住行為。

## Problem Statement

目前右側的時間軸與場景設定控制邏輯散落在同一個過於龐大的 UI module 中，使用者在操作「時間軸」、「播放控制」、「設定抽屜」、「顯示控制」、「光影樣式」、「地形細節」與「地圖焦點」時，會感受到邏輯過於混雜。這會讓後續維護與擴充變得困難，也讓不同互動行為難以獨立測試與理解。

使用者需要的是：在不改變現有操作體驗的前提下，讓這一組控制邏輯變得更容易拆解、理解與測試，並讓不同責任彼此有清楚的邊界。

## Solution

將時間軸與場景設定控制拆成兩個更清楚的責任區塊：

- 一個負責「時間軸意圖」：包含時間選擇、播放狀態與播放速度。
- 一個負責「場景設定」：包含抽屉開合、分頁切換、區域選擇、光影樣式、地形細節與相關顯示控制。

同時，將地圖焦點與其他跨模組副作用收斂為一個共享的 adapter，讓不同控制區塊可以共用，而不是在多個地方各自處理。

這個重構不會改變使用者看到的主要互動流程，而是把原本混在一起的邏輯拆成更容易演化的 seam。

## User Stories

1. As a traveler using the map experience, I want to open the settings panel without losing my current timeline context, so that I can adjust display and scene settings without interrupting my flow.
2. As a user exploring the map over time, I want the timeline control to remain focused on time selection and playback, so that I can understand the current temporal state more clearly.
3. As a user adjusting scene appearance, I want region, lighting, and terrain detail controls to be grouped by purpose, so that I can change one aspect without mentally parsing unrelated logic.
4. As a user switching between info modes, I want the panel behavior to remain consistent, so that map interactions and panel state do not feel fragmented.
5. As a future maintainer, I want the timeline and settings logic to be split by responsibility, so that I can modify one part without touching unrelated UI behaviors.
6. As a tester, I want the timeline behavior to be testable independently from the settings panel, so that regressions are easier to isolate.
7. As a tester, I want scene settings changes to be verifiable through user-visible behavior, so that the refactor does not silently break the current experience.
8. As a product owner, I want the current user-visible interactions to remain stable during the refactor, so that no existing workflow becomes harder to use.
9. As a developer, I want shared map-focus side effects to be centralized, so that multiple controls do not each implement their own focus logic.
10. As a developer, I want the extracted hooks or adapters to be small and focused, so that the architecture stays navigable and easy to reason about.
11. As a user, I want the settings drawer to open and close predictably, so that I can trust the panel layout and state transitions.
12. As a user, I want playback speed and time selection to behave consistently, so that the timeline remains intuitive.
13. As a user, I want region changes to reflect the current map focus and scene state, so that the map response feels coherent.
14. As a user, I want lighting and terrain detail controls to preserve the same options and defaults, so that the refactor does not change the visual baseline.
15. As a maintainer, I want the refactored modules to share the same store seam, so that the system remains consistent with the current architecture.

## Implementation Decisions

- The refactor will introduce two primary modules with clear responsibilities:
  - a timeline intent module responsible for time selection, playback state, and playback speed;
  - a scene control module responsible for drawer state, tabs, region controls, lighting controls, and terrain detail controls.
- The existing shell-level UI state and workspace store will remain the highest-level seam for coordination. This avoids introducing a second parallel state system.
- Any map-focus side effect that is currently triggered by multiple controls will be gathered into a shared adapter, so that focus behavior is defined in one place and reused by both modules.
- If a hook is extracted, it should encapsulate only one concern. A hook that mixes timeline intent, drawer state, and map effects should be avoided.
- The refactor must preserve the current interaction contract:
  - the settings button opens and closes the utility panel;
  - the tab selection remains shared and visible;
  - timeline playback still updates the shared time state;
  - scene controls still mutate the same scene-related state values.
- The implementation should prioritize readability and testability over premature abstraction. The seam should be simple enough that future changes can be made without reintroducing coupling.
- The refactor should be implemented in a way that allows each module to be reasoned about independently, while still remaining compatible with the existing panel shell composition.

## Testing Decisions

- Tests should focus on user-visible behavior rather than implementation details. A good test should verify that the user can open the panel, switch tabs, change time, and trigger map focus behavior without depending on internal hook structure.
- The primary modules to test are:
  - the timeline intent flow;
  - the scene control flow;
  - the shared map-focus adapter;
  - the shell-level panel composition that hosts the two modules.
- The tests should reuse the existing store-driven behavior as the main seam, rather than asserting on internal state wiring or component implementation detail.
- Prior art for this style of testing is the existing pattern of exercising UI behavior through the visible interaction flow, while validating the resulting shared state and side effects.
- Where possible, regression tests should cover:
  - opening and closing the settings drawer;
  - switching tabs while preserving the selected tab state;
  - moving the timeline and confirming the shared time value updates;
  - changing scene controls and confirming the expected state changes;
  - triggering map focus from scene-related actions.

## Out of Scope

- Redesigning the entire panel shell layout.
- Changing the underlying data model or introducing new backend APIs.
- Reworking the 3D scene system or visual rendering pipeline.
- Replacing the current store architecture with a different state-management approach.

## Further Notes

This spec is intended to improve architecture clarity without changing the product experience. The most important success criterion is that the refactor makes the codebase easier to navigate and test while keeping the current user interaction model intact.
