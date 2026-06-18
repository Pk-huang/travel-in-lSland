# API 文件索引

**更新日期：** 2026-06-18

此資料夾用來集中管理 API 研究與驗證文件。

## 文件清單

| 文件 | 用途 |
|---|---|
| [vedur-weather-api.md](vedur-weather-api.md) | Vedur 天氣 API、測站、觀測與預警相關端點整理 |
| [aurora-api.md](aurora-api.md) | 極光資料來源與測試 URL 整理 |
| [iceland-traffic-api.md](iceland-traffic-api.md) | 冰島交通與路況資料來源研究 |
| [postman-quickstart.md](postman-quickstart.md) | Postman 快速測試步驟與建議 headers |
| [api-source-verification-log.md](api-source-verification-log.md) | AI 協作 API 來源確認流程與證據紀錄 |

## 建議閱讀順序

1. [vedur-weather-api.md](vedur-weather-api.md)
2. [aurora-api.md](aurora-api.md)
3. [iceland-traffic-api.md](iceland-traffic-api.md)
4. [postman-quickstart.md](postman-quickstart.md)
5. [api-source-verification-log.md](api-source-verification-log.md)

## 共同慣例

- 使用 `Accept: application/json`
- Vedur 可選擇帶上 `X-Vi-Api-Version: 2026-02-17`
- JSON 範例保持精簡，聚焦 MVP 會用到的欄位
- 公開網頁預設視為參考來源，除非有官方 API 文件證明
