// === T3 History Page ===

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

    container.innerHTML = `
      <div class="content-narrow">
        <h4 class="mb-3" style="color:#1a1a1a"><i class="bi bi-clock-history me-2"></i>历史记录</h4>

        <div class="row g-2 mb-3">
          <div class="col-md-3">
            <select class="form-select form-select-sm" id="t3FilterBank">
              <option value="">全部题库</option>
              ${banks.map(b => `<option value="${b.id}" ${t3FilterBank === String(b.id) ? 'selected' : ''}>${escapeHtml(b.name)}</option>`).join('')}
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select form-select-sm" id="t3FilterType">
              <option value="all" ${t3FilterType === 'all' ? 'selected' : ''}>全部类型</option>
              <option value="exam" ${t3FilterType === 'exam' ? 'selected' : ''}>考试</option>
              <option value="practice" ${t3FilterType === 'practice' ? 'selected' : ''}>练习</option>
            </select>
          </div>
        </div>

        <div class="table-page-wrapper">
          <div class="table-container">
            <table class="table table-hover">
              <thead>
                <tr><th>日期</th><th>类型</th><th>题库</th><th>模式</th><th>得分</th><th>正确率</th><th>用时</th></tr>
              </thead>
              <tbody>
                ${pageRecords.length === 0 ? '<tr><td colspan="7" class="text-center text-muted py-4">暂无历史记录</td></tr>' :
                  pageRecords.map(r => `
                    <tr>
                      <td>${formatDate(r.date)}</td>
                      <td><span class="badge ${r.type === 'exam' ? 'bg-primary' : 'bg-success'}">${r.type === 'exam' ? '考试' : '练习'}</span></td>
                      <td>${escapeHtml(r.bankName || '')}</td>
                      <td>${escapeHtml(r.modeName || '-')}</td>
                      <td><strong>${r.score}</strong> / ${r.totalScore}</td>
                      <td>${r.totalCount > 0 ? Math.round(r.correctCount / r.totalCount * 100) : 0}%</td>
                      <td>${formatTime(r.timeSpent || 0)}</td>
                    </tr>`).join('')
                }
              </tbody>
            </table>
          </div>
          <div id="t3Pagination" class="pagination-container"></div>
        </div>
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
