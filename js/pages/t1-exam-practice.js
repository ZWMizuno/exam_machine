// === T1 Exam & Practice Landing + Wizards (案头书斋) ===

const _t1Page = {
  // Exam wizard state
  _examBankId: null,
  _examStep: 1,
  _savedExamBankId: null,
  _savedExamModeConfig: null,
  // Practice wizard state
  _pracBankId: null,
  _pracStep: 1,
  _savedPracBankId: null,

  async render(container, params) {
    const hash = location.hash.slice(1);

    if (hash === '/t1') { await this.renderLanding(container); return; }
    if (hash === '/t1/exam') { await this.renderExamWizard(container); return; }
    if (hash === '/t1/practice') { await this.renderPracticeWizard(container); return; }
  },

  async renderLanding(container) {
    // Clear header actions (landing has no extra buttons)
    setHeaderActions('');
    container.innerHTML = `
      <div class="content-narrow" style="text-align:center;padding-top:30px">
        <h2 style="font-family:var(--font-display);color:var(--ink);font-weight:700;letter-spacing:0.15em;margin:0 0 8px">考 场</h2>
        <p style="font-family:var(--font-hand);color:var(--ink-faint);font-size:1.1rem;margin:0 0 32px;letter-spacing:0.05em">
          选其一 · 闭卷 · 始
        </p>
        <div class="mode-grid">
          <div class="mode-card" onclick="location.hash='#/t1/exam'">
            <div class="mode-card-seal"><i class="bi bi-pencil-square"></i></div>
            <h3 class="mode-card-title">考 · 试</h3>
            <p class="mode-card-desc">计时 · 自动评分 · 落卷</p>
          </div>
          <div class="mode-card mode-card-jade" onclick="location.hash='#/t1/practice'">
            <div class="mode-card-seal"><i class="bi bi-journal-text"></i></div>
            <h3 class="mode-card-title">练 · 习</h3>
            <p class="mode-card-desc">自由作答 · 即时纠错</p>
          </div>
        </div>
      </div>`;
  },

  // === Exam Wizard ===
  async renderExamWizard(container) {
    const banks = await getAllBanks();
    if (banks.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="bi bi-folder2-open"></i><p>卷宗无题，请先录入</p><a href="#/t2/add" class="btn-seal">去录入题库</a></div>`;
      return;
    }

    this._examBankId = null;
    this._examStep = 1;
    setHeaderActions('');

    container.innerHTML = `
      <div class="wizard-scroll">
        <h3 class="wizard-title">考 · 试 · 卷</h3>
        <div class="wizard-steps">
          <div class="wizard-step active" id="examStep1">
            <div class="step-circle">一</div><div class="step-label">择卷宗</div>
          </div>
          <div class="wizard-step" id="examStep2">
            <div class="step-circle">二</div><div class="step-label">定规制</div>
          </div>
        </div>
        <div id="examWizardContent"></div>
      </div>`;

    this._examBindStepClicks();
    await this.renderExamStep1(container, banks);
  },

  _examBindStepClicks() {
    document.getElementById('examStep1')?.addEventListener('click', () => {
      if (this._examStep > 1) this._examGoToStep(1);
    });
  },

  async _examGoToStep(targetStep) {
    const container = document.getElementById('app-content');
    if (this._examBankId) this._savedExamBankId = this._examBankId;

    for (let i = 1; i <= 2; i++) {
      const el = document.getElementById(`examStep${i}`);
      if (!el) continue;
      el.classList.remove('active', 'completed');
      if (i < targetStep) el.classList.add('completed');
      else if (i === targetStep) el.classList.add('active');
    }
    if (targetStep === 1) {
      this._examStep = 1;
      this._examBankId = null;
      await this.renderExamStep1(container, await getAllBanks(), this._savedExamBankId);
    }
    this._examBindStepClicks();
  },

  async renderExamStep1(container, banks, savedBankId) {
    const content = document.getElementById('examWizardContent');
    content.innerHTML = `
      <div class="wizard-step-content">
        <h5 style="font-family:var(--font-display);color:var(--ink);font-weight:700;letter-spacing:0.08em;margin:0 0 12px">一 · 择卷宗</h5>
        <p style="font-family:var(--font-hand);color:var(--ink-soft);margin:0 0 12px">挑选一本要考的题库。</p>
        <select class="form-select mb-3" id="examBankSelect">
          <option value="">-- 择卷 --</option>
          ${banks.map(b => `<option value="${b.id}" ${savedBankId === b.id ? 'selected' : ''}>${escapeHtml(b.name)}</option>`).join('')}
        </select>
        <button class="btn-seal w-100" id="examNextBtn" ${savedBankId ? '' : 'disabled'} ${savedBankId ? '' : 'style="opacity:0.5;pointer-events:none"'}>
          下一步 <i class="bi bi-arrow-right ms-1"></i>
        </button>
      </div>`;

    document.getElementById('examBankSelect').addEventListener('change', (e) => {
      const btn = document.getElementById('examNextBtn');
      const empty = !e.target.value;
      btn.disabled = empty;
      btn.style.opacity = empty ? '0.5' : '';
      btn.style.pointerEvents = empty ? 'none' : '';
    });

    document.getElementById('examNextBtn').addEventListener('click', async () => {
      const bankId = parseInt(document.getElementById('examBankSelect').value);
      this._examBankId = bankId;
      await this.renderExamStep2(container, bankId);
      document.getElementById('examStep1').classList.remove('active');
      document.getElementById('examStep1').classList.add('completed');
      document.getElementById('examStep2').classList.add('active');
      this._examStep = 2;
      this._examBindStepClicks();
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
      <div class="wizard-step-content">
        <h5 style="font-family:var(--font-display);color:var(--ink);font-weight:700;letter-spacing:0.08em;margin:0 0 12px">二 · 定规制</h5>
        <p style="font-family:var(--font-hand);color:var(--ink-soft);margin:0 0 12px">「${escapeHtml(bank.name)}」的考卷配置。</p>
        <ul class="nav nav-tabs mb-3" id="examModeTabs" style="border-bottom:1px solid var(--color-border)">
          <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#modeSettings" style="color:var(--ink-soft);border:none;border-bottom:2px solid transparent">现成模式</button></li>
          <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#modeAdd" style="color:var(--ink-soft);border:none;border-bottom:2px solid transparent">新拟模式</button></li>
        </ul>
        <div class="tab-content">
          <div class="tab-pane fade show active" id="modeSettings">${await this.renderModeSettings(bankId, modes)}</div>
          <div class="tab-pane fade" id="modeAdd">${await this.renderModeAdd(bankId, counts, availableTypes, defaultName)}</div>
        </div>
        <div class="d-flex align-items-center mt-3" style="gap:0.75rem">
          <button class="btn-tag" id="examStep2Back"><i class="bi bi-arrow-left"></i> 上一步</button>
          <div class="d-flex gap-2 flex-grow-1 justify-content-end">
            <button class="btn-seal btn-seal-jade flex-grow-1" id="startExamBtn" style="display:none"><i class="bi bi-play-fill me-1"></i>开考</button>
            <button type="submit" form="examModeAddForm" class="btn-seal btn-seal-jade flex-grow-1" style="display:none" id="addModeBtn"><i class="bi bi-plus-circle me-1"></i>立此模式</button>
          </div>
        </div>
      </div>`;

    document.getElementById('examStep2Back').addEventListener('click', async () => {
      await this._examGoToStep(1);
    });

    const examModeTabs = document.getElementById('examModeTabs');
    examModeTabs.addEventListener('shown.bs.tab', (e) => {
      const startBtn = document.getElementById('startExamBtn');
      const addBtn = document.getElementById('addModeBtn');
      if (e.target.dataset.bsTarget === '#modeAdd') {
        if (startBtn) startBtn.style.display = 'none';
        if (addBtn) addBtn.style.display = 'inline-block';
      } else {
        if (startBtn) startBtn.style.display = modeSelect?.value ? 'inline-block' : 'none';
        if (addBtn) addBtn.style.display = 'none';
      }
    });

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

    content.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-delete-mode]');
      if (!btn) return;
      const modeId = parseInt(btn.dataset.deleteMode);
      const confirmed = await showConfirm('删除模式', '确定要删除此考试模式吗？', '删除', '取消', true);
      if (confirmed) {
        await deleteExamMode(modeId);
        showToast('模式已删除', 'success');
        await this.renderExamStep2(container, bankId);
      }
    });

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

    const addForm = document.getElementById('examModeAddForm');
    if (addForm) {
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('modeName').value.trim() || defaultName;
        const duration = parseInt(document.getElementById('modeDuration').value) || 60;
        const passScore = parseFloat(document.getElementById('modePassScore').value) || 60;

        const configs = [];
        for (const t of availableTypes) {
          const count = parseInt(document.getElementById(`count_${t}`).value) || 0;
          const points = parseFloat(document.getElementById(`points_${t}`).value) || 0;
          const shuffle = document.getElementById(`shuffle_${t}`)?.checked || false;
          if (count > 0 && points >= 0) {
            configs.push({ type: t, count, points, shuffleOptions: shuffle });
          }
        }

        if (configs.length === 0) { showToast('请至少配置一种题型', 'warning'); return; }

        const totalScore = configs.reduce((s, c) => s + c.count * parseFloat(c.points || 0), 0);
        const modeId = await createExamMode({
          bankId, name, durationMinutes: duration, passScore, configs, totalScore, createdAt: new Date().toISOString()
        });

        showToast('模式已立', 'success');
        await this.renderExamStep2(container, bankId);
      });
    }

    this.bindAutoCalc(availableTypes);
  },

  async renderModeSettings(bankId, modes) {
    if (modes.length === 0) {
      return `<p style="font-family:var(--font-hand);color:var(--ink-faint)">尚无现成模式，去「新拟模式」立一条。</p>`;
    }
    return `
      <select class="form-select mb-3" id="examModeSelect">
        <option value="">-- 择已立模式 --</option>
        ${modes.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('')}
      </select>
      <div id="modeInfo" style="display:none" class="mb-3"></div>`;
  },

  async renderModeAdd(bankId, counts, availableTypes, defaultName) {
    return `
      <form id="examModeAddForm">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">模式名</label>
            <input type="text" class="form-control" id="modeName" value="${defaultName}">
          </div>
          <div class="col-md-4">
            <label class="form-label">时长（分钟）</label>
            <input type="number" class="form-control" id="modeDuration" value="60" min="1">
          </div>
          <div class="col-md-4">
            <label class="form-label">及格分</label>
            <input type="number" class="form-control" id="modePassScore" value="60" min="0" step="any">
          </div>
        </div>
        <hr style="border-color:var(--color-border)">
        <h6 style="font-family:var(--font-display);color:var(--ink);font-weight:700;letter-spacing:0.08em">题目构成</h6>
        <div class="type-config-list">
        ${availableTypes.map(t => `
          <div class="type-col" id="typeRow_${t}">
            <div class="type-col-header">
              <input class="form-check-input" type="checkbox" id="enable_${t}" data-type="${t}" checked style="border-color:var(--ink-soft)">
              <label class="form-check-label" for="enable_${t}" style="font-family:var(--font-display);font-weight:700">${TYPE_LABELS[t]}<span class="text-muted ms-1 small">(${counts[t]}题)</span></label>
            </div>
            <div class="type-field">
              <label class="form-label" for="count_${t}">题目数量</label>
              <input type="number" class="form-control form-control-sm" id="count_${t}" value="0" min="0" max="${counts[t]}">
            </div>
            <div class="type-field">
              <label class="form-label" for="points_${t}">每题分值</label>
              <input type="number" class="form-control form-control-sm" id="points_${t}" value="0" min="0" step="any">
            </div>
            ${(t === 'single' || t === 'multi') ? `
            <div class="type-col-footer">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="shuffle_${t}">
                <label class="form-check-label small" for="shuffle_${t}">选项乱序</label>
              </div>
            </div>` : ''}
          </div>
        `).join('')}
        </div>
        <div class="alert mt-3" style="background:var(--paper-2);border:1px solid var(--color-border);color:var(--ink);font-family:var(--font-hand)">
          试卷总分：<strong id="examTotalScore" style="font-family:var(--font-display);color:var(--seal)">0</strong> 分
        </div>
      </form>`;
  },

  // === Practice Wizard ===
  async renderPracticeWizard(container) {
    const banks = await getAllBanks();
    if (banks.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="bi bi-folder2-open"></i><p>卷宗无题，请先录入</p><a href="#/t2/add" class="btn-seal">去录入题库</a></div>`;
      return;
    }

    this._pracBankId = null;
    this._pracStep = 1;
    setHeaderActions('');

    container.innerHTML = `
      <div class="wizard-scroll">
        <h3 class="wizard-title">练 · 习 · 卷</h3>
        <div class="wizard-steps">
          <div class="wizard-step active" id="pracStep1">
            <div class="step-circle">一</div><div class="step-label">择卷宗</div>
          </div>
          <div class="wizard-step" id="pracStep2">
            <div class="step-circle">二</div><div class="step-label">选题目</div>
          </div>
        </div>
        <div id="pracWizardContent"></div>
      </div>`;

    this._pracBindStepClicks();
    await this.renderPracticeStep1(container, banks);
  },

  _pracBindStepClicks() {
    document.getElementById('pracStep1')?.addEventListener('click', () => {
      if (this._pracStep > 1) this._pracGoToStep(1);
    });
  },

  async _pracGoToStep(targetStep) {
    const container = document.getElementById('app-content');
    if (this._pracBankId) this._savedPracBankId = this._pracBankId;

    for (let i = 1; i <= 2; i++) {
      const el = document.getElementById(`pracStep${i}`);
      if (!el) continue;
      el.classList.remove('active', 'completed');
      if (i < targetStep) el.classList.add('completed');
      else if (i === targetStep) el.classList.add('active');
    }
    if (targetStep === 1) {
      this._pracStep = 1;
      this._pracBankId = null;
      await this.renderPracticeStep1(container, await getAllBanks(), this._savedPracBankId);
    }
    this._pracBindStepClicks();
  },

  async renderPracticeStep1(container, banks, savedBankId) {
    const content = document.getElementById('pracWizardContent');
    content.innerHTML = `
      <div class="wizard-step-content">
        <h5 style="font-family:var(--font-display);color:var(--ink);font-weight:700;letter-spacing:0.08em;margin:0 0 12px">一 · 择卷宗</h5>
        <p style="font-family:var(--font-hand);color:var(--ink-soft);margin:0 0 12px">挑一本要练的题库。</p>
        <select class="form-select mb-3" id="pracBankSelect">
          <option value="">-- 择卷 --</option>
          ${banks.map(b => `<option value="${b.id}" ${savedBankId === b.id ? 'selected' : ''}>${escapeHtml(b.name)}</option>`).join('')}
        </select>
        <button class="btn-seal btn-seal-jade w-100" id="pracNextBtn" ${savedBankId ? '' : 'style="opacity:0.5;pointer-events:none"'}>
          下一步 <i class="bi bi-arrow-right ms-1"></i>
        </button>
      </div>`;

    document.getElementById('pracBankSelect').addEventListener('change', (e) => {
      const btn = document.getElementById('pracNextBtn');
      const empty = !e.target.value;
      btn.style.opacity = empty ? '0.5' : '';
      btn.style.pointerEvents = empty ? 'none' : '';
    });

    document.getElementById('pracNextBtn').addEventListener('click', async () => {
      const bankId = parseInt(document.getElementById('pracBankSelect').value);
      this._pracBankId = bankId;
      await this.renderPracticeStep2(container, bankId);
      document.getElementById('pracStep1').classList.remove('active');
      document.getElementById('pracStep1').classList.add('completed');
      document.getElementById('pracStep2').classList.add('active');
      this._pracStep = 2;
      this._pracBindStepClicks();
    });
  },

  async renderPracticeStep2(container, bankId) {
    const bank = await getBankById(bankId);
    const counts = await getQuestionCounts(bankId);
    const availableTypes = QUESTION_TYPES.filter(t => counts[t] > 0);

    const content = document.getElementById('pracWizardContent');
    content.innerHTML = `
      <div class="wizard-step-content">
        <h5 style="font-family:var(--font-display);color:var(--ink);font-weight:700;letter-spacing:0.08em;margin:0 0 12px">二 · 选题目</h5>
        <p style="font-family:var(--font-hand);color:var(--ink-soft);margin:0 0 12px">「${escapeHtml(bank.name)}」的练习范围。</p>
        <form id="pracConfigForm">
          <div class="type-config-list">
          ${availableTypes.map(t => `
            <div class="type-col" id="pracTypeRow_${t}">
              <div class="type-col-header">
                <input class="form-check-input" type="checkbox" id="prac_enable_${t}" data-type="${t}" checked style="border-color:var(--ink-soft)">
                <label class="form-check-label" for="prac_enable_${t}" style="font-family:var(--font-display);font-weight:700">${TYPE_LABELS[t]}<span class="text-muted ms-1 small">(${counts[t]}题)</span></label>
              </div>
              <div class="type-field">
                <label class="form-label" for="prac_start_${t}">起始题号</label>
                <input type="number" class="form-control form-control-sm" id="prac_start_${t}" value="1" min="1" max="${counts[t]}">
              </div>
              <div class="type-field">
                <label class="form-label" for="prac_end_${t}">结束题号</label>
                <input type="number" class="form-control form-control-sm" id="prac_end_${t}" value="${counts[t]}" min="1" max="${counts[t]}">
              </div>
              ${(t === 'single' || t === 'multi') ? `
              <div class="type-col-footer">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="prac_shuffle_${t}">
                  <label class="form-check-label small" for="prac_shuffle_${t}">选项乱序</label>
                </div>
              </div>` : ''}
            </div>
          `).join('')}
          </div>
          <div class="d-flex gap-2 mt-3">
            <button type="button" class="btn-tag" id="pracStep2Back"><i class="bi bi-arrow-left"></i> 上一步</button>
            <button type="submit" class="btn-seal btn-seal-jade btn-seal-lg flex-grow-1"><i class="bi bi-play-fill me-1"></i>开练</button>
          </div>
        </form>
      </div>`;

    document.getElementById('pracStep2Back').addEventListener('click', async () => {
      await this._pracGoToStep(1);
    });

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
        const points = parseFloat(document.getElementById(`points_${t}`)?.value) || 0;
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
  return `<div class="paper-card" style="margin-bottom:0;background:var(--paper-2)">
    <h6 style="font-family:var(--font-display);color:var(--ink);font-weight:700;margin:0 0 6px">${escapeHtml(mode.name)}</h6>
    <p style="margin:0 0 4px;font-size:0.9rem;color:var(--ink-soft)">时长：${mode.durationMinutes} 分钟 · 及格分：${mode.passScore} · 总分：${mode.totalScore}</p>
    <div style="font-size:0.85rem;color:var(--ink-faint);font-family:var(--font-hand)">${(mode.configs || []).map(c => `${TYPE_LABELS_SHORT[c.type]} ${c.count}道×${c.points}分`).join(' · ')}</div>
    <button class="btn-tag" style="margin-top:8px;color:var(--seal);border-color:var(--seal)" data-delete-mode="${mode.id}"><i class="bi bi-trash me-1"></i>删此模式</button>
  </div>`;
}
