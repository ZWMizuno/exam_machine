// === T2 Question Bank List + Import ===

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

    let rowsHtml = '';
    if (pageBanks.length === 0) {
      rowsHtml = `<tr><td colspan="8" class="text-center text-muted py-4">暂无题库${t2SearchQuery ? '，请调整搜索条件' : ''}</td></tr>`;
    } else {
      for (const bank of pageBanks) {
        const counts = await getQuestionCounts(bank.id);
        rowsHtml += `<tr>
          <td class="batch-col show"><input type="checkbox" class="t2-row-checkbox" value="${bank.id}"></td>
          <td><strong class="t2-bank-name">${escapeHtml(bank.name)}</strong></td>
          <td><span class="badge bg-primary-subtle text-primary">${counts.single || 0}</span></td>
          <td><span class="badge bg-info-subtle text-info">${counts.multi || 0}</span></td>
          <td><span class="badge bg-warning-subtle text-warning-emphasis">${counts.tf || 0}</span></td>
          <td><span class="badge bg-success-subtle text-success">${counts.fill || 0}</span></td>
          <td><span class="badge bg-secondary-subtle text-secondary">${counts.essay || 0}</span></td>
          <td class="text-nowrap">
            <button class="btn btn-sm btn-outline-info btn-icon-sm me-1" title="查看" onclick="location.hash='#/t2/view/${bank.id}'"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-outline-secondary btn-icon-sm me-1" title="导出" onclick="t2ExportWithConfirm(${bank.id}, '${escapeHtml(bank.name)}')"><i class="bi bi-download"></i></button>
            ${isAdminUser ? `
            <button class="btn btn-sm btn-outline-danger btn-icon-sm" title="删除" data-delete-bank="${bank.id}" data-delete-name="${escapeHtml(bank.name)}"><i class="bi bi-trash"></i></button>
            ` : ''}
          </td>
        </tr>`;
      }
    }

    container.innerHTML = `
      <div class="content-narrow">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 style="color:#1a1a1a"><i class="bi bi-collection me-2"></i>题库集</h4>
          <div class="d-flex gap-2">
            ${isAdminUser ? `
            <button class="btn btn-danger btn-sm" id="batchDeleteBtn" onclick="t2BatchDelete()"><i class="bi bi-trash me-1"></i>批量删除</button>
            ` : ''}
            <button class="btn btn-success btn-sm" id="batchExportBtn" onclick="t2BatchExport()"><i class="bi bi-download me-1"></i>批量导出</button>
            <button class="btn btn-primary btn-sm" onclick="location.hash='#/t2/add'"><i class="bi bi-plus-circle me-1"></i>新增题库</button>
          </div>
        </div>

        <div class="mb-3">
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control" id="t2Search" placeholder="搜索题库名称..." value="${escapeHtml(t2SearchQuery)}">
          </div>
        </div>

        <div class="table-page-wrapper">
          <div class="table-container">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th class="batch-col show"><input type="checkbox" id="t2SelectAll" onchange="t2ToggleAll(this)"></th>
                  <th>题库名称</th>
                  <th>单选题</th>
                  <th>多选题</th>
                  <th>判断题</th>
                  <th>填空题</th>
                  <th>问答题</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>
          <div id="t2Pagination" class="pagination-container"></div>
        </div>
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
        const confirmed = await showConfirm('确认删除', `确定要删除题库《${name}》吗？此操作不可恢复。`, '删除', '取消', true);
        if (confirmed) {
          await deleteBank(bankId);
          showToast('题库已删除', 'success');
          this.renderList(container);
        }
      });
    });
  },

  async renderImport(container) {
    container.style.background = '';
    let importFiles = [];

    container.innerHTML = `
      <div class="content-narrow">
        <h4 class="mb-3" style="color:#1a1a1a"><i class="bi bi-plus-circle me-2"></i>新增题库</h4>
        <div class="card mb-3">
          <div class="card-body">
            <h6>步骤 1：下载标准模板</h6>
            <p class="text-muted small">请先下载标准 Excel 模板，按格式填写题目后上传。</p>
            <button class="btn btn-outline-primary" onclick="generateTemplate()"><i class="bi bi-download me-1"></i>下载标准模板</button>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <h6>步骤 2：上传填写好的题库文件</h6>
            <div class="drop-zone mb-3" id="t2DropZone">
              <i class="bi bi-cloud-upload d-block mb-2"></i>
              <p>拖拽 .xlsx 文件到此处，或点击选择文件</p>
              <input type="file" id="t2FileInput" accept=".xlsx,.xls" multiple style="display:none">
              <button class="btn btn-outline-secondary btn-sm" onclick="document.getElementById('t2FileInput').click()">选择文件</button>
            </div>
            <div id="t2FileList"></div>
            <button class="btn btn-primary mt-3" id="t2ImportBtn" disabled onclick="t2DoImport()"><i class="bi bi-check-circle me-1"></i>确认导入</button>
            <a href="#/t2" class="btn btn-outline-secondary mt-3 ms-2">返回</a>
          </div>
        </div>
      </div>`;

    const dropZone = document.getElementById('t2DropZone');
    const fileInput = document.getElementById('t2FileInput');
    const fileList = document.getElementById('t2FileList');
    const importBtn = document.getElementById('t2ImportBtn');

    function updateFileList() {
      fileList.innerHTML = importFiles.map((f, i) => `
        <div class="d-flex align-items-center gap-2 mb-2 p-2 bg-light rounded">
          <i class="bi bi-file-earmark-excel text-success fs-5"></i>
          <span class="flex-grow-1">${escapeHtml(f.file.name)}</span>
          <input type="text" class="form-control form-control-sm" style="width:200px" value="${escapeHtml(f.name)}" placeholder="题库名称" data-import-name="${i}">
          <button class="btn btn-sm btn-outline-danger btn-icon" data-remove="${i}"><i class="bi bi-x"></i></button>
        </div>`).join('');

      importBtn.disabled = importFiles.length === 0;

      // Name change handlers
      fileList.querySelectorAll('[data-import-name]').forEach(inp => {
        inp.addEventListener('input', (e) => {
          importFiles[parseInt(e.target.dataset.importName)].name = e.target.value.trim();
        });
      });
      // Remove handlers
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
    });
    fileInput.addEventListener('change', () => addFiles(fileInput.files));

    // Register global import function
    window._t2ImportFiles = () => importFiles;
  },

  async destroy() {
    t2CurrentPage = 1;
    delete window._t2ImportFiles;
  }
};

// Global import function
async function t2DoImport() {
  const files = window._t2ImportFiles ? window._t2ImportFiles() : [];
  if (files.length === 0) { showToast('请先添加文件', 'warning'); return; }

  const importBtn = document.getElementById('t2ImportBtn');
  importBtn.disabled = true;
  importBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>导入中...';

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
      showToast(`导入"${item.name}"失败：${e.message}`, 'error');
    }
  }

  if (imported > 0) showToast(`成功导入 ${imported} 个题库`, 'success');
  location.hash = '#/t2';
}

// Batch select

function t2ToggleAll(checkbox) {
  document.querySelectorAll('.t2-row-checkbox').forEach(cb => cb.checked = checkbox.checked);
}

function t2BatchExport() {
  const checked = document.querySelectorAll('.t2-row-checkbox:checked');
  if (checked.length === 0) { showToast('请选择题库', 'warning'); return; }
  const ids = Array.from(checked).map(cb => parseInt(cb.value));
  batchExportBanks(ids);
}

async function t2BatchDelete() {
  const checked = document.querySelectorAll('.t2-row-checkbox:checked');
  if (checked.length === 0) { showToast('请选择题库', 'warning'); return; }
  const confirmed = await showConfirm('批量删除', `确定要删除选中的 ${checked.length} 个题库吗？`, '删除', '取消', true);
  if (!confirmed) return;

  for (const cb of checked) {
    const row = cb.closest('tr');
    const deleteBtn = row.querySelector('[data-delete-bank]');
    if (deleteBtn) await deleteBank(parseInt(deleteBtn.dataset.deleteBank));
  }
  showToast('批量删除完成', 'success');
  t2CurrentPage = 1;
  location.reload();
}

async function t2ExportWithConfirm(bankId, bankName) {
  const confirmed = await showConfirm('导出题库', `确定要导出《${bankName}》吗？`, '导出', '取消', false);
  if (confirmed) await exportBank(bankId);
}

window._t2BanksPage = _t2BanksPage;
