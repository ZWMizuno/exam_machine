// === T2 Question Bank List + Import (卷宗夹) ===

let t2CurrentPage = 1;
let t2SearchQuery = '';
const T2_PAGE_SIZE = 10;

const _t2BanksPage = {
  async render(container, params) {
    const hash = location.hash.slice(1);
    if (hash === '/t2/add') { await this.renderImport(container); return; }
    t2CurrentPage = 1;
    await this.renderList(container);
  },

  async renderList(container) {
    container.style.background = '';
    const banks = await searchBanks(t2SearchQuery);
    const total = banks.length;
    const totalPages = Math.ceil(total / T2_PAGE_SIZE);
    const startIdx = (t2CurrentPage - 1) * T2_PAGE_SIZE;
    const pageBanks = banks.slice(startIdx, startIdx + T2_PAGE_SIZE);
    const isAdminUser = isAdmin();

    // Header actions
    setHeaderActions(`
      ${isAdminUser ? `<button class="btn-tag" id="batchDeleteBtn" style="color:var(--seal);border-color:var(--seal)" onclick="t2BatchDelete()"><i class="bi bi-trash"></i> 批删</button>` : ''}
      <button class="btn-tag" onclick="t2BatchExport()"><i class="bi bi-download"></i> 批导</button>
      <a class="btn-seal" href="#/t2/add" style="text-decoration:none"><i class="bi bi-plus-circle me-1"></i>新增卷宗</a>
    `);

    // Empty state
    if (pageBanks.length === 0) {
      container.innerHTML = `
        <div class="content-narrow">
          <div class="empty-state">
            <i class="bi bi-folder2-open"></i>
            <p>${t2SearchQuery ? '未寻得此名' : '案上空空，先录题吧'}</p>
            ${!t2SearchQuery ? '<a href="#/t2/add" class="btn-seal">录新卷宗</a>' : ''}
          </div>
        </div>`;
      return;
    }

    const folderHtml = pageBanks.map(bank => {
      const counts = bank._counts || { single: 0, multi: 0, tf: 0, fill: 0, essay: 0 };
      return `
        <div class="bank-folder" onclick="location.hash='#/t2/view/${bank.id}'">
          <div class="bank-folder-body">
            <h5 class="bank-folder-name" title="${escapeHtml(bank.name)}">${escapeHtml(bank.name)}</h5>
            <div class="bank-folder-counts">
              ${counts.single > 0 ? `<span class="chip chip-single">单选 ${counts.single}</span>` : ''}
              ${counts.multi > 0 ? `<span class="chip chip-multi">多选 ${counts.multi}</span>` : ''}
              ${counts.tf > 0 ? `<span class="chip chip-tf">判断 ${counts.tf}</span>` : ''}
              ${counts.fill > 0 ? `<span class="chip chip-fill">填空 ${counts.fill}</span>` : ''}
              ${counts.essay > 0 ? `<span class="chip chip-essay">问答 ${counts.essay}</span>` : ''}
            </div>
          </div>
          <div class="bank-folder-actions" onclick="event.stopPropagation()">
            <button class="btn-icon-jade" title="查看" onclick="location.hash='#/t2/view/${bank.id}'"><i class="bi bi-eye"></i></button>
            <button class="btn-icon-jade" title="导出" onclick="t2ExportWithConfirm(${bank.id}, '${escapeHtml(bank.name)}')"><i class="bi bi-download"></i></button>
            ${isAdminUser ? `<button class="btn-icon-jade danger" title="删除" data-delete-bank="${bank.id}" data-delete-name="${escapeHtml(bank.name)}"><i class="bi bi-trash"></i></button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="content-narrow">
        <div class="mb-3">
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" id="t2Search" placeholder="寻卷宗..." value="${escapeHtml(t2SearchQuery)}">
          </div>
        </div>

        <div class="banks-grid">${folderHtml}</div>

        <div id="t2Pagination" class="mt-3"></div>
      </div>`;

    // Pagination
    renderPagination(document.getElementById('t2Pagination'), {
      total, pageSize: T2_PAGE_SIZE, current: t2CurrentPage,
      onChange: (page) => { t2CurrentPage = page; this.renderList(container); }
    });

    // Search
    document.getElementById('t2Search').addEventListener('input', debounce((e) => {
      t2SearchQuery = e.target.value.trim();
      t2CurrentPage = 1;
      this.renderList(container);
    }, 300));

    // Delete handlers
    container.querySelectorAll('[data-delete-bank]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const bankId = parseInt(btn.dataset.deleteBank);
        const name = btn.dataset.deleteName;
        const confirmed = await showConfirm('确认删除', `确定要删除卷宗「${name}」吗？此操作不可恢复。`, '删除', '取消', true);
        if (confirmed) {
          await deleteBank(bankId);
          showToast('卷宗已删', 'success');
          this.renderList(container);
        }
      });
    });
  },

  async renderImport(container) {
    container.style.background = '';
    setHeaderActions(`<a href="#/t2" class="btn-tag" style="text-decoration:none"><i class="bi bi-arrow-left"></i> 返卷宗</a>`);

    let importFiles = [];

    container.innerHTML = `
      <div class="content-narrow">
        <div class="paper-card">
          <h6 class="paper-card-title">一 · 下模板</h6>
          <p style="font-family:var(--font-hand);color:var(--ink-soft);margin:0 0 12px">先下标准 Excel 模板，按格式录入题目。</p>
          <button class="btn-tag" onclick="generateTemplate()"><i class="bi bi-download me-1"></i>下模板</button>
        </div>

        <div class="paper-card">
          <h6 class="paper-card-title">二 · 上录入文件</h6>
          <div class="drop-zone mb-3" id="t2DropZone">
            <i class="bi bi-cloud-upload d-block mb-2"></i>
            <p style="font-family:var(--font-hand);color:var(--ink-soft);margin:0 0 8px">拖 .xlsx 文件至此，或点选</p>
            <input type="file" id="t2FileInput" accept=".xlsx,.xls" multiple style="display:none">
            <button class="btn-tag" onclick="document.getElementById('t2FileInput').click()">选文件</button>
          </div>
          <div id="t2FileList"></div>
          <div class="mt-3 d-flex gap-2">
            <button class="btn-seal btn-seal-jade" id="t2ImportBtn" disabled style="opacity:0.5;pointer-events:none" onclick="t2DoImport()"><i class="bi bi-check-circle me-1"></i>确认录入</button>
            <a href="#/t2" class="btn-tag" style="text-decoration:none">返回</a>
          </div>
        </div>
      </div>`;

    const dropZone = document.getElementById('t2DropZone');
    const fileInput = document.getElementById('t2FileInput');
    const fileList = document.getElementById('t2FileList');
    const importBtn = document.getElementById('t2ImportBtn');

    function updateFileList() {
      fileList.innerHTML = importFiles.map((f, i) => `
        <div class="d-flex align-items-center gap-2 mb-2 p-2" style="background:var(--paper-2);border-radius:4px 12px 4px 12px">
          <i class="bi bi-file-earmark-excel" style="color:var(--jade);font-size:1.2rem"></i>
          <span class="flex-grow-1" style="font-family:var(--font-body);color:var(--ink)">${escapeHtml(f.file.name)}</span>
          <input type="text" class="form-control form-control-sm" style="width:200px" value="${escapeHtml(f.name)}" placeholder="题库名" data-import-name="${i}">
          <button class="btn-icon-jade danger" data-remove="${i}"><i class="bi bi-x"></i></button>
        </div>`).join('');

      const empty = importFiles.length === 0;
      importBtn.disabled = empty;
      importBtn.style.opacity = empty ? '0.5' : '';
      importBtn.style.pointerEvents = empty ? 'none' : '';

      fileList.querySelectorAll('[data-import-name]').forEach(inp => {
        inp.addEventListener('input', (e) => {
          importFiles[parseInt(e.target.dataset.importName)].name = e.target.value.trim();
        });
      });
      fileList.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          importFiles.splice(parseInt(btn.dataset.remove), 1);
          updateFileList();
        });
      });
    }

    function addFiles(files) {
      for (const file of files) {
        if (!file.name.match(/\.xlsx?$/i)) continue;
        const name = file.name.replace(/\.xlsx?$/i, '');
        importFiles.push({ file, name });
      }
      updateFileList();
    }

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      addFiles(e.dataTransfer.files);
      fileInput.value = ''; // reset so re-selecting the same file fires change again
    });
    fileInput.addEventListener('change', () => {
      addFiles(fileInput.files);
      fileInput.value = ''; // reset so the next click on "选文件" always re-opens the picker
    });

    window._t2ImportFiles = () => importFiles;
  },

  async destroy() {
    t2CurrentPage = 1;
    delete window._t2ImportFiles;
  }
};

async function t2DoImport() {
  const files = window._t2ImportFiles ? window._t2ImportFiles() : [];
  if (files.length === 0) { showToast('请先添加文件', 'warning'); return; }

  const importBtn = document.getElementById('t2ImportBtn');
  importBtn.disabled = true;
  importBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>录入中...';

  let imported = 0;
  for (const item of files) {
    try {
      const result = await parseWorkbook(item.file, item.name);
      const bankId = await createBank({ name: result.name, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      const questions = result.questions.map(q => ({ ...q, bankId }));
      if (questions.length > 0) {
        await addQuestions(questions);
      }
      imported++;
    } catch (e) {
      showToast(`录入"${item.name}"失败：${e.message}`, 'error');
    }
  }

  if (imported > 0) showToast(`成功录入 ${imported} 个卷宗`, 'success');
  location.hash = '#/t2';
}

async function t2ExportWithConfirm(bankId, bankName) {
  const confirmed = await showConfirm('导出卷宗', `确定要导出「${bankName}」吗？`, '导出', '取消', false);
  if (confirmed) await exportBank(bankId);
}

function t2BatchExport() {
  // From old table-based list; if no checkboxes present (folder view), pick visible
  const checks = document.querySelectorAll('.t2-row-checkbox');
  let ids;
  if (checks.length > 0) {
    const checked = Array.from(checks).filter(cb => cb.checked);
    if (checked.length === 0) { showToast('请先勾选', 'warning'); return; }
    ids = checked.map(cb => parseInt(cb.value));
  } else {
    showToast('请从表格视图勾选以批量导出（即将支持）', 'info');
    return;
  }
  batchExportBanks(ids);
}

async function t2BatchDelete() {
  const checks = document.querySelectorAll('.t2-row-checkbox:checked');
  if (checks.length === 0) { showToast('请先勾选', 'warning'); return; }
  const confirmed = await showConfirm('批量删除', `确定要删除选中的 ${checks.length} 个卷宗吗？`, '删除', '取消', true);
  if (!confirmed) return;

  for (const cb of checks) {
    const id = parseInt(cb.value);
    await deleteBank(id);
  }
  showToast('批量删除完成', 'success');
  t2CurrentPage = 1;
  location.reload();
}

window._t2BanksPage = _t2BanksPage;
