# GUNGDAI 團購頁部署備忘

- 網頁：https://carol0614.github.io/apex-group-buy/gungdai/
- Apps Script 專案：GUNGDAI 團購表單後端（carol@goodlivingnotes.com）
  - 編輯：https://script.google.com/d/1v3_qiGQ4B1W_yWDQkXZOzPkl9OxdmcAXsQtiQfDfnQIP97vAvzsDZQWl/edit
  - Web App /exec 已填入 index.html 的 APPS_SCRIPT_URL
- Drive 資料夾 `GUNGDAI-團購-2026` 與 Sheet `GUNGDAI_訂單_2026` 由後端第一次執行時自動建立
- 改 Code.gs 後：在 Apps Script 編輯器貼上 → 部署 → 管理部署作業 → 編輯 v1 → 新版本（網址不變）
- 每 2 天訂單整理信：在編輯器執行一次 `setupDigestTrigger`
