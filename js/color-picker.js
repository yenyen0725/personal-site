/* Singleton floating color picker used by nav-editor and section-controls */
const ColorPicker = (() => {
  const BG_PRESETS = [
    { label: '重設',  value: null },
    { label: '羊皮紙', value: '#F5F0E8' },
    { label: '暖米色', value: '#EDE5D8' },
    { label: '深咖啡', value: '#3D2B1F' },
    { label: '赭土橘', value: '#C0714F' },
    { label: '鼠尾草', value: '#7A9E7E' },
    { label: '沙金黃', value: '#C9A96E' },
    { label: '石墨灰', value: '#3C3C3C' },
    { label: '象牙白', value: '#FAF6EF' },
  ];

  const TEXT_PRESETS = [
    { label: '重設',  value: null },
    { label: '深褐',  value: '#6B4F37' },
    { label: '赭土',  value: '#C0714F' },
    { label: '鼠尾',  value: '#7A9E7E' },
    { label: '沙金',  value: '#C9A96E' },
    { label: '深色',  value: '#2C1A0E' },
    { label: '白色',  value: '#FFFFFF' },
    { label: '淺褐',  value: '#E8D5B7' },
  ];

  let _popup = null;
  let _callback = null;
  let _mode = 'bg'; // 'bg' | 'text'

  function _build() {
    if (_popup) return;
    _popup = document.createElement('div');
    _popup.id = 'colorPickerPopup';
    _popup.innerHTML = `
      <div class="cpp-header">
        <span class="cpp-title">選擇顏色</span>
        <button class="cpp-close">✕</button>
      </div>
      <div class="cpp-swatches" id="cppSwatches"></div>
      <div class="cpp-custom-row">
        <label class="cpp-custom-label">
          <span>自訂</span>
          <input type="color" id="cppCustomInput" value="#C0714F">
        </label>
        <button class="cpp-apply-custom" id="cppApplyCustom">套用</button>
      </div>
      <label class="cpp-light-toggle" id="cppLightToggleWrap">
        <input type="checkbox" id="cppLightText">
        <span>淺色文字（深色背景用）</span>
      </label>`;
    document.body.appendChild(_popup);

    _popup.querySelector('.cpp-close').addEventListener('click', close);
    document.getElementById('cppApplyCustom').addEventListener('click', () => {
      const color = document.getElementById('cppCustomInput').value;
      const lightText = document.getElementById('cppLightText').checked;
      _callback({ color, lightText });
      close();
    });

    document.addEventListener('mousedown', e => {
      if (_popup && !_popup.contains(e.target) && !e.target.closest('.sc-color-btn, .nlc-color-btn')) close();
    });
  }

  function open(anchorEl, currentColor, mode, callback) {
    _build();
    _mode = mode;
    _callback = callback;
    const presets = mode === 'text' ? TEXT_PRESETS : BG_PRESETS;

    /* Build swatches */
    const container = document.getElementById('cppSwatches');
    container.innerHTML = '';
    presets.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'cpp-swatch' + (!p.value ? ' cpp-swatch--reset' : '');
      btn.title = p.label;
      btn.style.background = p.value || 'transparent';
      if (!p.value) btn.textContent = '↺';
      if (p.value === currentColor) btn.classList.add('active');
      btn.addEventListener('click', () => {
        const lightText = document.getElementById('cppLightText').checked;
        _callback({ color: p.value, lightText });
        close();
      });
      container.appendChild(btn);
    });

    /* Toggle row visibility */
    const lightWrap = document.getElementById('cppLightToggleWrap');
    lightWrap.style.display = mode === 'bg' ? 'flex' : 'none';

    /* Set current color on custom input */
    if (currentColor) document.getElementById('cppCustomInput').value = currentColor;

    /* Position popup */
    _popup.style.display = 'block';
    const rect = anchorEl.getBoundingClientRect();
    let top = rect.bottom + 8;
    let left = rect.left;
    if (left + 240 > window.innerWidth) left = window.innerWidth - 248;
    if (top + 220 > window.innerHeight) top = rect.top - 220;
    _popup.style.top  = top  + 'px';
    _popup.style.left = left + 'px';
  }

  function close() {
    if (_popup) _popup.style.display = 'none';
  }

  return { open, close };
})();
