// === Home / Dashboard Page ===

const _homePage = {
  async render(container) {
    const user = getCurrentUser();
    const bankCount = await db.banks.count();
    const questionCount = await db.questions.count();
    const historyCount = await db.history.where('userId').equals(user.id).count();
    const wrongCount = await db.wrongQuestions.where('userId').equals(user.id).count();

    container.innerHTML = `
      <div class="mb-4">
        <h3><i class="bi bi-hand-wave me-2"></i>欢迎回来，${escapeHtml(user.username)}！</h3>
        <p class="text-muted">今天是 ${new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric', weekday:'long' })}</p>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-xl-3">
          <div class="card stat-card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div><div class="stat-value">${bankCount}</div><div class="stat-label">题库总数</div></div>
                <i class="bi bi-collection fs-1 text-primary opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="card stat-card" style="border-left-color: var(--color-success);">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div><div class="stat-value">${questionCount}</div><div class="stat-label">题目总数</div></div>
                <i class="bi bi-question-circle fs-1 text-success opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="card stat-card" style="border-left-color: var(--color-info);">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div><div class="stat-value">${historyCount}</div><div class="stat-label">考试/练习次数</div></div>
                <i class="bi bi-clock-history fs-1 text-info opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="card stat-card" style="border-left-color: var(--color-warning);">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div><div class="stat-value">${wrongCount}</div><div class="stat-label">错题总数</div></div>
                <i class="bi bi-book fs-1 text-warning opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h5 class="mb-3">快捷操作</h5>
      <div class="row g-3">
        <div class="col-sm-6 col-md-4 col-lg-2">
          <a href="#/t1/exam" class="text-decoration-none">
            <div class="card text-center p-3 hover-card" style="cursor:pointer;">
              <i class="bi bi-pencil-square fs-1 text-primary mb-2"></i>
              <div class="fw-bold">开始考试</div>
            </div>
          </a>
        </div>
        <div class="col-sm-6 col-md-4 col-lg-2">
          <a href="#/t1/practice" class="text-decoration-none">
            <div class="card text-center p-3 hover-card" style="cursor:pointer;">
              <i class="bi bi-journal-text fs-1 text-success mb-2"></i>
              <div class="fw-bold">开始练习</div>
            </div>
          </a>
        </div>
        <div class="col-sm-6 col-md-4 col-lg-2">
          <a href="#/t2" class="text-decoration-none">
            <div class="card text-center p-3 hover-card" style="cursor:pointer;">
              <i class="bi bi-collection fs-1 text-info mb-2"></i>
              <div class="fw-bold">题库管理</div>
            </div>
          </a>
        </div>
        <div class="col-sm-6 col-md-4 col-lg-2">
          <a href="#/t4" class="text-decoration-none">
            <div class="card text-center p-3 hover-card" style="cursor:pointer;">
              <i class="bi bi-book fs-1 text-warning mb-2"></i>
              <div class="fw-bold">错题本</div>
            </div>
          </a>
        </div>
        <div class="col-sm-6 col-md-4 col-lg-2">
          <a href="#/t3" class="text-decoration-none">
            <div class="card text-center p-3 hover-card" style="cursor:pointer;">
              <i class="bi bi-clock-history fs-1 text-danger mb-2"></i>
              <div class="fw-bold">历史记录</div>
            </div>
          </a>
        </div>
        <div class="col-sm-6 col-md-4 col-lg-2">
          <a href="#/t5" class="text-decoration-none">
            <div class="card text-center p-3 hover-card" style="cursor:pointer;">
              <i class="bi bi-file-earmark-text fs-1 text-secondary mb-2"></i>
              <div class="fw-bold">试卷生成</div>
            </div>
          </a>
        </div>
      </div>`;
  },

  async destroy() {}
};

window._homePage = _homePage;
