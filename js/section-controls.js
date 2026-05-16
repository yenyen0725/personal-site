const SectionControls = (() => {
  let _data = null;

  const SECTION_ORDER_DEFAULT = ['hero', 'about', 'portfolio', 'skills', 'contact'];

  function init(data) { _data = data; }

  function setup() {
    _applyOrder();
    _applyColors();
    _injectControls();
  }

  /* Public so NavEditor can call after adding a section */
  function applyOrder()    { _applyOrder(); }
  function injectControls() { _injectControls(); }

  /* ── Order ── */
  function _applyOrder() {
    const order = _data.sectionConfig?.order || SECTION_ORDER_DEFAULT;
    const container = document.getElementById('sectionsContainer');
    if (!container) return;
    order.forEach(id => {
      const el = document.getElementById(id);
      if (el) container.appendChild(el);
    });
  }

  /* ── Colors ── */
  function _applyColors() {
    const colors = _data.sectionConfig?.colors || {};
    Object.entries(colors).forEach(([id, cfg]) => {
      if (!cfg) return;
      const el = document.getElementById(id);
      if (!el) return;
      if (cfg.bg) el.style.backgroundColor = cfg.bg;
      el.classList.toggle('section-dark-theme', !!cfg.lightText);
    });
  }

  /* ── Inject controls ── */
  function _injectControls() {
    const order = _data.sectionConfig?.order || SECTION_ORDER_DEFAULT;
    order.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.querySelector('.section-controls')) return;

      const ctrl = document.createElement('div');
      ctrl.className = 'section-controls';
      ctrl.dataset.sectionId = id;
      ctrl.innerHTML = `
        <button class="sc-btn" data-action="sc-up"    title="上移區塊">↑</button>
        <button class="sc-btn" data-action="sc-down"  title="下移區塊">↓</button>
        <button class="sc-btn sc-color-btn" data-action="sc-color" title="背景顏色">🎨</button>`;
      el.appendChild(ctrl);

      ctrl.querySelector('[data-action=sc-up]').addEventListener('click',   () => _move(id, -1));
      ctrl.querySelector('[data-action=sc-down]').addEventListener('click', () => _move(id,  1));
      ctrl.querySelector('[data-action=sc-color]').addEventListener('click', e => {
        const cfg = (_data.sectionConfig.colors || {})[id] || {};
        ColorPicker.open(e.currentTarget, cfg.bg, 'bg', ({ color, lightText }) => {
          _setColor(id, color, lightText);
        });
      });
    });
  }

  function _move(id, dir) {
    EditMode.pushHistory();
    const order = _data.sectionConfig.order;
    const idx = order.indexOf(id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= order.length) return;
    [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
    _applyOrder();
    NavEditor.render();       /* keep nav in sync */
    Storage.save(_data);
    EditMode.showToast('↕️ 區塊已移動');
    _injectControls();
  }

  function _setColor(id, color, lightText) {
    if (!_data.sectionConfig.colors) _data.sectionConfig.colors = {};
    if (!color) {
      delete _data.sectionConfig.colors[id];
      const el = document.getElementById(id);
      if (el) { el.style.backgroundColor = ''; el.classList.remove('section-dark-theme'); }
    } else {
      _data.sectionConfig.colors[id] = { bg: color, lightText: !!lightText };
      const el = document.getElementById(id);
      if (el) {
        el.style.backgroundColor = color;
        el.classList.toggle('section-dark-theme', !!lightText);
      }
    }
    Storage.save(_data);
    EditMode.showToast('🎨 背景顏色已套用');
  }

  return { init, setup, applyOrder, injectControls };
})();
