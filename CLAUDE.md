# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案性質

Chrome Extension (Manifest V3)，覆蓋新分頁（`chrome_url_overrides.newtab`）。無任何 build 工具、框架或 npm — 純 Vanilla JS + CSS，直接在 Chrome 載入。

**載入方式**：`chrome://extensions/` → 開發者模式 → 載入未封裝擴充功能 → 選取 `personal-site/` 資料夾。修改檔案後在擴充功能頁按重新整理，再開新分頁即可看到效果。

> **注意**：`manifest.json` 的 `newtab` 指向 `newtab.html`，但實際主頁面已重新命名為 `黃靜妍個人網站.html`。若要讓 Chrome Extension 正常運作，需確保兩者一致。

## 架構概觀

所有模組皆為 IIFE（立即執行函式），以單例方式掛在全域。各模組依賴關係：

```
main.js
  ├── Storage      ← chrome.storage.local（localStorage fallback）
  ├── Renderer     ← 將 data 物件渲染到 DOM
  ├── NavEditor    ← 從 sectionConfig 生成導覽列
  ├── SectionControls ← 區塊排序
  ├── EditMode     ← contenteditable、圖片上傳、undo/redo
  ├── Portfolio    ← 作品卡片 CRUD + modal
  └── ProjectDetail ← 作品詳細頁（全屏 overlay，支援文字/照片/檔案區塊）
```

## 資料模型（`Storage`）

所有狀態存在單一物件 `data` 中，由 `Storage.load()` 載入、`Storage.save(data)` 寫回。關鍵結構：

```js
{
  sectionConfig: {
    order: ['hero', 'about', 'portfolio', 'skills', 'contact', 'cust-xxx'],
    labels: { hero: 'Home', 'cust-xxx': '自訂標題', ... },
    navColors: {},   // 每個 section 的導覽列文字色
    colors: {},      // 每個 section 的背景色設定
  },
  customSections: [{ id, label, eyebrow, body }],
  portfolio: [{ id, title, tag, description, url, imageData, content: [] }],
  skills: [{ icon, title, items: [] }],
  contactLinks: [{ icon, label, value, url }],
  hiddenSections: [],
  sectionPadding: { sectionId: px },
}
```

## 核心設計原則

**Nav ↔ Section 同步**：`sectionConfig.order` 是唯一真實來源。導覽列由 `NavEditor.render()` 從 order + labels 動態生成；新增自訂區塊時同時建立 DOM section 和 nav 項目；刪除、排序時兩側同步。不存在獨立的 `navLinks[]` 陣列。

**編輯模式**：`body.edit-mode` class 控制所有編輯 UI 的顯隱（CSS 驅動）。`EditMode.enter()` 對所有 `[data-field]` 元素設定 `contenteditable`，`_setNestedValue()` 解析 field key 並更新對應的 data 欄位。

**自訂 section 欄位命名**：`data-field` 值格式為 `{sectionId}-{eyebrow|heading|body}`，例如 `cust-1234567890-heading`。

**圖片處理**：上傳後用 Canvas 縮放（Hero/About 最大 900px，作品詳情最大 1400px），轉成 JPEG base64 存入 storage。

**事件委派**：`NavEditor._bindEvents()` 每次 `render()` 前先 `_unbindEvents()` 移除舊監聽器，避免重複綁定（曾因此導致刪除確認框重複彈出的 bug）。

## CSS 架構

| 檔案 | 職責 |
|---|---|
| `variables.css` | 所有 CSS custom properties（色票、字型、間距、圓角、陰影） |
| `base.css` | Reset + body 基礎樣式 |
| `layout.css` | 容器、各 section 網格佈局、RWD |
| `components.css` | 所有視覺元件樣式（nav、hero、cards、modal、detail overlay...） |
| `editmode.css` | 編輯模式專用疊加層（`.edit-mode` body class 觸發） |

全站使用 `Noto Serif TC`（含 `--font-sans` 也指向同一字型）。色票以大地色系為主：`--terracotta`（主強調）、`--sand`（邊框/分隔）、`--bg-dark`（Hero/Contact 深色背景）。
