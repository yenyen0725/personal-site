const EditMode = (() => {
  let _active = false;
  let _data = null;
  let _saveTimer = null;

  /* ── History ── */
  const _hist = { past: [], future: [] };
  let _focusSnap = null;
  let _fieldDirty = false;

  function pushHistory() {
    _hist.past.push(JSON.stringify(_data));
    _hist.future = [];
    if (_hist.past.length > 40) _hist.past.shift();
    _focusSnap = null;
  }

  function undo() {
    if (!_hist.past.length) return showToast('⚠️ 已是最初狀態');
    _hist.future.push(JSON.stringify(_data));
    _restoreState(JSON.parse(_hist.past.pop()));
    showToast('↩️ 已還原');
  }

  function redo() {
    if (!_hist.future.length) return showToast('⚠️ 沒有可重做的步驟');
    _hist.past.push(JSON.stringify(_data));
    _restoreState(JSON.parse(_hist.future.pop()));
    showToast('↪️ 已重做');
  }

  function _restoreState(saved) {
    Object.assign(_data, saved);
    _data.skills          = JSON.parse(JSON.stringify(saved.skills          || []));
    _data.portfolio       = JSON.parse(JSON.stringify(saved.portfolio       || []));
    _data.customSections  = JSON.parse(JSON.stringify(saved.customSections  || []));
    _data.contactLinks    = JSON.parse(JSON.stringify(saved.contactLinks    || []));
    _data.sectionConfig   = JSON.parse(JSON.stringify(saved.sectionConfig   || { order: [], labels: {}, navColors: {}, colors: {} }));
    Renderer.render(_data);
    NavEditor.render();
    SectionControls.setup();
    if (_active) {
      _makeFieldsEditable();
      _setupPhotoUploads();
      _showUrlInputs();
    }
    Storage.save(_data);
  }

  /* ── Init / Toggle ── */
  function init(data) { _data = data; }

  function toggle() { _active ? exit() : enter(); }

  function enter() {
    _active = true;
    _hist.past = []; _hist.future = [];
    document.body.classList.add('edit-mode');
    _makeFieldsEditable();
    _setupPhotoUploads();
    _showUrlInputs();
    _setupResizeHandles();
    showToast('✏️ 編輯模式已開啟');
  }

  function exit(discard = false) {
    if (discard) {
      if (_hist.past.length) _restoreState(JSON.parse(_hist.past[0]));
    }
    _active = false;
    document.body.classList.remove('edit-mode');
    document.querySelectorAll('[data-field]:not([data-type="image"])').forEach(el => {
      el.removeAttribute('contenteditable');
      el._editBound = false; // allow re-binding on next enter
    });
    _hideUrlInputs();
    if (!discard) _autoSave(true);
    _hist.past = []; _hist.future = [];
  }

  function isActive() { return _active; }

  /* ── Make fields editable ── */
  function _makeFieldsEditable() {
    document.querySelectorAll('[data-field]:not([data-type="image"])').forEach(el => {
      el.setAttribute('contenteditable', 'true');
      if (!el._editBound) {
        el.addEventListener('keydown', _handleKeydown);
        el.addEventListener('paste', _handlePaste);
        el.addEventListener('input', _onInput);
        el.addEventListener('focus', _onFocus);
        el.addEventListener('blur', _onBlur);
        el._editBound = true;
      }
    });
  }

  function _handleKeydown(e) {
    if (this.dataset.multiline) return;
    if (e.key === 'Enter') { e.preventDefault(); this.blur(); }
  }
  function _handlePaste(e) {
    e.preventDefault();
    document.execCommand('insertText', false,
      (e.clipboardData || window.clipboardData).getData('text/plain'));
  }
  function _onFocus() {
    if (!_focusSnap) _focusSnap = JSON.stringify(_data);
    _fieldDirty = false;
  }
  function _onInput() {
    _fieldDirty = true;
    const key = this.dataset.field;
    const val = this.dataset.multiline ? this.innerText : this.textContent.replace(/\n/g, '');
    _setNestedValue(key, val);
    _autoSave();
  }
  function _onBlur() {
    if (_fieldDirty && _focusSnap) {
      _hist.past.push(_focusSnap);
      _hist.future = [];
      if (_hist.past.length > 40) _hist.past.shift();
    }
    _focusSnap = null;
    _fieldDirty = false;
  }

  function _setNestedValue(key, val) {
    /* Custom section fields: "{cs.id}-{eyebrow|heading|body}" */
    const csm = key.match(/^(cust-\d+)-(eyebrow|heading|body)$/);
    if (csm) {
      const cs = (_data.customSections || []).find(c => c.id === csm[1]);
      if (cs) {
        const field = csm[2];
        if (field === 'heading') {
          cs.label = val;
          if (!_data.sectionConfig.labels) _data.sectionConfig.labels = {};
          _data.sectionConfig.labels[csm[1]] = val;
          NavEditor.render();
        } else {
          cs[field] = val;
        }
      }
      return;
    }
    const sm = key.match(/^skill-(\d+)-(icon|title|item-(\d+))$/);
    if (sm) {
      const si = +sm[1];
      if (!_data.skills?.[si]) return;
      if (sm[2] === 'icon') _data.skills[si].icon = val;
      else if (sm[2] === 'title') _data.skills[si].title = val;
      else _data.skills[si].items[+sm[3]] = val;
      return;
    }
    const lm = key.match(/^contactLink-(\d+)-(icon|label|value)$/);
    if (lm) { if (_data.contactLinks?.[+lm[1]]) _data.contactLinks[+lm[1]][lm[2]] = val; return; }
    if (key in _data) _data[key] = val;
  }

  /* ── Image uploads ── */
  function _setupPhotoUploads() {
    document.querySelectorAll('[data-field][data-type="image"]').forEach(el => {
      let overlay = el.querySelector('.img-upload-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'img-upload-overlay';
        overlay.innerHTML = `<span class="upload-icon">📷</span><span>點擊上傳照片</span><input type="file" accept="image/*">`;
        el.style.position = 'relative';
        el.appendChild(overlay);
      }
      const fileInput = overlay.querySelector('input[type=file]');
      fileInput.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        pushHistory();
        _processImage(file, el.dataset.field, el);
        fileInput.value = '';
      };
    });
  }

  function _processImage(file, field, targetEl) {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const MAX = 900;
        let { width: w, height: h } = img;
        if (w > MAX || h > MAX) { const r = Math.min(MAX/w, MAX/h); w=Math.round(w*r); h=Math.round(h*r); }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        _data[field] = dataUrl;
        let displayed = targetEl.querySelector('img.uploaded-photo');
        if (!displayed) {
          displayed = document.createElement('img');
          displayed.className = 'uploaded-photo';
          displayed.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;z-index:1;pointer-events:none;';
          targetEl.insertBefore(displayed, targetEl.firstChild);
        }
        displayed.src = dataUrl;
        targetEl.querySelectorAll('svg').forEach(s => s.style.display = 'none');
        _autoSave(true);
        showToast('🖼️ 照片已更新');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ── Contact URL inputs ── */
  function _showUrlInputs() {
    document.querySelectorAll('.contact-link-url-input').forEach(inp => {
      inp.style.display = 'block';
      inp.onchange = () => {
        const i = +inp.dataset.linkUrl;
        if (_data.contactLinks?.[i]) { _data.contactLinks[i].url = inp.value.trim(); _autoSave(); }
      };
    });
  }
  function _hideUrlInputs() {
    document.querySelectorAll('.contact-link-url-input').forEach(inp => inp.style.display = 'none');
  }

  /* ── Section resize ── */
  function _setupResizeHandles() {
    document.querySelectorAll('.section-resize-handle').forEach(handle => {
      if (handle._resizeBound) return;
      handle._resizeBound = true;
      handle.addEventListener('mousedown', e => {
        e.preventDefault();
        const section = handle.closest('section');
        if (!section) return;
        const startY = e.clientY;
        const startPB = parseInt(window.getComputedStyle(section).paddingBottom) || 96;
        const onMove = ev => {
          const newPB = Math.max(24, startPB + (ev.clientY - startY));
          section.style.paddingBottom = newPB + 'px';
          _data.sectionPadding = _data.sectionPadding || {};
          _data.sectionPadding[section.id] = newPB;
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          pushHistory();
          _autoSave(true);
          showToast('↕️ 區塊高度已儲存');
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  /* ── Auto-save ── */
  function _autoSave(immediate = false) {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(async () => {
      await Storage.save(_data);
      if (!immediate) showToast('💾 已自動儲存');
    }, immediate ? 0 : 1500);
  }

  /* ── Toast ── */
  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  return {
    init, toggle, enter, exit, isActive, showToast, pushHistory, undo, redo,
    getData: () => _data,
    makeEditable:      _makeFieldsEditable,
    setupPhotoUploads: _setupPhotoUploads,
    setupResizeHandles: _setupResizeHandles,
  };
})();
