function _encodeToHash(data) {
  const json = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(json)));
}

function _decodeFromHash() {
  const hash = window.location.hash;
  if (!hash.startsWith('#data=')) return null;
  try {
    const json = decodeURIComponent(escape(atob(hash.slice(6))));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  let data = await Storage.load();
  const urlData = _decodeFromHash();
  if (urlData) {
    data = urlData;
    await Storage.save(data);
    history.replaceState(null, '', window.location.pathname);
  }

  Renderer.render(data);
  NavEditor.init(data);
  NavEditor.render();
  SectionControls.init(data);
  SectionControls.setup();
  EditMode.init(data);
  Portfolio.init(data);
  Portfolio.setupListeners();
  ProjectDetail.init(data);
  ProjectDetail.setupListeners();

  if (urlData) EditMode.showToast('✅ 已載入你的專屬內容');

  /* Edit mode toggle */
  const editBtn = document.getElementById('editToggleBtn');
  editBtn.addEventListener('click', () => {
    EditMode.toggle();
    editBtn.textContent = EditMode.isActive() ? '✅ 完成編輯' : '✏️ 編輯模式';
  });

  /* Discard */
  document.getElementById('discardBtn').addEventListener('click', () => {
    if (confirm('確定放棄所有變更嗎？')) {
      EditMode.exit(true);
      editBtn.textContent = '✏️ 編輯模式';
    }
  });

  /* Export settings */
  document.getElementById('exportBtn').addEventListener('click', () => {
    const json = JSON.stringify(EditMode.getData(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'personal-site-settings.json';
    a.click();
    URL.revokeObjectURL(a.href);
    EditMode.showToast('📥 設定已匯出！');
  });

  /* Import settings */
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });
  document.getElementById('importFileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      await Storage.save(imported);
      location.reload();
    } catch {
      EditMode.showToast('⚠️ 設定檔格式錯誤');
    }
    e.target.value = '';
  });

  /* Undo / Redo buttons */
  document.getElementById('undoBtn').addEventListener('click', () => EditMode.undo());
  document.getElementById('redoBtn').addEventListener('click', () => EditMode.redo());

  /* Keyboard: Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z */
  document.addEventListener('keydown', e => {
    if (!EditMode.isActive()) return;
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); EditMode.undo(); }
    if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); EditMode.redo(); }
    if (e.key === 'Escape') { EditMode.exit(); editBtn.textContent = '✏️ 編輯模式'; }
  });

  /* Footer year */
  document.getElementById('footerYear').textContent = new Date().getFullYear();
});
