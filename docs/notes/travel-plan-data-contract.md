# 旅行計劃資料契約（Demo v1）

更新日期：2026-07-23

## 目的

- 以靜態 JSON 承接完整旅行計劃內容，先完成 CRUD 與 UI 顯示基礎。
- 讓同一份資料可同時服務面板 UI 與後續地圖整合。

## 目前採用的欄位設計

- `TravelPlanCollection`
	- `generatedAt`
	- `plans[]`
- `TravelPlan`
	- `planId`
	- `title`
	- `startDate` / `endDate`
	- `status`
	- `days[]`
	- `memoLinks[]`
	- `supplies[]`
	- `reminders[]`
	- `updatedAt`
- `TravelPlanDay`
	- `dateDisplay`：支援左側日期欄顯示
	- `regionLabel`：對應左欄地區摘要
	- `title`：主標題
	- `driveText`：原始里程/到達資訊字串
	- `distanceKm`：可排序/統計的數值欄位
	- `mapRouteUrl`：Google Maps 路線
	- `timelineSections[]`：UI 直接渲染的主資料
	- `camp`：露營/住宿資訊
	- `stops[]`：給地圖層使用的點位摘要

## 本次決議

- `spotTags` 不建立，避免重複資料來源。
- UI 先直接以 `timelineSections` 當唯一主要內容來源。
- `stops[]` 允許缺少座標，方便先上內容、後補地圖對位。

## 後續擴充方向

- 將 `timelineSections.items[].poiId` 逐步對齊既有 POI catalog。
- 補上更多 stop 的經緯度，讓地圖可完整飛點。
- CRUD 完成後，再加 `selectedDayId` / `selectedItemId` 的互動狀態。