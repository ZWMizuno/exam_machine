// === T2 Bank Detail: Edit (T2.2) & View (T2.3) ===

let t2DetailCurrentPage = 1;
let t2DetailSearchQuery = '';
let t2DetailCurrentType = 'single';
let t2DetailChanges = [];
const T2_DETAIL_PAGE_SIZE = 20;

// 动态追踪每个题目的选项和空数量（edit 模式）
let _trackedOpts = {};   // { [qid]: { [label]: value } }
let _trackedBlankCounts = {}; // { [qid]: number }

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
    _trackedOpts = {};
    _trackedBlankCounts = {};

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

        // Options (edit mode supports add/remove up to 8)
        if (q.type === 'single' || q.type === 'multi') {
          const qid = String(q.id); // normalize to string for consistent key usage
          const baseOpts = q.options || {};
          const tracked = _trackedOpts[qid] || {};
          const merged = { ...baseOpts };
          for (const k in tracked) merged[k] = tracked[k];
          // Filter out options marked for removal in t2DetailChanges
          const removalLabels = (t2DetailChanges || [])
            .filter(c => c.questionId === q.id && c.field.startsWith('option_') && c.newValue === '_REMOVE_')
            .map(c => c.field.replace('option_', ''));
          for (const rl of removalLabels) delete merged[rl];
          const labels = Object.keys(merged).sort();
          const maxOpt = q.type === 'single' ? 4 : 8;
          questionsHtml += `<div class="col-12"><div class="d-flex gap-2 flex-wrap align-items-center">`;
          for (const label of labels) {
            const canDel = labels.length > 1;
            questionsHtml += isEdit
              ? `<span class="small d-flex align-items-center gap-1">
                  <strong>${label.replace('option_', '')}:</strong>
                  <input type="text" class="form-control form-control-sm" style="width:120px" data-field="option_${label}" value="${escapeHtml(merged[label])}" data-qid="${qid}">
                  ${canDel ? `<button class="btn btn-sm btn-link text-danger p-0" data-remove-opt="${qid}" data-opt-label="${label}" title="删除选项"><i class="bi bi-dash-circle"></i></button>` : ''}
                </span>`
              : `<span class="small"><strong>${label}:</strong> ${escapeHtml(merged[label])}</span>`;
          }
          if (isEdit && labels.length < maxOpt) {
            questionsHtml += `<button class="btn btn-sm btn-outline-primary" data-add-opt="${qid}" data-q-type="${q.type}"><i class="bi bi-plus"></i>选项</button>`;
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
          const qid = String(q.id);
          const baseCount = (q.answer || []).length;
          const count = _trackedBlankCounts[qid] !== undefined ? _trackedBlankCounts[qid] : baseCount;
          const blanks = q.answer || [];
          questionsHtml += isEdit
            ? `<div class="d-flex gap-2 flex-wrap align-items-center">
                ${Array.from({ length: count }, (_, i) => {
                  const val = i < blanks.length ? blanks[i] : '';
                  const trackedKey = `blank_${i}`;
                  const trackedVal = (_trackedOpts[qid] || {})[trackedKey];
                  const displayVal = trackedVal !== undefined ? trackedVal : val;
                  const canDel = count > 1;
                  return `<span class="small d-flex align-items-center gap-1">
                    <strong>空${i + 1}:</strong>
                    <input type="text" class="form-control form-control-sm" style="width:160px" data-field="blank_${i}" value="${escapeHtml(displayVal)}" data-qid="${qid}" placeholder="空${i+1}">
                    ${canDel ? `<button class="btn btn-sm btn-link text-danger p-0" data-remove-blank="${qid}" data-blank-idx="${i}" title="删除空"><i class="bi bi-dash-circle"></i></button>` : ''}
                  </span>`;
                }).join('')}
                ${count < 8 ? `<button class="btn btn-sm btn-outline-primary" data-add-blank="${qid}"><i class="bi bi-plus"></i>空</button>` : ''}
               </div>`
            : `<span class="badge bg-success">答案: ${blanks.map((a, i) => `空${i+1}: ${escapeHtml(a)}`).join('; ')}</span>`;
        } else if (q.type === 'essay') {
          questionsHtml += isEdit
            ? `</div><div class="col-12 mt-1"><textarea class="form-control form-control-sm" data-field="answer" rows="2" placeholder="请输入答案">${escapeHtml(q.answer || '')}</textarea>`
            : `<span class="badge bg-success">答案: ${escapeHtml(q.answer || '')}</span>`;
        }

        if (isEdit) {
          questionsHtml += `<button class="btn btn-sm btn-outline-danger btn-icon" data-delete-q="${q.id}"><i class="bi bi-trash"></i></button>`;
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

    // === Edit mode event delegation ===
    if (isEdit) {
      const questionsDiv = document.getElementById('t2DetailQuestions');

      // Delegate: input/select/textarea change
      questionsDiv.addEventListener('change', (e) => {
        const input = e.target;
        if (!input.matches('input, select, textarea')) return;
        const field = input.dataset.field;
        const qidRaw = input.dataset.qid || input.closest('.question-edit-item').dataset.qid;
        if (!field || !qidRaw) return;
        const qidNum = parseInt(qidRaw);
        const qidStr = String(qidRaw);

        // Persist into tracked maps for options/blanks (string key)
        if (!_trackedOpts[qidStr]) _trackedOpts[qidStr] = {};
        if (field.startsWith('option_') || field.startsWith('blank_')) {
          _trackedOpts[qidStr][field] = input.value;
        }

        // Push to changes (number key)
        const existing = t2DetailChanges.find(c => c.questionId === qidNum && c.field === field);
        if (existing) {
          existing.newValue = input.value;
        } else {
          t2DetailChanges.push({ questionId: qidNum, field, newValue: input.value });
        }
      });

      // Delegate: add option
      questionsDiv.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-add-opt]');
        if (!btn) return;
        const qidNum = parseInt(btn.dataset.addOpt);
        const qidStr = String(qidNum);
        const qType = btn.dataset.qType;
        const q = await getQuestionById(qidNum);
        if (!q) return;
        if (!_trackedOpts[qidStr]) _trackedOpts[qidStr] = {};
        const tracked = _trackedOpts[qidStr];
        const baseOpts = q.options || {};
        const baseKeys = Object.keys(baseOpts).sort();
        const trackedKeys = Object.keys(tracked).filter(k => k.startsWith('option_')).map(k => k.replace('option_', ''));
        // Subtract options marked for removal
        const removedLabels = (t2DetailChanges || [])
          .filter(c => c.questionId === qidNum && c.field.startsWith('option_') && c.newValue === '_REMOVE_')
          .map(c => c.field.replace('option_', ''));
        // trackedKeys must also exclude any that are marked for removal (in case original option was re-added then removed)
        const activeTrackedKeys = trackedKeys.filter(k => !removedLabels.includes(k));
        // Find first letter not already used (after accounting for removals)
        const used = new Set([...baseKeys.filter(k => !removedLabels.includes(k)), ...activeTrackedKeys]);
        const maxOpt = qType === 'single' ? 4 : 8;
        const maxLetter = String.fromCharCode(65 + maxOpt - 1); // 'D' for single (4), 'H' for multi (8)
        let nextChar = 'A';
        while (used.has(nextChar)) nextChar = String.fromCharCode(nextChar.charCodeAt(0) + 1);
        // Only block if nextChar exceeds the max allowed letter (e.g., 'E' when max is 4)
        if (nextChar > maxLetter) { showToast(`最多${maxOpt}个选项`, 'warning'); return; }
        _trackedOpts[qidStr][`option_${nextChar}`] = '';
        this.renderContent(container, bank, bankId, isEdit, counts, availableTypes);
      });

      // Delegate: remove option
      questionsDiv.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-remove-opt]');
        if (!btn) return;
        const qidNum = parseInt(btn.dataset.removeOpt);
        const qidStr = String(qidNum);
        const label = btn.dataset.optLabel;
        const q = await getQuestionById(qidNum);
        if (!q) return;
        if (!_trackedOpts[qidStr]) _trackedOpts[qidStr] = {};
        const baseKeys = Object.keys(q.options || {}).sort();
        const tracked = _trackedOpts[qidStr];
        const trackedKeys = Object.keys(tracked).filter(k => k.startsWith('option_')).map(k => k.replace('option_', ''));
        const removedLabels = (t2DetailChanges || [])
          .filter(c => c.questionId === qidNum && c.field.startsWith('option_') && c.newValue === '_REMOVE_')
          .map(c => c.field.replace('option_', ''));
        const totalOpts = baseKeys.filter(k => !removedLabels.includes(k)).length + trackedKeys.filter(k => !removedLabels.includes(k)).length;
        if (totalOpts <= 1) { showToast('至少保留一个选项', 'warning'); return; }
        if (trackedKeys.includes(label)) {
          // Added in this edit session — just delete from tracked
          delete _trackedOpts[qidStr][`option_${label}`];
        } else {
          // Original option — mark for removal from DB
          t2DetailChanges.push({ questionId: qidNum, field: `option_${label}`, newValue: '_REMOVE_' });
        }
        this.renderContent(container, bank, bankId, isEdit, counts, availableTypes);
      });

      // Delegate: add blank
      questionsDiv.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-add-blank]');
        if (!btn) return;
        const qid = String(btn.dataset.addBlank);
        const currentCount = _trackedBlankCounts[qid] !== undefined ? _trackedBlankCounts[qid] : 0;
        if (currentCount >= 8) { showToast('最多8个空', 'warning'); return; }
        _trackedBlankCounts[qid] = currentCount + 1;
        if (!_trackedOpts[qid]) _trackedOpts[qid] = {};
        _trackedOpts[qid][`blank_${currentCount}`] = '';
        this.renderContent(container, bank, bankId, isEdit, counts, availableTypes);
      });

      // Delegate: remove blank
      questionsDiv.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-remove-blank]');
        if (!btn) return;
        const qid = String(btn.dataset.removeBlank);
        const idx = parseInt(btn.dataset.blankIdx);
        const currentCount = _trackedBlankCounts[qid] !== undefined ? _trackedBlankCounts[qid] : 1;
        if (currentCount <= 1) { showToast('至少保留一个空', 'warning'); return; }
        _trackedBlankCounts[qid] = currentCount - 1;
        t2DetailChanges.push({ questionId: parseInt(qid), field: `blank_${idx}`, newValue: '_REMOVE_' });
        this.renderContent(container, bank, bankId, isEdit, counts, availableTypes);
      });

      // Delegate: delete question
      questionsDiv.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-delete-q]');
        if (!btn) return;
        const qid = parseInt(btn.dataset.deleteQ);
        t2DetailChanges.push({ questionId: qid, field: '_delete', newValue: true });
        btn.closest('.question-edit-item').remove();
        showToast('已标记为删除（点击确认修改生效）', 'warning');
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
          // Apply changes — group by question to minimize DB writes
          const qids = [...new Set(t2DetailChanges.map(c => c.questionId))];
          for (const qid of qids) {
            const changes = t2DetailChanges.filter(c => c.questionId === qid);
            const q = await getQuestionById(qid);
            if (!q) continue;

            // Check if deleted
            if (changes.some(c => c.field === '_delete')) {
              await deleteQuestion(qid);
              continue;
            }

            const update = {};
            for (const c of changes) {
              if (c.field === '_delete') continue;

              if (c.field.startsWith('option_')) {
                const label = c.field.replace('option_', '');
                if (c.newValue === '_REMOVE_') {
                  update._removeOption = label;
                } else {
                  update._setOption = update._setOption || {};
                  update._setOption[label] = c.newValue;
                }
              } else if (c.field.startsWith('blank_')) {
                const idx2 = parseInt(c.field.replace('blank_', ''));
                if (c.newValue === '_REMOVE_') {
                  update._removeBlank = idx2;
                } else {
                  update._setBlank = update._setBlank || {};
                  update._setBlank[idx2] = c.newValue;
                }
              } else {
                update[c.field] = c.newValue;
              }
            }

            // Apply option changes
            if (update._setOption || update._removeOption) {
              const options = { ...(q.options || {}) };
              if (update._setOption) {
                for (const [k, v] of Object.entries(update._setOption)) options[k] = v;
              }
              if (update._removeOption) {
                delete options[update._removeOption];
                // Re-key options A, B, C...
                const sorted = Object.keys(options).sort();
                const renamed = {};
                sorted.forEach((k, i) => { renamed[String.fromCharCode(65 + i)] = options[k]; });
                update.options = renamed;
              } else {
                update.options = options;
              }
            }

            // Apply blank changes — rebuild from tracked if count changed
            if (update._setBlank || update._removeBlank !== undefined) {
              const countChanged = _trackedBlankCounts[qid] !== undefined;
              if (countChanged) {
                // Rebuild full answer from tracked state
                const finalCount = _trackedBlankCounts[qid];
                const tracked = _trackedOpts[qid] || {};
                const blanks = Array.from({ length: finalCount }, (_, i) => {
                  const tk = `blank_${i}`;
                  return (tracked[tk] !== undefined ? tracked[tk] : (q.answer && q.answer[i] !== undefined ? q.answer[i] : ''));
                });
                update.answer = blanks;
              } else {
                // Just content edit — apply setBlank to copy of original
                const blanks = [...(q.answer || [])];
                if (update._setBlank) {
                  for (const [idx2, v] of Object.entries(update._setBlank)) blanks[parseInt(idx2)] = v;
                }
                update.answer = blanks;
              }
            }

            await updateQuestion(qid, update);
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
