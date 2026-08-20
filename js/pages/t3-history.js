// === T3 History Page (履历册 — vertical timeline) ===

let t3CurrentPage = 1;
let t3FilterBank = '';
let t3FilterType = 'all';
const T3_PAGE_SIZE = 10;

const _t3HistoryPage = {
  async render(container) {
    container.style.background = '';
    const user = getCurrentUser();
    const bankId = t3FilterBank ? parseInt(t3FilterBank) : null;
    const records = await getHistoryByUser(user.id, bankId, t3FilterType);
    const banks = await getAllBanks();

    const total = records.length;
    const startIdx = (t3CurrentPage - 1) * T3_PAGE_SIZE;
    const pageRecords = records.slice(startIdx, startIdx + T3_PAGE_SIZE);

    // Header actions
    setHeaderActions('');

    // Filter bar — ALWAYS rendered (even when empty), so user can switch filters
    const filterBarHtml = `
      <div class="row g-2 mb-3">
        <div class="col-md-4">
          <select class="form-select form-select-sm" id="t3FilterBank">
            <option value="">全部卷宗</option>
            ${banks.map(b => `<option value="${b.id}" ${t3FilterBank === String(b.id) ? 'selected' : ''}>${escapeHtml(b.name)}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-3">
          <select class="form-select form-select-sm" id="t3FilterType">
            <option value="all" ${t3FilterType === 'all' ? 'selected' : ''}>全部</option>
            <option value="exam" ${t3FilterType === 'exam' ? 'selected' : ''}>仅考试</option>
            <option value="practice" ${t3FilterType === 'practice' ? 'selected' : ''}>仅练习</option>
          </select>
        </div>
        <div class="col-md-5 text-end" style="font-family:var(--font-hand);color:var(--ink-faint);align-self:center">
          共 ${total} 条
        </div>
      </div>`;

    // Empty state inside content
    if (pageRecords.length === 0) {
      const filterLabel = t3FilterType === 'exam' ? '仅考试'
        : t3FilterType === 'practice' ? '仅练习'
        : null;
      const hasFilter = !!filterLabel || !!t3FilterBank;
      const emptyMsg = total === 0
        ? (hasFilter ? '当前筛选下无记录' : '尚无履历，去考一场吧')
        : '当前页无记录';
      const emptyIcon = total === 0 ? 'bi-clock-history' : 'bi-search';
      const emptyAction = total === 0 && !hasFilter
        ? '<a href="#/t1" class="btn-seal">去考场</a>'
        : '<button class="btn-tag" id="t3ClearFilters"><i class="bi bi-x-circle"></i> 清空筛选</button>';

      container.innerHTML = `
        <div class="content-narrow">
          ${filterBarHtml}
          <div class="empty-state">
            <i class="bi ${emptyIcon}"></i>
            <h5>${emptyMsg}</h5>
            <p>${hasFilter ? '试试切回「全部」或换个卷宗' : '每场考试或练习都会被记录'}</p>
            ${emptyAction}
          </div>
        </div>`;

      // Wire up filter change handlers
      document.getElementById('t3FilterBank').addEventListener('change', (e) => {
        t3FilterBank = e.target.value; t3CurrentPage = 1; this.render(container);
      });
      document.getElementById('t3FilterType').addEventListener('change', (e) => {
        t3FilterType = e.target.value; t3CurrentPage = 1; this.render(container);
      });
      const clearBtn = document.getElementById('t3ClearFilters');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          t3FilterBank = ''; t3FilterType = 'all'; t3CurrentPage = 1; this.render(container);
        });
      }
      return;
    }

    // Build timeline items
    const itemsHtml = pageRecords.map(r => {
      const passFail = (r.score >= (r.passScore || 0)) ? 'pass' : 'fail';
      const acc = r.totalCount > 0 ? Math.round(r.correctCount / r.totalCount * 100) : 0;
      const typeLabel = r.type === 'exam' ? '考' : '练';
      const typeColor = r.type === 'exam' ? 'var(--seal)' : 'var(--jade)';
      return `
        <div class="history-item">
          <div class="history-item-header">
            <div class="history-item-title">${escapeHtml(r.bankName || '无名卷宗')}</div>
            <div class="history-item-date">${formatDate(r.date)}</div>
          </div>
          <div class="history-item-body">
            <span class="chip" style="color:${typeColor};border-color:${typeColor}">${typeLabel} · ${escapeHtml(r.modeName || '—')}</span>
            <span class="history-score ${passFail === 'fail' ? 'fail' : ''}">${r.score}<span style="font-size:0.7em;color:var(--ink-faint)">/${r.totalScore}</span></span>
            <span style="color:var(--ink-soft)">正确率 <strong style="color:var(--ink)">${acc}%</strong></span>
            <span style="color:var(--ink-soft)">用时 <strong style="color:var(--ink);font-family:var(--font-mono)">${formatTime(r.timeSpent || 0)}</strong></span>
            ${r.score >= (r.passScore || 0) ? '<span class="chip" style="color:#1B7A4E;border-color:#1B7A4E">及格</span>' : '<span class="chip" style="color:var(--seal);border-color:var(--seal)">未达</span>'}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="content-narrow">
        ${filterBarHtml}
        <div class="history-timeline">${itemsHtml}</div>
        <div id="t3Pagination" class="mt-3"></div>
      </div>`;

    renderPagination(document.getElementById('t3Pagination'), {
      total, pageSize: T3_PAGE_SIZE, current: t3CurrentPage,
      onChange: (page) => { t3CurrentPage = page; this.render(container); }
    });

    document.getElementById('t3FilterBank').addEventListener('change', (e) => {
      t3FilterBank = e.target.value; t3CurrentPage = 1; this.render(container);
    });
    document.getElementById('t3FilterType').addEventListener('change', (e) => {
      t3FilterType = e.target.value; t3CurrentPage = 1; this.render(container);
    });
  },

  async destroy() {
    t3CurrentPage = 1;
  }
};

window._t3HistoryPage = _t3HistoryPage;
