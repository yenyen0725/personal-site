/**
 * ════════════════════════════════════════════════
 *  Google Apps Script — 個人網站雲端同步後端
 * ════════════════════════════════════════════════
 *
 * 設定步驟：
 *  1. 前往 https://script.google.com → 新增專案
 *  2. 刪除預設內容，貼上此檔案全部程式碼
 *  3. 儲存（Ctrl+S）
 *  4. 點選「部署」→「新增部署作業」
 *     - 類型：Web 應用程式
 *     - 執行身分：我（你的 Google 帳戶）
 *     - 誰可以存取：任何人
 *  5. 授權並複製「Web 應用程式 URL」
 *  6. 將該 URL 貼到 js/cloud-sync.js 的 GAS_URL 變數
 *
 * Google Drive 會自動在根目錄建立「個人網站更新」資料夾，
 * 並在裡面存放 personal-site-yen.json 設定檔。
 */

const FOLDER_NAME = '個人網站更新';

function getOrCreateFolder() {
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(FOLDER_NAME);
}

function doGet(e) {
  const key = sanitizeKey(e.parameter.key || 'default');
  const folder = getOrCreateFolder();
  const files = folder.getFilesByName(key + '.json');

  if (files.hasNext()) {
    return ContentService
      .createTextOutput(files.next().getBlob().getDataAsString())
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService
    .createTextOutput('{}')
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const key     = sanitizeKey(payload.key || 'default');
  const content = JSON.stringify(payload.settings, null, 2);
  const folder  = getOrCreateFolder();
  const files   = folder.getFilesByName(key + '.json');

  if (files.hasNext()) {
    files.next().setContent(content);
  } else {
    folder.createFile(key + '.json', content, MimeType.PLAIN_TEXT);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sanitizeKey(k) {
  return String(k).replace(/[^a-zA-Z0-9一-鿿_-]/g, '').substring(0, 80);
}
