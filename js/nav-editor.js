const NavEditor = (() => {
  let _data = null;
  let _clickHandler   = null;
  let _dblClickHandler = null;
  let _addBtnHandler  = null;

  const BUILTIN = ['hero', 'about', 'portfolio', 'skills', 'contact'];

  function init(data) { _data = data; }

  /* ── Render nav from sectionConfig.order ── */
  function render() {
    const container = document.getElementById('navLinksContainer');
    if (!container) return;
    container.innerHTML = '';

    const order    = _data.sectionConfig?.order     || [];
    const labels   = _data.sectionConfig?.labels    || {};
    const navColors = _data.sectionConfig?.navColors || {};

    order.forEach(id => {
      const label    = labels[id] || id;
      const color    = navColors[id] || null;
      const isCustom = !BUILTIN.includes(id);

      const wrap = document.createElement('div');
      wrap.className = 'nav__link-wrap';
      wrap.dataset.id = id;

      const a = document.createElement('a');
      a.className = 'nav__link';
      a.href = '#' + id;
      a.textContent = label;
      if (color) a.style.color = color;

      const controls = document.createElement('div');
      controls.className = 'nlc-controls';
      controls.innerHTML = `
        <button class="nlc-btn" data-action="nl-left"  title="左移">‹</button>
        <button class="nlc-btn nlc-color-btn" data-action="nl-color" title="文字顏色"
          style="background:${color || 'var(--sand-lt)'}"></button>
        ${isCustom ? '<button class="nlc-btn nlc-del" data-action="nl-del" title="刪除區塊">✕</button>' : ''}
        <button class="nlc-btn" data-action="nl-right" title="右移">›</button>`;

      wrap.appendChild(a);
      wrap.appendChild(controls);
      container.appendChild(wrap);
    });

    /* Add section button */
    const addBtn = document.createElement('button');
    addBtn.className = 'nav__add-link-btn';
    addBtn.id = 'navAddLinkBtn';
    addBtn.textContent = '＋';
    addBtn.title = '新增自訂區塊';
    container.appendChild(addBtn);

    _unbindEvents();
    _bindEvents();
    _bindNavScroll();
  }

  function _unbindEvents() {
    const container = document.getElementById('navLinksContainer');
    if (!container) return;
    if (_clickHandler)    container.removeEventListener('click',    _clickHandler);
    if (_dblClickHandler) container.removeEventListener('dblclick', _dblClickHandler);
    const addBtn = document.getElementById('navAddLinkBtn');
    if (addBtn && _addBtnHandler) addBtn.removeEventListener('click', _addBtnHandler);
    _clickHandler = _dblClickHandler = _addBtnHandler = null;
  }

  function _bindNavScroll() {
    document.querySelectorAll('.nav__link').forEach(a => {
      a.addEventListener('click', e => {
        if (EditMode.isActive()) return;
        const href = a.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  function _bindEvents() {
    const container = document.getElementById('navLinksContainer');

    _clickHandler = e => {
      if (!EditMode.isActive()) return;
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const wrap = btn.closest('.nav__link-wrap');
      if (!wrap) return;
      const id = wrap.dataset.id;

      switch (btn.dataset.action) {
        case 'nl-left':  _move(id, -1); break;
        case 'nl-right': _move(id,  1); break;
        case 'nl-del':   _delete(id);   break;
        case 'nl-color': {
          const cur = (_data.sectionConfig.navColors || {})[id] || null;
          ColorPicker.open(btn, cur, 'text', ({ color }) => {
            if (!_data.sectionConfig.navColors) _data.sectionConfig.navColors = {};
            if (color) _data.sectionConfig.navColors[id] = color;
            else delete _data.sectionConfig.navColors[id];
            Storage.save(_data);
            render();
          });
          break;
        }
      }
    };
    container.addEventListener('click', _clickHandler);

    /* Double-click nav label to rename */
    _dblClickHandler = e => {
      if (!EditMode.isActive()) return;
      const a = e.target.closest('.nav__link');
      if (!a) return;
      a.contentEditable = 'true';
      a.focus();
      a.addEventListener('blur', () => {
        a.contentEditable = 'false';
        const id = a.closest('.nav__link-wrap')?.dataset.id;
        const newLabel = a.textContent.trim();
        if (!newLabel || !id) return;
        _data.sectionConfig.labels[id] = newLabel;
        /* Sync heading for custom sections */
        const cs = (_data.customSections || []).find(c => c.id === id);
        if (cs) {
          cs.label = newLabel;
          const h = document.querySelector(`#${CSS.escape(id)} .custom-section__heading`);
          if (h) h.textContent = newLabel;
        }
        Storage.save(_data);
      }, { once: true });
      a.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); a.blur(); } });
    };
    container.addEventListener('dblclick', _dblClickHandler);

    const addBtn = document.getElementById('navAddLinkBtn');
    if (addBtn) {
      _addBtnHandler = () => _addSection();
      addBtn.addEventListener('click', _addBtnHandler);
    }
  }

  function _move(id, dir) {
    EditMode.pushHistory();
    const order = _data.sectionConfig.order;
    const idx = order.indexOf(id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= order.length) return;
    [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
    SectionControls.applyOrder();
    render();
    Storage.save(_data);
    EditMode.showToast('↕️ 區塊已移動');
  }

  function _delete(id) {
    const label = (_data.sectionConfig.labels || {})[id] || id;
    if (!confirm(`確定刪除「${label}」自訂區塊？此操作無法還原。`)) return;
    EditMode.pushHistory();
    _data.sectionConfig.order     = _data.sectionConfig.order.filter(i => i !== id);
    _data.customSections          = (_data.customSections || []).filter(c => c.id !== id);
    delete _data.sectionConfig.labels[id];
    if (_data.sectionConfig.navColors) delete _data.sectionConfig.navColors[id];
    if (_data.sectionConfig.colors)    delete _data.sectionConfig.colors[id];
    document.getElementById(id)?.remove();
    render();
    Storage.save(_data);
    EditMode.showToast('🗑️ 區塊已刪除');
  }

  function _addSection() {
    const title = prompt('請輸入新區塊的標題：', '新區塊');
    if (!title?.trim()) return;
    EditMode.pushHistory();

    const id = 'cust-' + Date.now();
    const cs = { id, label: title.trim(), eyebrow: '', body: '' };

    if (!_data.customSections) _data.customSections = [];
    _data.customSections.push(cs);
    _data.sectionConfig.order.push(id);
    if (!_data.sectionConfig.labels) _data.sectionConfig.labels = {};
    _data.sectionConfig.labels[id] = title.trim();

    /* Build DOM and append */
    const sectionEl = Renderer.buildCustomSection(cs);
    document.getElementById('sectionsContainer').appendChild(sectionEl);

    SectionControls.applyOrder();
    SectionControls.injectControls();
    render();

    if (EditMode.isActive()) {
      EditMode.makeEditable();
      EditMode.setupResizeHandles();
    }

    Storage.save(_data);
    EditMode.showToast('✅ 新區塊已建立');
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 150);
  }

  return { init, render };
})();
