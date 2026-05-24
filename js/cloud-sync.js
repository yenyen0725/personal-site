/**
 * CloudSync — Google Drive 雲端同步模組
 *
 * 設定方式：
 * 1. 前往 https://script.google.com 建立新專案，貼上 gas-setup.js 的程式碼
 * 2. 部署為 Web App（執行身分：我、存取：任何人）
 * 3. 將部署後的 URL 填入下方 GAS_URL
 */

const CloudSync = (() => {

  // ── 請將 Google Apps Script 部署 URL 填入這裡 ──────────────────────────
  const GAS_URL = '';   // 例：'https://script.google.com/macros/s/AKfy.../exec'
  const CLOUD_KEY = 'personal-site-yen';
  // ────────────────────────────────────────────────────────────────────────

  let _data       = null;
  let _syncTimer  = null;
  let _statusEl   = null;

  function init(data) {
    _data     = data;
    _statusEl = document.getElementById('cloudSyncStatus');

    if (!GAS_URL) {
      _setStatus('⚙️ 未設定 GAS_URL', 'idle');
      return;
    }
    _setStatus('就緒', 'idle');
    setTimeout(() => loadFromCloud(false), 900);
  }

  /* 每次 Storage.save 後呼叫，2 秒防抖後自動同步 */
  function scheduleSync() {
    if (!GAS_URL) return;
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(syncToCloud, 2000);
    _setStatus('待同步…', 'idle');
  }

  async function syncToCloud() {
    if (!GAS_URL) { EditMode.showToast('⚙️ 請先設定 GAS_URL'); return; }
    _setStatus('同步中…', 'busy');
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ key: CLOUD_KEY, settings: _data }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const t = _timeNow();
      _setStatus(`✅ ${t}`, 'ok');
    } catch (e) {
      console.warn('[CloudSync] syncToCloud failed:', e);
      _setStatus('❌ 同步失敗', 'error');
    }
  }

  async function loadFromCloud(showToast = true) {
    if (!GAS_URL) return;
    _setStatus('載入中…', 'busy');
    try {
      const res = await fetch(`${GAS_URL}?key=${encodeURIComponent(CLOUD_KEY)}`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const saved = await res.json();

      if (saved && typeof saved === 'object' && Object.keys(saved).length > 0) {
        Object.assign(_data, saved);
        if (saved.skills)         _data.skills         = JSON.parse(JSON.stringify(saved.skills));
        if (saved.portfolio)      _data.portfolio      = JSON.parse(JSON.stringify(saved.portfolio));
        if (saved.customSections) _data.customSections = JSON.parse(JSON.stringify(saved.customSections));
        if (saved.contactLinks)   _data.contactLinks   = JSON.parse(JSON.stringify(saved.contactLinks));
        if (saved.sectionConfig)  _data.sectionConfig  = JSON.parse(JSON.stringify(saved.sectionConfig));

        Renderer.render(_data);
        NavEditor.render();
        SectionControls.setup();
        if (EditMode.isActive()) {
          EditMode.makeEditable();
          EditMode.setupResizeHandles();
        }
        Storage.save(_data);

        const t = _timeNow();
        _setStatus(`✅ ${t}`, 'ok');
        if (showToast) EditMode.showToast('☁️ 已從雲端載入最新版本');
      } else {
        _setStatus('雲端無資料', 'idle');
      }
    } catch (e) {
      console.warn('[CloudSync] loadFromCloud failed:', e);
      _setStatus('無法連線', 'error');
    }
  }

  function _setStatus(msg, type) {
    if (!_statusEl) return;
    _statusEl.textContent = msg;
    _statusEl.className = 'cloud-sync-status cloud-sync-status--' + (type || 'idle');
  }

  function _timeNow() {
    return new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  }

  return { init, scheduleSync, syncToCloud, loadFromCloud };
})();
