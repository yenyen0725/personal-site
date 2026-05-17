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

  /* Share link */
  document.getElementById('shareLinkBtn').addEventListener('click', () => {
    const encoded = _encodeToHash(EditMode.getData());
    const url = `${window.location.origin}${window.location.pathname}#data=${encoded}`;
    navigator.clipboard.writeText(url)
      .then(() => EditMode.showToast('🔗 已複製！在新裝置貼上連結即可載入'))
      .catch(() => prompt('複製此連結：', url));
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
