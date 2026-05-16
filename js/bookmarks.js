const Bookmarks = (() => {
  let _data = null;
  let _editingId = null;

  function init(data) { _data = data; }

  function setupListeners() {
    document.getElementById('bookmarksGrid').addEventListener('click', e => {
      if (!EditMode.isActive()) return;
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      e.preventDefault();
      const card = btn.closest('.bookmark-card');
      if (!card) return;
      const id = card.dataset.id;
      if (btn.dataset.action === 'edit-bm') openModal(id);
      if (btn.dataset.action === 'delete-bm') confirmDelete(id);
    });

    document.getElementById('addBookmarkBtn').addEventListener('click', () => openModal(null));
    document.getElementById('bmModalClose').addEventListener('click', closeModal);
    document.getElementById('bmModalCancel').addEventListener('click', closeModal);
    document.getElementById('bmModalSave').addEventListener('click', saveModal);
    document.getElementById('bmModalBackdrop').addEventListener('click', e => {
      if (e.target === document.getElementById('bmModalBackdrop')) closeModal();
    });
  }

  function openModal(id) {
    _editingId = id;
    const bm = id ? _data.bookmarks.find(b => b.id === id) : null;
    document.getElementById('bmModalTitle').textContent = bm ? '編輯書籤' : '新增書籤';
    document.getElementById('bmInputEmoji').value = bm ? bm.emoji : '🔗';
    document.getElementById('bmInputTitle').value = bm ? bm.title : '';
    document.getElementById('bmInputUrl').value = bm ? (bm.url || '') : '';
    document.getElementById('bmModalBackdrop').classList.add('open');
    document.getElementById('bmInputTitle').focus();
  }

  function closeModal() {
    document.getElementById('bmModalBackdrop').classList.remove('open');
    _editingId = null;
  }

  function saveModal() {
    const title = document.getElementById('bmInputTitle').value.trim();
    if (!title) { alert('請輸入書籤名稱'); return; }
    const bm = {
      id: _editingId || ('bm-' + Date.now()),
      emoji: document.getElementById('bmInputEmoji').value.trim() || '🔗',
      title,
      url: document.getElementById('bmInputUrl').value.trim(),
    };
    if (_editingId) {
      const idx = _data.bookmarks.findIndex(b => b.id === _editingId);
      if (idx !== -1) _data.bookmarks[idx] = bm;
    } else {
      _data.bookmarks.push(bm);
    }
    Renderer.rebuildBookmark(bm);
    closeModal();
    Storage.save(_data);
    EditMode.showToast(_editingId ? '✅ 書籤已更新' : '✅ 書籤已新增');
  }

  function confirmDelete(id) {
    const bm = _data.bookmarks.find(b => b.id === id);
    if (!bm || !confirm(`確定刪除「${bm.title}」？`)) return;
    _data.bookmarks = _data.bookmarks.filter(b => b.id !== id);
    Renderer.removeBookmark(id);
    Storage.save(_data);
    EditMode.showToast('🗑️ 書籤已刪除');
  }

  return { init, setupListeners };
})();
