const Portfolio = (() => {
  let _data = null;
  let _editingId = null;

  function init(data) { _data = data; }

  function setupListeners() {
    /* Project card buttons */
    document.getElementById('portfolioGrid').addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const card = btn.closest('.project-card');
      if (!card) return;
      if (btn.dataset.action === 'edit')   openModal(card.dataset.id);
      if (btn.dataset.action === 'delete') confirmDelete(card.dataset.id);
      if (btn.dataset.action === 'enter')  ProjectDetail.open(card.dataset.id);
    });

    /* Filter tabs — click to filter, double-click to rename (edit mode) */
    document.getElementById('portfolioFilters').addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _applyFilter(btn.dataset.filter);
    });

    /* Inline rename of category buttons in edit mode */
    document.getElementById('portfolioFilters').addEventListener('dblclick', e => {
      const btn = e.target.closest('.filter-btn[data-editable]');
      if (!btn || !EditMode.isActive()) return;
      _startRenameTag(btn);
    });

    document.getElementById('addProjectBtn').addEventListener('click', () => openModal(null));
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    document.getElementById('modalSave').addEventListener('click', saveModal);
    document.getElementById('modalBackdrop').addEventListener('click', e => {
      if (e.target === document.getElementById('modalBackdrop')) closeModal();
    });

    document.getElementById('modalImageInput').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          const MAX = 800;
          let { width: w, height: h } = img;
          if (w > MAX || h > MAX) { const r = Math.min(MAX/w,MAX/h); w=Math.round(w*r); h=Math.round(h*r); }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          document.getElementById('_pendingImageData').value = dataUrl;
          const preview = document.getElementById('modalImagePreview');
          preview.src = dataUrl; preview.style.display = 'block';
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ── Inline tag rename ── */
  function _startRenameTag(btn) {
    const oldTag = btn.dataset.filter;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = oldTag;
    input.style.cssText = `
      width:${Math.max(80, btn.offsetWidth + 40)}px;
      padding:4px 12px;font-size:0.8125rem;font-weight:600;
      border:2px solid var(--terracotta);border-radius:999px;
      background:#fff;color:var(--terracotta);outline:none;`;
    btn.replaceWith(input);
    input.focus(); input.select();

    function commit() {
      const newTag = input.value.trim();
      if (newTag && newTag !== oldTag) {
        EditMode.pushHistory();
        _data.portfolio.forEach(p => { if (p.tag === oldTag) p.tag = newTag; });
        Storage.save(_data);
        Renderer.refreshFilterTabs();
        /* re-setup rename listener after re-render */
        EditMode.showToast(`✅ 分類「${oldTag}」已改名為「${newTag}」`);
      } else {
        Renderer.refreshFilterTabs();
      }
    }

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { input.value = oldTag; input.blur(); }
    });
  }

  /* ── Modal ── */
  function openModal(id) {
    _editingId = id;
    const proj = id ? _data.portfolio.find(p => p.id === id) : null;
    document.getElementById('modalTitle').textContent = proj ? '編輯作品' : '新增作品';
    document.getElementById('modalProjTitle').value = proj?.title || '';
    document.getElementById('modalProjTag').value   = proj?.tag   || '';
    document.getElementById('modalProjDesc').value  = proj?.description || '';
    document.getElementById('modalProjUrl').value   = proj?.url   || '';
    document.getElementById('_pendingImageData').value = proj?.imageData || '';
    const preview = document.getElementById('modalImagePreview');
    if (proj?.imageData) { preview.src = proj.imageData; preview.style.display = 'block'; }
    else { preview.src = ''; preview.style.display = 'none'; }
    document.getElementById('modalBackdrop').classList.add('open');
    document.getElementById('modalProjTitle').focus();
  }

  function closeModal() {
    document.getElementById('modalBackdrop').classList.remove('open');
    _editingId = null;
    document.getElementById('modalImageInput').value = '';
  }

  function saveModal() {
    const title = document.getElementById('modalProjTitle').value.trim();
    if (!title) { alert('請輸入作品名稱'); return; }
    EditMode.pushHistory();
    const existing = _editingId ? _data.portfolio.find(p => p.id === _editingId) : null;
    const proj = {
      id: _editingId || ('proj-' + Date.now()),
      title,
      tag:         document.getElementById('modalProjTag').value.trim()  || '作品',
      description: document.getElementById('modalProjDesc').value.trim(),
      url:         document.getElementById('modalProjUrl').value.trim(),
      imageData:   document.getElementById('_pendingImageData').value    || null,
      content:     existing?.content || [],
    };
    if (_editingId) {
      const idx = _data.portfolio.findIndex(p => p.id === _editingId);
      if (idx !== -1) _data.portfolio[idx] = proj;
    } else {
      _data.portfolio.push(proj);
    }
    Renderer.rebuildCard(proj);
    Renderer.refreshFilterTabs();
    closeModal();
    Storage.save(_data);
    EditMode.showToast(_editingId ? '✅ 作品已更新' : '✅ 作品已新增');
  }

  function confirmDelete(id) {
    const proj = _data.portfolio.find(p => p.id === id);
    if (!proj || !confirm(`確定要刪除「${proj.title}」嗎？`)) return;
    EditMode.pushHistory();
    _data.portfolio = _data.portfolio.filter(p => p.id !== id);
    Renderer.removeCard(id);
    Renderer.refreshFilterTabs();
    Storage.save(_data);
    EditMode.showToast('🗑️ 作品已刪除');
  }

  function _applyFilter(tag) {
    document.querySelectorAll('#portfolioGrid .project-card').forEach(card => {
      card.style.display = (tag === '全部' || card.dataset.tag === tag) ? '' : 'none';
    });
  }

  return { init, setupListeners, openModal };
})();
