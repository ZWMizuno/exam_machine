// === Home / Dashboard Page — modernized ===

const _homePage = {
  async render(container) {
    const user = getCurrentUser();
    const bankCount = await db.banks.count();
    const questionCount = await db.questions.count();
    const historyCount = await db.history.where('userId').equals(user.id).count();
    const wrongCount = await db.wrongQuestions.where('userId').equals(user.id).count();

    const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    const totalActions = historyCount + wrongCount;
    const sectionTitle = (text) => `
      <div class="section-title">
        <h5>${text}</h5>
      </div>`;

    container.innerHTML = `
      <div class="content-narrow">

        <header class="page-header">
          <div class="page-header__title">
            <i class="bi bi-hand-wave" aria-hidden="true"></i>
            <h3>欢迎回来，${escapeHtml(user.username)}</h3>
            <span class="subtitle">${today}</span>
          </div>
          <div class="page-header__index" aria-label="控制台位置 00 / 06">
            <strong>00 / 06</strong>
            <span>DASHBOARD</span>
          </div>
        </header>

        <!-- Stats: ledger-style flat grid -->
        <div class="stats-grid mb-5" role="group" aria-label="数据概览">
          <div class="stat-card">
            <div>
              <div class="stat-value" aria-label="题库总数">${bankCount}</div>
              <div class="stat-label">题库总数</div>
            </div>
            <i class="bi bi-collection stat-icon" aria-hidden="true"></i>
          </div>
          <div class="stat-card">
            <div>
              <div class="stat-value" aria-label="题目总数">${questionCount}</div>
              <div class="stat-label">题目总数</div>
            </div>
            <i class="bi bi-question-circle stat-icon" aria-hidden="true"></i>
          </div>
          <div class="stat-card">
            <div>
              <div class="stat-value" aria-label="考试/练习次数">${historyCount}</div>
              <div class="stat-label">考试/练习次数</div>
            </div>
            <i class="bi bi-clock-history stat-icon" aria-hidden="true"></i>
          </div>
          <div class="stat-card">
            <div>
              <div class="stat-value" aria-label="错题总数">${wrongCount}</div>
              <div class="stat-label">错题总数</div>
            </div>
            <i class="bi bi-book stat-icon" aria-hidden="true"></i>
          </div>
        </div>

        ${sectionTitle('快捷操作')}

        <div class="row g-3 mb-5" role="group" aria-label="快捷操作">
          <div class="col-sm-6 col-md-4 col-lg-2">
            <a href="#/t1/exam" class="action-card" aria-label="开始考试">
              <i class="bi bi-pencil-square" aria-hidden="true"></i>
              <div class="action-card__label">开始考试</div>
            </a>
          </div>
          <div class="col-sm-6 col-md-4 col-lg-2">
            <a href="#/t1/practice" class="action-card" aria-label="开始练习">
              <i class="bi bi-journal-text" aria-hidden="true"></i>
              <div class="action-card__label">开始练习</div>
            </a>
          </div>
          <div class="col-sm-6 col-md-4 col-lg-2">
            <a href="#/t2" class="action-card" aria-label="题库管理">
              <i class="bi bi-collection" aria-hidden="true"></i>
              <div class="action-card__label">题库管理</div>
            </a>
          </div>
          <div class="col-sm-6 col-md-4 col-lg-2">
            <a href="#/t4" class="action-card" aria-label="错题本">
              <i class="bi bi-book" aria-hidden="true"></i>
              <div class="action-card__label">错题本</div>
            </a>
          </div>
          <div class="col-sm-6 col-md-4 col-lg-2">
            <a href="#/t3" class="action-card" aria-label="历史记录">
              <i class="bi bi-clock-history" aria-hidden="true"></i>
              <div class="action-card__label">历史记录</div>
            </a>
          </div>
          <div class="col-sm-6 col-md-4 col-lg-2">
            <a href="#/t5" class="action-card" aria-label="试卷生成">
              <i class="bi bi-file-earmark-text" aria-hidden="true"></i>
              <div class="action-card__label">试卷生成</div>
            </a>
          </div>
        </div>

        ${sectionTitle('数据管理')}

        <div class="row g-3 mb-4" role="group" aria-label="数据管理">
          <div class="col-sm-6 col-md-3">
            <a class="action-card" onclick="exportAllData()" role="button" tabindex="0" aria-label="导出备份">
              <i class="bi bi-download" aria-hidden="true"></i>
              <div class="action-card__label">导出备份</div>
              <div class="action-card__hint">导出全部数据为 JSON</div>
            </a>
          </div>
          <div class="col-sm-6 col-md-3">
            <a class="action-card" onclick="document.getElementById('importFileInput').click()" role="button" tabindex="0" aria-label="导入恢复">
              <i class="bi bi-upload" aria-hidden="true"></i>
              <div class="action-card__label">导入恢复</div>
              <div class="action-card__hint">从备份文件恢复数据</div>
            </a>
          </div>
        </div>
        <label for="importFileInput" class="sr-only">导入 JSON 备份文件</label>
        <input type="file" id="importFileInput" accept=".json" style="display:none" onchange="handleImportFile(this)">
      </div>`;
  },

  async destroy() {}
};

async function handleImportFile(input) {
  if (!input.files || !input.files[0]) return;
  await importAllData(input.files[0]);
  input.value = '';
}

window._homePage = _homePage;
