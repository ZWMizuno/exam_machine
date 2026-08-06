// === T2 Bank Detail: Edit (T2.2) & View (T2.3) ===

let t2DetailCurrentPage = 1;
let t2DetailSearchQuery = '';
let t2DetailCurrentType = 'single';
let t2DetailChanges = [];
const T2_DETAIL_PAGE_SIZE = 20;

const _t2DetailPage = {
  async render(container, params) {
    const bankId = parseInt(params.bankId);
    const bank = await getBankById(bankId);
    if (!bank) { showToast('题库不存在', 'error'); location.hash = '#/t2'; return; }

    setState({ _bankName: bank.name });
    const isEdit = location.hash.slice(1).startsWith('/t2/edit/');

    // Reset state
    t2DetailCurrentPage = 1;
    t2DetailSearchQuery = '';
    t2DetailChanges = [];
    t2DetailCurrentType = 'single';

    const counts = await getQuestionCounts(bankId);
    // Determine available types
    const availableTypes = QUESTION_TYPES.filter(t => counts[t] > 0);
    if (availableTypes.length > 0) t2DetailCurrentType = availableTypes[0];

    await this.renderContent(container, bank, bankId, isEdit, counts, availableTypes);
  },

  async renderContent(container, bank, bankId, isEdit, counts, availableTypes) {
    // Get questions
    let questions;
    if (t2DetailSearchQuery) {
      questions = await searchQuestions(bankId, t2DetailSearchQuery);
    } else {
      questions = await getQuestionsByBank(bankId, t2DetailCurrentType);
    }

    const total = questions.length;
    const totalPages = Math.ceil(total / T2_DETAIL_PAGE_SIZE);
    const startIdx = (t2DetailCurrentPage - 1) * T2_DETAIL_PAGE_SIZE;
    const pageQuestions = questions.slice(startIdx, startIdx + T2_DETAIL_PAGE_SIZE);

    // Type tabs
    const tabsHtml = availableTypes.map(t =>
      `<button class="btn btn-sm ${t === t2DetailCurrentType ? 'btn-primary' : 'btn-outline-secondary'} me-1" data-type-tab="${t}">${TYPE_LABELS[t]} (${counts[t]})</button>`
    ).join('');

    // Questions HTML
    let questionsHtml = '';
    if (pageQuestions.length === 0) {
      questionsHtml = `<div class="text-center text-muted py-4">暂无题目</div>`;
    } else {
      for (const q of pageQuestions) {
        questionsHtml += `
          <div class="card mb-2 question-edit-item" data-qid="${q.id}">
            <div class="card-body p-3">
              <div class="row g-2 align-items-center">
                <div class="col-auto"><span class="fw-bold">#${q.number}</span></div>
                <div class="col">${isEdit
                  ? `<input type="text" class="form-control form-control-sm" data-field="content" value="${escapeHtml(q.content)}">`
                  : `<span>${escapeHtml(q.content)}</span>`}
                </div>`;

        // Options
        if (q.type === 'single' || q.type === 'multi') {
          const opts = q.options || {};
          const labels = Object.keys(opts).sort();
          questionsHtml += `<div class="col-12"><div class="d-flex gap-2 flex-wrap">`;
          for (const label of labels) {
            questionsHtml += isEdit
              ? `<span class="small"><strong>${label}:</strong> <input type="text" class="form-control form-control-sm d-inline-block" style="width:120px" data-field="option_${label}" value="${escapeHtml(opts[label])}"></span>`
              : `<span class="small"><strong>${label}:</strong> ${escapeHtml(opts[label])}</span>`;
          }
          questionsHtml += `</div></div>`;
        }

        // Answer
        questionsHtml += `<div class="col-auto ms-auto">`;
        if (q.type === 'single') {
          questionsHtml += isEdit
            ? `<input type="text" class="form-control form-control-sm" style="width:60px" data-field="answer" value="${escapeHtml(q.answer || '')}" placeholder="如 A">`
            : `<span class="badge bg-success">答案: ${escapeHtml(q.answer || '')}</span>`;
        } else if (q.type === 'multi') {
          questionsHtml += isEdit
            ? `<input type="text" class="form-control form-control-sm" style="width:80px" data-field="answer" value="${escapeHtml(q.answer || '')}" placeholder="如 ABC">`
            : `<span class="badge bg-success">答案: ${escapeHtml(q.answer || '')}</span>`;
        } else if (q.type === 'tf') {
          questionsHtml += isEdit
            ? `<select class="form-select form-select-sm" style="width:100px" data-field="answer"><option value="true" ${q.answer === 'true' ? 'selected' : ''}>正确</option><option value="false" ${q.answer === 'false' ? 'selected' : ''}>错误</option></select>`
            : `<span class="badge bg-success">答案: ${q.answer === 'true' ? '正确' : '错误'}</span>`;
        } else if (q.type === 'fill') {
          const blanks = q.answer || [];
          questionsHtml += isEdit
            ? blanks.map((a, i) => `<input type="text" class="form-control form-control-sm mb-1" style="width:200px" data-field="blank_${i}" value="${escapeHtml(a)}" placeholder="空${i+1}">`).join('')
            : `<span class="badge bg-success">答案: ${blanks.map((a, i) => `空${i+1}: ${escapeHtml(a)}`).join('; ')}</span>`;
        } else if (q.type === 'essay') {
          questionsHtml += isEdit
            ? `<textarea class="form-control form-control-sm" style="width:250px" data-field="answer" rows="2">${escapeHtml(q.answer || '')}</textarea>`
            : `<span class="badge bg-success">答案: ${escapeHtml(q.answer || '')}</span>`;
        }

        if (isEdit) {
          questionsHtml += `<button class="btn btn-sm btn-outline-danger btn-icon ms-2" data-delete-q="${q.id}"><i class="bi bi-trash"></i></button>`;
        }
        questionsHtml += `</div></div></div></div>`;
      }
    }

    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4>
          <a href="#/t2" class="text-decoration-none text-muted me-2"><i class="bi bi-arrow-left"></i></a>
          ${isEdit ? '<i class="bi bi-pencil me-2"></i>' : '<i class="bi bi-eye me-2"></i>'}
          《${escapeHtml(bank.name)}》
        </h4>
        <div>
          <button class="btn btn-outline-secondary btn-sm me-2" onclick="exportBank(${bank.id})"><i class="bi bi-download me-1"></i>导出</button>
          ${isEdit ? `<button class="btn btn-success btn-sm" id="t2ConfirmEdit"><i class="bi bi-check-lg me-1"></i>确认修改</button>` : ''}
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>${tabsHtml}</div>
        <div class="input-group" style="width:250px">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control form-control-sm" id="t2DetailSearch" placeholder="搜索题目内容..." value="${escapeHtml(t2DetailSearchQuery)}">
          ${t2DetailSearchQuery ? `<button class="btn btn-sm btn-outline-secondary" id="t2ClearSearch"><i class="bi bi-x"></i></button>` : ''}
        </div>
      </div>

      <div id="t2DetailQuestions">${questionsHtml}</div>
      <div id="t2DetailPagination"></div>`;

    // Pagination
    renderPagination(document.getElementById('t2DetailPagination'), {
      total, pageSize: T2_DETAIL_PAGE_SIZE, current: t2DetailCurrentPage,
      onChange: (page) => { t2DetailCurrentPage = page; this.renderContent(container, bank, bankId, isEdit, counts, availableTypes); }
    });

    // Type tabs
    container.querySelectorAll('[data-type-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        t2DetailCurrentType = btn.dataset.typeTab;
        t2DetailCurrentPage = 1;
        this.renderContent(container, bank, bankId, isEdit, counts, availableTypes);
      });
    });

    // Search
    const searchInput = document.getElementById('t2DetailSearch');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        t2DetailSearchQuery = e.target.value.trim();
        t2DetailCurrentPage = 1;
        this.renderContent(container, bank, bankId, isEdit, counts, availableTypes);
      }, 300));
    }

    const clearBtn = document.getElementById('t2ClearSearch');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        t2DetailSearchQuery = '';
        t2DetailCurrentPage = 1;
        this.renderContent(container, bank, bankId, isEdit, counts, availableTypes);
      });
    }

    // Track changes (edit mode)
    if (isEdit) {
      container.querySelectorAll('.question-edit-item input, .question-edit-item select, .question-edit-item textarea').forEach(input => {
        const field = input.dataset.field;
        const qid = parseInt(input.closest('.question-edit-item').dataset.qid);
        input.addEventListener('change', () => {
          const existing = t2DetailChanges.find(c => c.questionId === qid && c.field === field);
          if (existing) {
            existing.newValue = input.value;
          } else {
            t2DetailChanges.push({ questionId: qid, field, newValue: input.value });
          }
        });
      });

      // Delete question
      container.querySelectorAll('[data-delete-q]').forEach(btn => {
        btn.addEventListener('click', () => {
          const qid = parseInt(btn.dataset.deleteQ);
          t2DetailChanges.push({ questionId: qid, field: '_delete', newValue: true });
          btn.closest('.question-edit-item').remove();
          showToast('已标记为删除（点击确认修改生效）', 'warning');
        });
      });

      // Confirm edit
      document.getElementById('t2ConfirmEdit').addEventListener('click', async () => {
        if (t2DetailChanges.length === 0) {
          showToast('没有修改', 'info');
          return;
        }

        // Build diff summary
        let diffHtml = '<table class="table table-sm"><thead><tr><th>题号</th><th>字段</th><th>变更</th></tr></thead><tbody>';
        for (const c of t2DetailChanges) {
          const q = await getQuestionById(c.questionId);
          const qnum = q ? q.number : '?';
          if (c.field === '_delete') {
            diffHtml += `<tr class="table-danger"><td>#${qnum}</td><td>删除题目</td><td>整题删除</td></tr>`;
          } else {
            const oldVal = q ? (q[c.field] || '') : '';
            diffHtml += `<tr class="table-warning"><td>#${qnum}</td><td>${c.field}</td><td>${escapeHtml(String(oldVal))} → ${escapeHtml(String(c.newValue))}</td></tr>`;
          }
        }
        diffHtml += '</tbody></table>';

        const { result } = showModal('确认修改', diffHtml, [
          { text: '取消', cls: 'btn-secondary' },
          { text: '确认修改', cls: 'btn-success' }
        ], 'lg');

        const idx = await result;
        if (idx === 1) {
          // Apply changes
          for (const c of t2DetailChanges) {
            if (c.field === '_delete') {
              await deleteQuestion(c.questionId);
            } else {
              const update = {};
              if (c.field.startsWith('option_')) {
                const q = await getQuestionById(c.questionId);
                const options = { ...(q.options || {}) };
                options[c.field.replace('option_', '')] = c.newValue;
                update.options = options;
              } else if (c.field.startsWith('blank_')) {
                const q = await getQuestionById(c.questionId);
                const blanks = [...(q.answer || [])];
                blanks[parseInt(c.field.replace('blank_', ''))] = c.newValue;
                update.answer = blanks;
              } else {
                update[c.field] = c.newValue;
              }
              await updateQuestion(c.questionId, update);
            }
          }
          await updateBank(bankId, { updatedAt: new Date().toISOString() });
          showToast('修改已保存', 'success');
          location.hash = '#/t2';
        }
      });
    }
  },

  async destroy() {}
};

window._t2DetailPage = _t2DetailPage;
