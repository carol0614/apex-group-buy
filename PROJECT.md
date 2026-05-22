# APEX 電子鎖團購頁 · 專案索引

> 讀這份檔案就能馬上接手修改，不需要重新問 Claude 背景。

---

## 基本資料

| 項目 | 內容 |
|---|---|
| **對外網址** | https://carol0614.github.io/apex-group-buy/ |
| **GitHub Repo** | https://github.com/carol0614/apex-group-buy（public） |
| **本機工作目錄** | `/Users/carol/Library/Mobile Documents/com~apple~CloudDocs/Claude-Code-Sync/Projects/02-GLN/GLN團購/` |
| **品牌** | APEX 頂尖電子鎖（Carol × APEX 合作團購） |
| **建立日期** | 2026-05-22 |

---

## 檔案結構

```
GLN團購/
├── index.html          ← 網頁主檔（CSS + JS 全部內聯）
├── Code.gs             ← Google Apps Script 後端原始碼（iCloud 備份）
├── DEPLOY.md           ← 部署 SOP
├── PROJECT.md          ← 本檔（專案索引）
└── assets/
    ├── ap100-main.jpg  ← AP100 產品主視覺
    ├── ap50-main.jpg   ← AP50 產品主視覺
    ├── safe.jpg        ← 「看得清楚才安全」區塊主圖
    ├── door-measurement.jpg ← 丈量說明圖
    ├── 3Ｄ掃描.jpg
    ├── apex50-2.jpg
    ├── apex 50-3.jpg
    ├── apex 50-4.jpg
    └── 他牌.jpg
```

---

## 後端設定（Google Apps Script）

| 項目 | 值 |
|---|---|
| **專案名稱** | `apex_團購表單後台` |
| **Google 帳號** | carol@goodlivingnotes.com（u/0） |
| **Web App URL** | `https://script.google.com/macros/s/AKfycbx2apG1Qa3y7-DhsC2e6GmwxDgNF--oUrYXSFyAwuNgXAwG2RviUtb85wpM3FXxqHwx/exec` |
| **Drive 主資料夾 ID** | `1__WNoszcXcpob2kXLddMHmrgBfDbgbqT`（APEX-團購-2026） |
| **Google Sheet ID** | `1hap8q1fWLwhsgFa0jfCJK1TET9iREQ15zeXZqF9Yu-M`（APEX_訂單_2026） |
| **通知 Email** | carol@goodlivingnotes.com |
| **通知頻率** | 第 1 筆 + 每 10 筆通知一次 |

### Apps Script 核心邏輯

```
客戶填表單 → 前端壓縮圖片（1600px / JPEG 0.85）
  → POST JSON to Apps Script
    → 建客戶子資料夾（日期_姓名_電話末3碼）
    → 解碼 base64 → 存 JPEG 到子資料夾
    → 寫一列到 Sheet（含資料夾連結、照片連結）
    → （可選）寄 Email 通知 Carol
    → 回傳 { success: true, orderNo: "APEX-yyyyMMdd-NNN" }
```

---

## 網頁結構（index.html）

### 各 Section 對照

| Section ID | 標題 | 說明 |
|---|---|---|
| `#hero` | Hero | 倒數計時、CTA 按鈕 |
| `#pain` | 痛點 | 4 格問題卡 |
| `#products` | 選擇型號 | AP100 / AP50 產品卡 + 比較表 |
| `#persona` | 你是哪種人 | 5 種情境 Persona |
| `#features` | 功能亮點 | 6 大功能 |
| `#safety` | 6 大安全 | 安全機制說明 |
| `#visual` | 看得清楚才安全 | `assets/safe.jpg` 圖片 |
| `#tw` | 台灣設計 | 3 大在地化功能 |
| `#faq` | 常見問題 | FAQ Accordion |
| `#compare` | 品牌比較 | 7 品牌規格對照表 |
| `#measure` | 門扇丈量 | `assets/door-measurement.jpg` |
| `#form` | 訂單表單 | 主要收單區 |
| Footer | 頁尾 | APEX LINE / 版權 |

### 表單欄位

| 欄位 | 型態 | 必填 |
|---|---|---|
| 姓名 | text | ✅ |
| 電話 | tel | ✅ |
| LINE 名稱 | text | ✅ |
| Email | email | ❌ |
| 收件地址 | text | ✅ |
| 型號選擇（AP100 / AP50） | radio | ✅ |
| 已詳閱丈量說明 | checkbox | ✅ |
| 已詳閱注意事項 | checkbox | ✅ |
| 已詳閱免責聲明 | checkbox | ✅ |
| 門扇照片 | file（多張） | ❌ |

---

## 視覺系統（APEX 品牌色）

```css
:root {
  --apex-black:       #1A1714;   /* 背景 */
  --apex-dark:        #2A2724;   /* 深色區塊背景 */
  --apex-copper:      #B27858;   /* 主色（紅古銅）*/
  --apex-copper-dark: #8A5A3F;   /* 深銅（hover）*/
  --apex-copper-light:#C8956E;   /* 淺銅（輔助）*/
  --gln-ivory:        #EEE1D1;   /* 輔助米白 */
  --paper:            #FFFFFF;
}
```

字體：`Noto Serif TC`（中）+ `Ibarra Real Nova`（英）

---

## 型號與價格

| 型號 | 優惠價 | 主要差異 |
|---|---|---|
| AP100 | NT$ 34,000 | 3D 人臉 + 掌靜脈 + 貓眼螢幕 |
| AP50 | NT$ 26,000 | 掌靜脈（無人臉辨識） |

---

## 部署流程（修改後更新網站）

```bash
cd "/Users/carol/Library/Mobile Documents/com~apple~CloudDocs/Claude-Code-Sync/Projects/02-GLN/GLN團購"

# 修改 index.html 後：
git add index.html
git commit -m "update: 說明改了什麼"
git push
# → 約 1-2 分鐘後 https://carol0614.github.io/apex-group-buy/ 自動更新
```

**新增圖片時：**
```bash
# 把圖片放進 assets/ 後：
git add assets/
git commit -m "add: 新圖片說明"
git push
```

⚠️ **assets/ 一定要獨立 git add**，否則圖片不會上傳到 GitHub Pages。

---

## 修改 Apps Script 的流程

1. 打開 https://script.google.com → 找 `apex_團購表單後台`（carol@goodlivingnotes.com）
2. 修改 Code.gs 內容
3. 儲存（Ctrl+S）
4. 右上「部署」→「管理部署作業」→ 右上 ✏️ 編輯
5. 版本選「新版本」→「部署」
6. **Web App URL 不變**，不需要更新 index.html

---

## 常見修改情境

### 改文案 / 價格
- 直接編輯 `index.html` → 搜尋關鍵字找到對應位置 → 改 → commit + push

### 換產品圖
- 把新圖放進 `assets/`，命名與舊圖相同（例：`ap100-main.jpg`）
- `git add assets/ && git commit -m "..." && git push`

### 新增區塊圖片
- 圖片放進 `assets/`
- 在 `index.html` 用 `<img src="assets/檔名.jpg">` 插入

### 調整倒數計時目標日期
- 搜尋 `countdownTarget` → 改日期字串（格式：`'2026-06-16T00:00:00'`）

### 關閉表單（團購結束後）
- 搜尋 `APPS_SCRIPT_URL` → 把值改為空字串 `''`
- 或到 Apps Script 管理部署 → 刪除部署作業

### 改 LINE 帳號
- 搜尋 `@apex100` → 全部替換為新帳號
- LINE 深連結格式：`https://line.me/R/ti/p/@帳號`（不要用 lin.ee 短連結）

---

## 歷史紀錄

| 日期 | 修改 |
|---|---|
| 2026-05-22 | 初版建立、Google Apps Script 部署、GitHub Pages 上線 |
| 2026-05-22 | LINE Modal 與 Footer 改為 APEX 官方 LINE @apex100 |
| 2026-05-22 | assets/ 補上 git、safe.jpg 替換「看得清楚才安全」文字卡 |
