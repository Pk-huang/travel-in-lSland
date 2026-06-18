# Iceland Insight 文件導覽

這份索引用來快速理解每份文件用途，所有文件皆保留、不刪除。

## 目前文件

- [PROJECT_SPEC_AND_PLAN.md](PROJECT_SPEC_AND_PLAN.md)
  - 角色：主規格與分階段計畫（權威版本）
  - 適用：需求對齊、里程碑管理、驗收範圍確認

- [IMPLEMENTATION_PROGRESS_LOG.md](IMPLEMENTATION_PROGRESS_LOG.md)
  - 角色：進度與決策紀錄（每日更新）
  - 適用：追蹤每個 Phase 項目狀態、阻塞、驗收結果

- [FEATURE_SPEC_TEMPLATE.md](FEATURE_SPEC_TEMPLATE.md)
  - 角色：功能需求模板（按鈕/元件/功能統一寫法）
  - 適用：新功能規劃、PR 前驗收清單

- [ENGINEERING_EXAMPLE.md](ENGINEERING_EXAMPLE.md)
  - 角色：AI 功能導入工程示例（參考實作）
  - 適用：開發時複用流程與程式架構

## 建議維護節奏

1. 需求變更：先改 [PROJECT_SPEC_AND_PLAN.md](PROJECT_SPEC_AND_PLAN.md)
2. 任務啟動：在 [IMPLEMENTATION_PROGRESS_LOG.md](IMPLEMENTATION_PROGRESS_LOG.md) 將狀態改為 `doing`
3. 開發過程：若有新按鈕/元件，先用 [FEATURE_SPEC_TEMPLATE.md](FEATURE_SPEC_TEMPLATE.md) 建一份規格
4. 完成驗收：回填 [IMPLEMENTATION_PROGRESS_LOG.md](IMPLEMENTATION_PROGRESS_LOG.md) 的驗收結果與決策原因
# 專案倉庫：travel-in-lSland
