const CustomBlocks = (() => {
  let _data = null;
  let _editingId = null;

  const SECTION_OPTIONS = [
    { value: '',          label: '（不設定連結）' },
    { value: 'hero',      label: 'Hero 首頁' },
    { value: 'about',     label: '關於我' },
    { value: 'portfolio', label: '作品集' },
    { value: 'skills',    label: '服務' },
    { value: 'contact',   label: '聯絡我' },
  ];

  function init(data) { _data = data; }

  function setupListeners() {
    document.getElementById('customBlocksGrid').addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      e.preventDefault();
      const card = btn.closest('.cb-card');
      if (!card) return;
      if (btn.dataset.action === 'edit-cb')   openModal(card.dataset.id);
      if (btn.dataset.action === 'delete-cb') confirmDelete(card.dataset.id);
    });

    document.getElementById('addCbBtn').addEventListener('click', () => openModal(null));
    document.getElementById('cbModalClose').addEventListener('click', closeModal);
    document.getElementById('cbModalCancel').addEventListener('click', closeModal);
    document.getElementById('cbModalSave').addEventListener('click', saveModal);
    document.getElementById('cbModalBackdrop').addEventListener('click', e => {
      if (e.target === document.getElementById('cbModalBackdrop')) closeModal();
    });

    document.getElementById('cbImageInput').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          const MAX = 1000;
          let { width: w, height: h } = img;
          if (w > MAX || h > MAX) { const r = Math.min(MAX/w,MAX/h); w=Math.round(w*r); h=Math.round(h*r); }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          document.getElementById('_cbPendingImage').value = dataUrl;
          const preview = document.getElementById('cbImagePreview');
          preview.src = dataUrl; preview.style.display = 'block';
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function openModal(id) {
    _editingId = id;
    const block = id ? _data.customBlocks.find(b => b.id === id) : null;

    document.getElementById('cbModalTitle').textContent = block ? '編輯區塊' : '新增區塊';
    document.getElementById('cbHeading').value  = block?.heading  || '';
    document.getElementById('cbBody').value     = block?.body     || '';
    document.getElementById('cbLinkTo').value   = block?.linkTo   || '';
    document.getElementById('_cbPendingImage').value = block?.imageData || '';

    const preview = document.getElementById('cbImagePreview');
    if (block?.imageData) { preview.src = block.imageData; preview.style.display = 'block'; }
    else { preview.src = ''; preview.style.display = 'none'; }

    /* build linkTo options */
    const sel = document.getElementById('cbLinkTo');
    sel.innerHTML = '';
    SECTION_OPTIONS.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt.value; o.textContent = opt.label;
      if (block?.linkTo === opt.value) o.selected = true;
      sel.appendChild(o);
    });

    document.getElementById('cbModalBackdrop').classList.add('open');
    document.getElementById('cbHeading').focus();
  }

  function closeModal() {
    document.getElementById('cbModalBackdrop').classList.remove('open');
    _editingId = null;
    document.getElementById('cbImageInput').value = '';
  }

  function saveModal() {
    const heading = document.getElementById('cbHeading').value.trim();
    if (!heading) { alert('請輸入區塊標題'); return; }
    EditMode.pushHistory();
    const block = {
      id:        _editingId || ('cb-' + Date.now()),
      heading,
      body:      document.getElementById('cbBody').value.trim(),
      linkTo:    document.getElementById('cbLinkTo').value,
      imageData: document.getElementById('_cbPendingImage').value || null,
    };
    if (_editingId) {
      const idx = _data.customBlocks.findIndex(b => b.id === _editingId);
      if (idx !== -1) _data.customBlocks[idx] = block;
    } else {
      _data.customBlocks.push(block);
    }
    Renderer.rebuildCbCard(block);
    closeModal();
    Storage.save(_data);
    EditMode.showToast(_editingId ? '✅ 區塊已更新' : '✅ 區塊已新增');
  }

  function confirmDelete(id) {
    const block = _data.customBlocks.find(b => b.id === id);
    if (!block || !confirm(`確定刪除「${block.heading}」？`)) return;
    EditMode.pushHistory();
    _data.customBlocks = _data.customBlocks.filter(b => b.id !== id);
    Renderer.removeCbCard(id);
    Storage.save(_data);
    EditMode.showToast('🗑️ 區塊已刪除');
  }

  return { init, setupListeners };
})();
