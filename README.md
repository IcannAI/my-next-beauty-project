# My Next Refund Project

## Datadog 部署說明

本專案提供預先設定好的 Datadog 資源設定檔，位於 `datadog/` 目錄下。您可以使用 Datadog API 將這些 JSON 設定匯入至您的帳號。

### 1. 匯入儀表板 (Dashboard)

使用以下 cURL 指令將 `dashboard.json` 匯入：

```bash
curl -X POST "https://api.datadoghq.com/api/v1/dashboard" 
-H "Accept: application/json" 
-H "Content-Type: application/json" 
-H "DD-API-KEY: ${DD_API_KEY}" 
-H "DD-APPLICATION-KEY: ${DD_APP_KEY}" 
-d @datadog/dashboard.json
```

### 2. 匯入監控告警 (Monitor)

由於 `monitor.json` 包含多個監控設定，請逐一匯入或使用腳本處理：

```bash
# 範例：匯入單一監控設定
curl -X POST "https://api.datadoghq.com/api/v1/monitor" 
-H "Accept: application/json" 
-H "Content-Type: application/json" 
-H "DD-API-KEY: ${DD_API_KEY}" 
-H "DD-APPLICATION-KEY: ${DD_APP_KEY}" 
-d '{...單一監控 JSON...}'
```

### 3. 匯入自定義小工具 (Widgets)

`widgets.json` 中的小工具可以手動複製 JSON 內容並貼上至 Datadog 儀表板編輯器的 JSON 區塊中。

---

## 關鍵指標與告警

- **無結果率 (No Result Rate)**: 當搜尋無結果比例超過 30% 時發出警報。
- **搜尋延遲 (Search Latency)**: 當 P95 延遲超過 1500ms 時發出警報。
- **熱門搜尋關鍵字**: 追蹤使用者搜尋行為，優化商品推薦。
