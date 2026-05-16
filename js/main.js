document.addEventListener('DOMContentLoaded', async () => {
  const data = await Storage.load();

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
