// === T1 Exam & Practice Landing + Wizards ===

const _t1Page = {
  async render(container, params) {
    const hash = location.hash.slice(1);

    if (hash === '/t1') { await this.renderLanding(container); return; }
    if (hash === '/t1/exam') { await this.renderExamWizard(container); return; }
    if (hash === '/t1/practice') { await this.renderPracticeWizard(container); return; }
  },

  async renderLanding(container) {
    container.innerHTML = `
      <h4 class="mb-4"><i class="bi bi-pencil-square me-2"></i>考试 & 练习</h4>
      <p class="text-muted mb-4">请选择模式：</p>
      <div class="row g-4">
        <div class="col-md-6">
          <div class="card text-center p-4" style="cursor:pointer" onclick="location.hash='#/t1/exam'">
            <i class="bi bi-pencil-square fs-1 text-primary mb-3"></i>
            <h5>考试模式</h5>
            <p class="text-muted">计时考试，自动评分，记录成绩</p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card text-center p-4" style="cursor:pointer" onclick="location.hash='#/t1/practice'">
            <i class="bi bi-journal-text fs-1 text-success mb-3"></i>
            <h5>练习模式</h5>
            <p class="text-muted">自由练习，即时纠错，查漏补缺</p>
          </div>
        </div>
      </div>`;
  },

  // === Exam Wizard ===
  async renderExamWizard(container) {
    const banks = await getAllBanks();
    if (banks.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="bi bi-collection"></i><p>暂无题库，请先导入题库</p><a href="#/t2/add" class="btn btn-primary">去导入题库</a></div>`;
      return;
    }

    container.innerHTML = `
      <h4 class="mb-4"><i class="bi bi-pencil-square me-2"></i>考试模式</h4>
      <div class="wizard-steps mb-4">
        <div class="wizard-step active" id="examStep1">
          <div class="step-circle">1</div>
          <div class="step-label">选择题库</div>
        </div>
        <div class="wizard-step" id="examStep2">
          <div class="step-circle">2</div>
          <div class="step-label">模式设置</div>
        </div>
      </div>
      <div id="examWizardContent"></div>`;

    await this.renderExamStep1(container, banks);
  },

  async renderExamStep1(container, banks) {
    const content = document.getElementById('examWizardContent');
    content.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5>步骤 1：选择题库</h5>
          <select class="form-select mb-3" id="examBankSelect">
            <option value="">-- 选择题库 --</option>
            ${banks.map(b => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join('')}
          </select>
          <button class="btn btn-primary" id="examNextBtn" disabled>下一步 <i class="bi bi-arrow-right"></i></button>
        </div>
      </div>`;

    document.getElementById('examBankSelect').addEventListener('change', (e) => {
      document.getElementById('examNextBtn').disabled = !e.target.value;
    });

    document.getElementById('examNextBtn').addEventListener('click', async () => {
      const bankId = parseInt(document.getElementById('examBankSelect').value);
      await this.renderExamStep2(container, bankId);
      document.getElementById('examStep1').classList.remove('active');
      document.getElementById('examStep1').classList.add('completed');
      document.getElementById('examStep2').classList.add('active');
    });
  },

  async renderExamStep2(container, bankId) {
    const bank = await getBankById(bankId);
    const modes = await getExamModesByBank(bankId);
    const counts = await getQuestionCounts(bankId);
    const availableTypes = QUESTION_TYPES.filter(t => counts[t] > 0);
    const defaultName = await getDefaultModeName(bankId);

    const content = document.getElementById('examWizardContent');
    content.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5>步骤 2：模式设置</h5>
          <ul class="nav nav-tabs mb-3" id="examModeTabs">
            <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#modeSettings">模式设置</button></li>
            <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#modeAdd">模式新增</button></li>
          </ul>
          <div class="tab-content">
            <div class="tab-pane fade show active" id="modeSettings">${await this.renderModeSettings(bankId, modes)}</div>
            <div class="tab-pane fade" id="modeAdd">${await this.renderModeAdd(bankId, counts, availableTypes, defaultName)}</div>
          </div>
        </div>
      </div>`;

    // Mode select
    const modeSelect = document.getElementById('examModeSelect');
    if (modeSelect) {
      modeSelect.addEventListener('change', () => {
        const modeId = modeSelect.value;
        const modeInfo = document.getElementById('modeInfo');
        const startBtn = document.getElementById('startExamBtn');
        if (modeId) {
          const mode = modes.find(m => m.id === parseInt(modeId));
          if (mode) {
            modeInfo.innerHTML = renderModeInfo(mode);
            modeInfo.style.display = 'block';
            startBtn.style.display = 'inline-block';
            startBtn.dataset.modeId = modeId;
          }
        } else {
          modeInfo.style.display = 'none';
          startBtn.style.display = 'none';
        }
      });
    }

    // Delete mode
    content.querySelectorAll('[data-delete-mode]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const modeId = parseInt(btn.dataset.deleteMode);
        const confirmed = await showConfirm('删除模式', '确定要删除此考试模式吗？', '删除', '取消', true);
        if (confirmed) {
          await deleteExamMode(modeId);
          showToast('模式已删除', 'success');
          await this.renderExamStep2(container, bankId);
        }
      });
    });

    // Start exam
    const startBtn = document.getElementById('startExamBtn');
    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        const modeId = parseInt(startBtn.dataset.modeId);
        if (!modeId) return;
        try {
          await generateExamSession(bankId, modeId);
          location.hash = '#/t1/session';
        } catch (e) {
          showToast(e.message, 'error');
        }
      });
    }

    // Add mode form
    const addForm = document.getElementById('examModeAddForm');
    if (addForm) {
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('modeName').value.trim() || defaultName;
        const duration = parseInt(document.getElementById('modeDuration').value) || 60;
        const passScore = parseInt(document.getElementById('modePassScore').value) || 60;

        const configs = [];
        for (const t of availableTypes) {
          const count = parseInt(document.getElementById(`count_${t}`).value) || 0;
          const points = parseInt(document.getElementById(`points_${t}`).value) || 0;
          const shuffle = document.getElementById(`shuffle_${t}`)?.checked || false;
          if (count > 0 && points > 0) {
            configs.push({ type: t, count, points, shuffleOptions: shuffle });
          }
        }

        if (configs.length === 0) { showToast('请至少配置一种题型', 'warning'); return; }

        const totalScore = configs.reduce((s, c) => s + c.count * c.points, 0);
        const modeId = await createExamMode({
          bankId, name, durationMinutes: duration, passScore, configs, totalScore, createdAt: new Date().toISOString()
        });

        showToast('模式添加成功', 'success');
        await this.renderExamStep2(container, bankId);
      });
    }

    // Auto-calculate total score
    this.bindAutoCalc(availableTypes);
  },

  async renderModeSettings(bankId, modes) {
    if (modes.length === 0) {
      return `<p class="text-muted">暂无考试模式，请前往"模式新增"创建</p>`;
    }
    return `
      <select class="form-select mb-3" id="examModeSelect">
        <option value="">-- 选择考试模式 --</option>
        ${modes.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('')}
      </select>
      <div id="modeInfo" style="display:none" class="mb-3"></div>
      <button class="btn btn-success" id="startExamBtn" style="display:none"><i class="bi bi-play-fill me-1"></i>开始考试</button>`;
  },

  async renderModeAdd(bankId, counts, availableTypes, defaultName) {
    return `
      <form id="examModeAddForm">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">模式名称</label>
            <input type="text" class="form-control" id="modeName" value="${defaultName}">
          </div>
          <div class="col-md-4">
            <label class="form-label">考试时长（分钟）</label>
            <input type="number" class="form-control" id="modeDuration" value="60" min="1">
          </div>
          <div class="col-md-4">
            <label class="form-label">及格分数</label>
            <input type="number" class="form-control" id="modePassScore" value="60" min="0">
          </div>
        </div>
        <hr>
        <h6>题目构成</h6>
        ${availableTypes.map(t => `
          <div class="card mb-2">
            <div class="card-body p-3">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="enable_${t}" data-type="${t}" checked>
                <label class="form-check-label fw-bold" for="enable_${t}">${TYPE_LABELS[t]}（共 ${counts[t]} 题）</label>
              </div>
              <div class="row g-2 mt-2 type-config" id="config_${t}">
                <div class="col-md-4">
                  <label class="form-label small">题目数量（最多 ${counts[t]}）</label>
                  <input type="number" class="form-control form-control-sm" id="count_${t}" value="0" min="0" max="${counts[t]}">
                </div>
                <div class="col-md-4">
                  <label class="form-label small">每题分值</label>
                  <input type="number" class="form-control form-control-sm" id="points_${t}" value="0" min="0">
                </div>
                ${(t === 'single' || t === 'multi') ? `
                <div class="col-md-4 d-flex align-items-end">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="shuffle_${t}">
                    <label class="form-check-label small" for="shuffle_${t}">选项乱序</label>
                  </div>
                </div>` : '<div class="col-md-4"></div>'}
              </div>
            </div>
          </div>
        `).join('')}
        <div class="alert alert-info mt-2">试卷总分：<strong id="examTotalScore">0</strong> 分</div>
        <button type="submit" class="btn btn-primary"><i class="bi bi-plus-circle me-1"></i>添加模式</button>
      </form>`;
  },

  // === Practice Wizard ===
  async renderPracticeWizard(container) {
    const banks = await getAllBanks();
    if (banks.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="bi bi-collection"></i><p>暂无题库，请先导入题库</p><a href="#/t2/add" class="btn btn-primary">去导入题库</a></div>`;
      return;
    }

    container.innerHTML = `
      <h4 class="mb-4"><i class="bi bi-journal-text me-2"></i>练习模式</h4>
      <div class="wizard-steps mb-4">
        <div class="wizard-step active" id="pracStep1">
          <div class="step-circle">1</div><div class="step-label">选择题库</div>
        </div>
        <div class="wizard-step" id="pracStep2">
          <div class="step-circle">2</div><div class="step-label">题目确认</div>
        </div>
      </div>
      <div id="pracWizardContent"></div>`;

    this.renderPracticeStep1(container, banks);
  },

  async renderPracticeStep1(container, banks) {
    const content = document.getElementById('pracWizardContent');
    content.innerHTML = `
      <div class="card"><div class="card-body">
        <h5>步骤 1：选择题库</h5>
        <select class="form-select mb-3" id="pracBankSelect">
          <option value="">-- 选择题库 --</option>
          ${banks.map(b => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join('')}
        </select>
        <button class="btn btn-primary" id="pracNextBtn" disabled>下一步 <i class="bi bi-arrow-right"></i></button>
      </div></div>`;

    document.getElementById('pracBankSelect').addEventListener('change', (e) => {
      document.getElementById('pracNextBtn').disabled = !e.target.value;
    });
    document.getElementById('pracNextBtn').addEventListener('click', async () => {
      const bankId = parseInt(document.getElementById('pracBankSelect').value);
      await this.renderPracticeStep2(container, bankId);
      document.getElementById('pracStep1').classList.remove('active');
      document.getElementById('pracStep1').classList.add('completed');
      document.getElementById('pracStep2').classList.add('active');
    });
  },

  async renderPracticeStep2(container, bankId) {
    const bank = await getBankById(bankId);
    const counts = await getQuestionCounts(bankId);
    const availableTypes = QUESTION_TYPES.filter(t => counts[t] > 0);

    const content = document.getElementById('pracWizardContent');
    content.innerHTML = `
      <div class="card"><div class="card-body">
        <h5>步骤 2：题目确认</h5>
        <form id="pracConfigForm">
          ${availableTypes.map(t => `
            <div class="card mb-2"><div class="card-body p-3">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="prac_enable_${t}" data-type="${t}" checked>
                <label class="form-check-label fw-bold" for="prac_enable_${t}">${TYPE_LABELS[t]}（共 ${counts[t]} 题）</label>
              </div>
              <div class="row g-2 mt-2">
                <div class="col-md-3">
                  <label class="form-label small">起始题号</label>
                  <input type="number" class="form-control form-control-sm" id="prac_start_${t}" value="1" min="1" max="${counts[t]}">
                </div>
                <div class="col-md-3">
                  <label class="form-label small">结束题号</label>
                  <input type="number" class="form-control form-control-sm" id="prac_end_${t}" value="${counts[t]}" min="1" max="${counts[t]}">
                </div>
                ${(t === 'single' || t === 'multi') ? `
                <div class="col-md-6 d-flex align-items-end">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="prac_shuffle_${t}">
                    <label class="form-check-label small" for="prac_shuffle_${t}">选项乱序</label>
                  </div>
                </div>` : '<div class="col-md-6"></div>'}
              </div>
            </div></div>
          `).join('')}
          <button type="submit" class="btn btn-success btn-lg w-100 mt-3"><i class="bi bi-play-fill me-1"></i>开始练习</button>
        </form>
      </div></div>`;

    document.getElementById('pracConfigForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const configs = [];
      for (const t of availableTypes) {
        const enabled = document.getElementById(`prac_enable_${t}`)?.checked;
        if (!enabled) continue;
        const startNum = parseInt(document.getElementById(`prac_start_${t}`).value);
        const endNum = parseInt(document.getElementById(`prac_end_${t}`).value);
        const shuffleOptions = document.getElementById(`prac_shuffle_${t}`)?.checked || false;
        configs.push({ type: t, startNumber: startNum, endNumber: endNum, shuffleOptions });
      }
      if (configs.length === 0) { showToast('请至少选择一种题型', 'warning'); return; }

      try {
        await generatePracticeSession(bankId, configs);
        location.hash = '#/t1/session';
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  },

  bindAutoCalc(availableTypes) {
    const calcTotal = () => {
      let total = 0;
      for (const t of availableTypes) {
        const count = parseInt(document.getElementById(`count_${t}`)?.value) || 0;
        const points = parseInt(document.getElementById(`points_${t}`)?.value) || 0;
        total += count * points;
      }
      const el = document.getElementById('examTotalScore');
      if (el) el.textContent = total;
    };
    availableTypes.forEach(t => {
      document.getElementById(`count_${t}`)?.addEventListener('input', calcTotal);
      document.getElementById(`points_${t}`)?.addEventListener('input', calcTotal);
    });
  },

  async destroy() {}
};

window._t1Page = _t1Page;

function renderModeInfo(mode) {
  return `<div class="card bg-light"><div class="card-body p-3">
    <h6>${escapeHtml(mode.name)}</h6>
    <p class="mb-1 small">时长：${mode.durationMinutes} 分钟 | 及格分：${mode.passScore} | 总分：${mode.totalScore}</p>
    <div class="small text-muted">${(mode.configs || []).map(c => `${TYPE_LABELS_SHORT[c.type]} ${c.count}道×${c.points}分`).join(' / ')}</div>
    <button class="btn btn-sm btn-outline-danger mt-2" data-delete-mode="${mode.id}"><i class="bi bi-trash me-1"></i>删除此模式</button>
  </div></div>`;
}
