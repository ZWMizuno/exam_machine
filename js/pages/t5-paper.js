// === T5 Paper Generation 3-Step Wizard ===

const _t5PaperPage = {
  async render(container) {
    const banks = await getAllBanks();
    if (banks.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="bi bi-collection"></i><p>暂无题库，请先导入题库</p><a href="#/t2/add" class="btn btn-primary">去导入题库</a></div>`;
      return;
    }

    container.innerHTML = `
      <h4 class="mb-4"><i class="bi bi-file-earmark-text me-2"></i>试卷生成</h4>
      <div class="wizard-steps mb-4">
        <div class="wizard-step active" id="t5Step1"><div class="step-circle">1</div><div class="step-label">选择题库</div></div>
        <div class="wizard-step" id="t5Step2"><div class="step-circle">2</div><div class="step-label">试题构成</div></div>
        <div class="wizard-step" id="t5Step3"><div class="step-circle">3</div><div class="step-label">试卷生成</div></div>
      </div>
      <div id="t5WizardContent"></div>`;

    await this.renderStep1(container, banks);
  },

  async renderStep1(container, banks) {
    const content = document.getElementById('t5WizardContent');
    content.innerHTML = `
      <div class="card"><div class="card-body">
        <h5>步骤 1：选择题库</h5>
        <select class="form-select mb-3" id="t5BankSelect">
          <option value="">-- 选择题库 --</option>
          ${banks.map(b => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join('')}
        </select>
        <button class="btn btn-primary" id="t5Step1Next" disabled>下一步 <i class="bi bi-arrow-right"></i></button>
      </div></div>`;

    document.getElementById('t5BankSelect').addEventListener('change', (e) => {
      document.getElementById('t5Step1Next').disabled = !e.target.value;
    });

    document.getElementById('t5Step1Next').addEventListener('click', async () => {
      const bankId = parseInt(document.getElementById('t5BankSelect').value);
      await this.renderStep2(container, bankId);
      document.getElementById('t5Step1').classList.replace('active', 'completed');
      document.getElementById('t5Step2').classList.add('active');
    });
  },

  async renderStep2(container, bankId) {
    const counts = await getQuestionCounts(bankId);
    const availableTypes = QUESTION_TYPES.filter(t => counts[t] > 0);

    const content = document.getElementById('t5WizardContent');
    content.innerHTML = `
      <div class="card"><div class="card-body">
        <h5>步骤 2：试题构成</h5>
        <form id="t5ConfigForm">
          <div class="mb-3">
            <label class="form-label">考试时长（分钟）</label>
            <input type="number" class="form-control" id="t5Duration" value="60" min="1" style="max-width:200px">
          </div>
          ${availableTypes.map(t => `
            <div class="card mb-2"><div class="card-body p-3">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="t5_enable_${t}" data-type="${t}" checked>
                <label class="form-check-label fw-bold" for="t5_enable_${t}">${TYPE_LABELS[t]}（共 ${counts[t]} 题）</label>
              </div>
              <div class="row g-2 mt-2">
                <div class="col-md-4">
                  <label class="form-label small">题目数量（最多 ${counts[t]}）</label>
                  <input type="number" class="form-control form-control-sm" id="t5_count_${t}" value="0" min="0" max="${counts[t]}">
                </div>
                <div class="col-md-4">
                  <label class="form-label small">每题分值</label>
                  <input type="number" class="form-control form-control-sm" id="t5_points_${t}" value="0" min="0">
                </div>
                ${(t === 'single' || t === 'multi') ? `
                <div class="col-md-4 d-flex align-items-end">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="t5_shuffle_${t}">
                    <label class="form-check-label small" for="t5_shuffle_${t}">选项乱序</label>
                  </div>
                </div>` : '<div class="col-md-4"></div>'}
              </div>
            </div></div>
          `).join('')}
          <div class="alert alert-info">试卷总分：<strong id="t5TotalScore">0</strong> 分</div>
          <button type="submit" class="btn btn-primary">下一步 <i class="bi bi-arrow-right"></i></button>
        </form>
      </div></div>`;

    // Auto-calculate
    const calc = () => {
      let total = 0;
      for (const t of availableTypes) {
        const cnt = parseInt(document.getElementById(`t5_count_${t}`)?.value) || 0;
        const pts = parseInt(document.getElementById(`t5_points_${t}`)?.value) || 0;
        total += cnt * pts;
      }
      document.getElementById('t5TotalScore').textContent = total;
    };
    availableTypes.forEach(t => {
      document.getElementById(`t5_count_${t}`)?.addEventListener('input', calc);
      document.getElementById(`t5_points_${t}`)?.addEventListener('input', calc);
    });

    document.getElementById('t5ConfigForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const duration = parseInt(document.getElementById('t5Duration').value) || 60;
      const configs = [];
      for (const t of availableTypes) {
        const enabled = document.getElementById(`t5_enable_${t}`)?.checked;
        if (!enabled) continue;
        const count = parseInt(document.getElementById(`t5_count_${t}`).value) || 0;
        const points = parseInt(document.getElementById(`t5_points_${t}`).value) || 0;
        const shuffleOptions = document.getElementById(`t5_shuffle_${t}`)?.checked || false;
        if (count > 0 && points > 0) configs.push({ type: t, count, points, shuffleOptions });
      }
      if (configs.length === 0) { showToast('请至少配置一种题型', 'warning'); return; }

      const totalScore = configs.reduce((s, c) => s + c.count * c.points, 0);
      await this.renderStep3(container, bankId, configs, duration, totalScore);
      document.getElementById('t5Step2').classList.replace('active', 'completed');
      document.getElementById('t5Step3').classList.add('active');
    });
  },

  async renderStep3(container, bankId, configs, duration, totalScore) {
    const bank = await getBankById(bankId);
    const content = document.getElementById('t5WizardContent');

    const summaryHtml = configs.map(c =>
      `<tr><td>${TYPE_LABELS[c.type]}</td><td>${c.count} 题</td><td>每题 ${c.points} 分</td><td>${c.shuffleOptions ? '<span class="badge bg-info">已启用</span>' : '<span class="badge bg-secondary">未启用</span>'}</td></tr>`
    ).join('');

    content.innerHTML = `
      <div class="card"><div class="card-body">
        <h5>步骤 3：试卷生成</h5>
        <div class="card bg-light mb-3"><div class="card-body">
          <h6>试卷配置</h6>
          <p class="mb-1">题库：《${escapeHtml(bank.name)}》| 时长：${duration} 分钟 | 总分：${totalScore} 分</p>
          <table class="table table-sm"><thead><tr><th>题型</th><th>数量</th><th>分值</th><th>选项乱序</th></tr></thead><tbody>${summaryHtml}</tbody></table>
        </div></div>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">试卷名称</label>
            <input type="text" class="form-control" id="t5PaperName" value="${escapeHtml(bank.name)}-试卷-${new Date().toISOString().slice(0,10)}">
          </div>
          <div class="col-md-3">
            <label class="form-label">纸张格式</label>
            <select class="form-select" id="t5PaperFormat">
              <option value="A4">A4横版</option>
              <option value="A3">A3横版</option>
            </select>
          </div>
          <div class="col-md-3 d-flex align-items-end">
            <button class="btn btn-success btn-lg w-100" id="t5DownloadBtn"><i class="bi bi-download me-1"></i>下载试卷</button>
          </div>
        </div>
      </div></div>`;

    document.getElementById('t5DownloadBtn').addEventListener('click', async () => {
      const paperName = document.getElementById('t5PaperName').value.trim() || '试卷';
      const format = document.getElementById('t5PaperFormat').value;
      const btn = document.getElementById('t5DownloadBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>生成中...';
      await generatePaper(bankId, configs, paperName, format, duration);
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-download me-1"></i>下载试卷';
    });
  },

  async destroy() {}
};

window._t5PaperPage = _t5PaperPage;
