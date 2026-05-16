const ProjectDetail = (() => {
  let _data  = null;
  let _projId = null;

  function init(data) { _data = data; }

  function open(projId) {
    const proj = (_data.portfolio || []).find(p => p.id === projId);
    if (!proj) return;
    _projId = projId;
    _renderHeader(proj);
    _renderContent(proj.content || []);
    document.getElementById('projectDetailOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    document.getElementById('projectDetailOverlay').classList.remove('open');
    document.body.style.overflow = '';
    _projId = null;
  }

  function _renderHeader(proj) {
    document.getElementById('detailTag').textContent   = proj.tag   || '';
    document.getElementById('detailTitle').textContent = proj.title || '';
    document.getElementById('detailDesc').textContent  = proj.description || '';
    const urlEl = document.getElementById('detailUrl');
    if (proj.url) { urlEl.href = proj.url; urlEl.style.display = ''; }
    else urlEl.style.display = 'none';

    const cover = document.getElementById('detailCover');
    if (proj.imageData) {
      cover.innerHTML = `<img src="${proj.imageData}" alt="${proj.title}">`;
      cover.style.display = '';
    } else {
      cover.innerHTML = '';
      cover.style.display = 'none';
    }
  }

  function _renderContent(blocks) {
    const container = document.getElementById('detailContent');
    container.innerHTML = '';
    blocks.forEach((block, i) => container.appendChild(_buildBlock(block, i)));
  }

  function _buildBlock(block, index) {
    const wrap = document.createElement('div');
    wrap.className = `detail-block detail-block--${block.type}`;

    if (block.type === 'text') {
      const p = document.createElement('p');
      p.className = 'detail-block__text';
      p.textContent = block.value || '';
      if (EditMode.isActive()) {
        p.contentEditable = 'true';
        p.addEventListener('blur', () => { block.value = p.innerText; Storage.save(_data); });
      }
      wrap.appendChild(p);

    } else if (block.type === 'image') {
      const img = document.createElement('img');
      img.className = 'detail-block__image';
      img.src = block.data;
      img.alt = block.caption || '';
      wrap.appendChild(img);
      if (block.caption) {
        const cap = document.createElement('p');
        cap.className = 'detail-block__caption';
        cap.textContent = block.caption;
        wrap.appendChild(cap);
      }

    } else if (block.type === 'file') {
      const a = document.createElement('a');
      a.className = 'detail-block__file';
      a.href = block.data;
      a.download = block.name;
      a.innerHTML = `<span>📎</span><span>${block.name}</span>`;
      wrap.appendChild(a);
    }

    if (EditMode.isActive()) {
      const del = document.createElement('button');
      del.className = 'detail-block__del';
      del.textContent = '✕';
      del.title = '刪除';
      del.onclick = () => _deleteBlock(index);
      wrap.appendChild(del);
    }

    return wrap;
  }

  function _deleteBlock(index) {
    const proj = _proj();
    if (!proj) return;
    proj.content = proj.content || [];
    proj.content.splice(index, 1);
    _renderContent(proj.content);
    Storage.save(_data);
  }

  function _addBlock(type) {
    const proj = _proj();
    if (!proj) return;
    proj.content = proj.content || [];

    if (type === 'text') {
      proj.content.push({ type: 'text', value: '在這裡輸入文字...' });
      _renderContent(proj.content);
      Storage.save(_data);
      setTimeout(() => {
        const all = document.querySelectorAll('.detail-block__text');
        all[all.length - 1]?.focus();
      }, 50);

    } else if (type === 'image') {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          const img = new Image();
          img.onload = () => {
            const MAX = 1400;
            let { width: w, height: h } = img;
            if (w > MAX || h > MAX) { const r = Math.min(MAX/w, MAX/h); w = Math.round(w*r); h = Math.round(h*r); }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            proj.content.push({ type: 'image', data: canvas.toDataURL('image/jpeg', 0.85), caption: '' });
            _renderContent(proj.content);
            Storage.save(_data);
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      };
      input.click();

    } else if (type === 'file') {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          proj.content.push({ type: 'file', data: ev.target.result, name: file.name });
          _renderContent(proj.content);
          Storage.save(_data);
          EditMode.showToast('📎 檔案已上傳');
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }
  }

  function _proj() {
    return (_data.portfolio || []).find(p => p.id === _projId) || null;
  }

  function setupListeners() {
    document.getElementById('projectDetailBack')?.addEventListener('click', close);

    document.getElementById('detailAddBar')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-add]');
      if (btn && EditMode.isActive()) _addBlock(btn.dataset.add);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.getElementById('projectDetailOverlay')?.classList.contains('open')) {
        close();
      }
    });
  }

  return { init, open, close, setupListeners };
})();
