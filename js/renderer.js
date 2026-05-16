const Renderer = (() => {
  let _data = null;

  function render(data) {
    _data = data;
    _renderFields();
    _renderSkills();
    _renderPortfolio();
    _renderContactLinks();
    _renderCustomSections();
    _applyImages();
    _applySectionPadding();
  }

  function _renderFields() {
    document.querySelectorAll('[data-field]:not([data-type])').forEach(el => {
      const v = _data[el.dataset.field];
      if (v !== undefined) el.textContent = v;
    });
  }

  function _applyImages() {
    document.querySelectorAll('[data-field][data-type="image"]').forEach(el => {
      const src = _data[el.dataset.field];
      if (!src) return;
      let img = el.querySelector('img.uploaded-photo');
      if (!img) {
        img = document.createElement('img');
        img.className = 'uploaded-photo';
        img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;z-index:1;pointer-events:none;';
        el.insertBefore(img, el.firstChild);
      }
      img.src = src;
      el.querySelectorAll('svg').forEach(s => s.style.display = 'none');
    });
  }

  function _renderSkills() {
    const grid = document.getElementById('skillsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    (_data.skills || []).forEach((skill, si) => {
      const card = document.createElement('div');
      card.className = 'skill-card';
      card.innerHTML = `
        <div class="skill-card__icon" data-field="skill-${si}-icon">${skill.icon}</div>
        <h3 class="skill-card__title" data-field="skill-${si}-title">${skill.title}</h3>
        <ul class="skill-card__list">
          ${skill.items.map((item, ii) =>
            `<li class="skill-item"><span data-field="skill-${si}-item-${ii}">${item}</span></li>`
          ).join('')}
        </ul>`;
      grid.appendChild(card);
    });
  }

  function _renderPortfolio() {
    const grid = document.getElementById('portfolioGrid');
    if (!grid) return;
    grid.querySelectorAll('.project-card').forEach(c => c.remove());
    const addCard = grid.querySelector('.add-project-card');
    (_data.portfolio || []).forEach(proj => grid.insertBefore(_buildProjectCard(proj), addCard));
    _renderFilterTabs();
  }

  function _buildProjectCard(proj) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.id = proj.id;
    card.dataset.tag = proj.tag || '';
    const placeholder = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#EDE5D8"/>
      <rect x="60" y="60" width="480" height="280" rx="8" fill="#D4C4A8" opacity="0.5"/>
      <rect x="100" y="100" width="160" height="120" rx="6" fill="#C9A96E" opacity="0.4"/>
    </svg>`;
    card.innerHTML = `
      <div class="card-edit-controls">
        <button class="card-btn card-btn--edit" data-action="edit" title="編輯">✏️</button>
        <button class="card-btn card-btn--delete" data-action="delete" title="刪除">🗑️</button>
      </div>
      <div class="project-card__img">
        ${proj.imageData ? `<img src="${proj.imageData}" alt="${proj.title}">` : placeholder}
      </div>
      <button class="project-card__enter" data-action="enter">進入 →</button>
      <div class="project-card__body">
        <span class="project-card__tag">${proj.tag || '作品'}</span>
        <h3 class="project-card__title">${proj.title}</h3>
        <p class="project-card__desc">${proj.description}</p>
        ${proj.url ? `<a href="${proj.url}" target="_blank" rel="noopener" class="project-card__link">外部連結 ↗</a>` : ''}
      </div>`;
    return card;
  }

  function _renderFilterTabs() {
    const container = document.getElementById('portfolioFilters');
    if (!container) return;
    const active = container.querySelector('.filter-btn.active')?.dataset.filter || '全部';
    container.innerHTML = '';
    const tags = ['全部', ...new Set((_data.portfolio || []).map(p => p.tag).filter(Boolean))];
    tags.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn' + (tag === active || (tag === '全部' && active === '全部') ? ' active' : '');
      btn.textContent = tag;
      btn.dataset.filter = tag;
      if (tag !== '全部') btn.dataset.editable = 'true';
      container.appendChild(btn);
    });
  }

  function _renderContactLinks() {
    const container = document.getElementById('contactLinks');
    if (!container) return;
    container.innerHTML = '';
    (_data.contactLinks || []).forEach((link, i) => {
      const el = document.createElement('div');
      el.className = 'contact__link';
      const valueHtml = link.url
        ? `<a class="contact__link-value" href="${link.url}" target="_blank" rel="noopener"
             data-field="contactLink-${i}-value">${link.value}</a>`
        : `<div class="contact__link-value" data-field="contactLink-${i}-value">${link.value}</div>`;
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="contact__link-icon" data-field="contactLink-${i}-icon">${link.icon}</div>
          <div>
            <div class="contact__link-label" data-field="contactLink-${i}-label">${link.label}</div>
            ${valueHtml}
          </div>
        </div>
        <input class="contact-link-url-input" type="url" placeholder="連結 URL（如 https://...）"
          value="${link.url || ''}" data-link-url="${i}" style="display:none;">`;
      container.appendChild(el);
    });
  }

  /* ── Custom Sections ── */
  function _renderCustomSections() {
    const container = document.getElementById('sectionsContainer');
    if (!container) return;
    container.querySelectorAll('.custom-section').forEach(s => s.remove());
    (_data.customSections || []).forEach(cs => container.appendChild(buildCustomSection(cs)));
  }

  function buildCustomSection(cs) {
    const section = document.createElement('section');
    section.className = 'custom-section';
    section.id = cs.id;
    section.innerHTML = `
      <div class="container">
        <div class="custom-section__inner">
          <span class="section-eyebrow" data-field="${cs.id}-eyebrow">${cs.eyebrow || ''}</span>
          <h2 class="custom-section__heading section-heading" data-field="${cs.id}-heading">${cs.label || ''}</h2>
          <div class="divider"></div>
          <p class="custom-section__body" data-field="${cs.id}-body" data-multiline="true">${cs.body || '在這裡輸入內容...'}</p>
        </div>
      </div>
      <div class="section-resize-handle" title="拖曳調整區塊高度"></div>`;
    return section;
  }

  function _applySectionPadding() {
    const sp = _data.sectionPadding || {};
    Object.entries(sp).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.style.paddingBottom = val + 'px';
    });
  }

  /* ── Public helpers ── */
  function rebuildCard(proj) {
    const grid = document.getElementById('portfolioGrid');
    const existing = grid?.querySelector(`[data-id="${proj.id}"]`);
    const newCard = _buildProjectCard(proj);
    if (existing) grid.replaceChild(newCard, existing);
    else grid.insertBefore(newCard, grid.querySelector('.add-project-card'));
  }
  function removeCard(id) { document.querySelector(`.project-card[data-id="${id}"]`)?.remove(); }
  function refreshFilterTabs() { _renderFilterTabs(); }

  return { render, rebuildCard, removeCard, refreshFilterTabs, buildCustomSection };
})();
