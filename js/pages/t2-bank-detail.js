// === T2 Bank Detail: View Only — sidebar navigation layout ===

let t2DetailAllQuestions = [];
let t2DetailQuestionsByType = {};
let t2DetailCurrentIndex = 0;
let t2DetailSearchQuery = '';
let t2DetailCollapsedTypes = {};
let _t2DetailInitialized = false;

const _t2DetailPage = {
  async render(container, params) {
    const bankId = parseInt(params.bankId);
    const bank = await getBankById(bankId);
    if (!bank) { showToast('题库不存在', 'error'); location.hash = '#/t2'; return; }

    setState({ _bankName: bank.name });

    // Reset state
    t2DetailAllQuestions = [];
    t2DetailQuestionsByType = {};
    t2DetailCurrentIndex = 0;
    t2DetailSearchQuery = '';
    t2DetailCollapsedTypes = {};
    _t2DetailInitialized = false;
    this._bankId = bankId;

    // Load all questions into memory
    t2DetailAllQuestions = await getQuestionsByBank(bankId);

    // Sort by type order then by number
    const typeOrder = { single: 0, multi: 1, tf: 2, fill: 3, essay: 4 };
    t2DetailAllQuestions.sort((a, b) => {
      const ta = typeOrder[a.type] ?? 99;
      const tb = typeOrder[b.type] ?? 99;
      if (ta !== tb) return ta - tb;
      return (a.number || 0) - (b.number || 0);
    });

    // Group by type
    for (const t of QUESTION_TYPES) {
      t2DetailQuestionsByType[t] = t2DetailAllQuestions.filter(q => q.type === t);
    }

    this.renderUI(container, bank);
    this.showQuestion();
  },

  renderUI(container, bank) {
    container.innerHTML = `
      <header class="page-header">
        <div class="page-header__title">
          <a href="#/t2" class="text-decoration-none" style="color:var(--ink-faint)"><i class="bi bi-arrow-left"></i></a>
          <i class="bi bi-eye"></i>
          <h3>《${escapeHtml(bank.name)}》</h3>
          <span class="subtitle">${bank._questionsCount || ''}</span>
        </div>
        <div class="page-header__actions">
          <div class="input-group" style="width:260px">
            <span class="input-group-text" aria-hidden="true"><i class="bi bi-search"></i></span>
            <label for="t2DetailSearch" class="sr-only">搜索题目</label>
            <input type="text" class="form-control" id="t2DetailSearch" placeholder="搜索题目内容…" value="${escapeHtml(t2DetailSearchQuery)}" aria-label="搜索题目">
            <button class="btn btn-outline-secondary btn-sm" id="t2ClearSearch" style="${t2DetailSearchQuery ? 'display:inline-flex' : 'display:none'}" aria-label="清除搜索">
              <i class="bi bi-x" aria-hidden="true"></i>
            </button>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="t2DetailExportWithConfirm(${bank.id}, '${escapeHtml(bank.name)}')">
            <i class="bi bi-download" aria-hidden="true"></i> 导出
          </button>
        </div>
      </header>

      <div class="exam-layout">
        <div class="exam-sidebar-col">
          <div class="exam-sidebar" id="t2DetailSidebar"></div>
        </div>
        <div class="exam-main-col">
          <div class="exam-main-scroll">
            <div class="question-area" id="t2DetailMain"></div>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-3">
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-outline-primary" id="t2DetailPrevBtn" ${t2DetailCurrentIndex === 0 ? 'disabled' : ''} aria-label="上一题"><i class="bi bi-chevron-left" aria-hidden="true"></i> 上一题</button>
              <button class="btn btn-outline-primary" id="t2DetailNextBtn" ${t2DetailCurrentIndex === (t2DetailAllQuestions.length - 1) ? 'disabled' : ''} aria-label="下一题">下一题 <i class="bi bi-chevron-right" aria-hidden="true"></i></button>
              <span style="color:var(--ink-faint);font-family:var(--font-mono);font-size:0.72rem;letter-spacing:0.05em"><i class="bi bi-keyboard me-1" aria-hidden="true"></i>← →</span>
            </div>
          </div>
        </div>
      </div>`;

    this.bindSearchEvents();
    this.bindKeyboardNav();
    this.bindBottomNav();
  },

  bindBottomNav() {
    const prevBtn = document.getElementById('t2DetailPrevBtn');
    const nextBtn = document.getElementById('t2DetailNextBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (t2DetailCurrentIndex > 0) {
          t2DetailCurrentIndex--;
          this.showQuestion();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (t2DetailCurrentIndex < t2DetailAllQuestions.length - 1) {
          t2DetailCurrentIndex++;
          this.showQuestion();
        }
      });
    }
  },

  showQuestion() {
    const area = document.getElementById('t2DetailMain');
    if (!area) return;
    const total = t2DetailAllQuestions.length;

    // Save scroll position before innerHTML replacement
    const mainScroll = area.closest('.exam-main-scroll');
    const savedScroll = mainScroll ? mainScroll.scrollTop : 0;

    if (total === 0) {
      area.innerHTML = '<div class="empty-state" style="padding:var(--s-7)"><i class="bi bi-inbox"></i><p>暂无题目</p></div>';
      const sidebar = document.getElementById('t2DetailSidebar');
      if (sidebar) sidebar.innerHTML = '';
      return;
    }

    t2DetailCurrentIndex = Math.max(0, Math.min(t2DetailCurrentIndex, total - 1));
    const q = t2DetailAllQuestions[t2DetailCurrentIndex];

    area.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span style="color:var(--ink-faint);font-family:var(--font-mono);font-size:0.78rem;letter-spacing:0.05em">${t2DetailCurrentIndex + 1} / ${total}</span>
      </div>
      ${renderQuestion({
        id: q.id,
        questionId: q.id,
        type: q.type,
        number: q.number,
        content: q.content,
        options: q.options,
        answer: q.answer,
        fillBlankCount: q.fillBlankCount
      }, {
        readOnly: true,
        showAnswer: true,
        userAnswer: null,
        instantFeedback: false,
        correctStreak: -1,
        sessionNumber: q.number
      })}
    `;
    this.initT2DetailSidebar();
    this.renderSidebar(document.getElementById('t2DetailSidebar'));

    // Restore scroll position after innerHTML replacement
    if (mainScroll) mainScroll.scrollTop = savedScroll;

    // Update prev/next button states
    const prevBtn = document.getElementById('t2DetailPrevBtn');
    const nextBtn = document.getElementById('t2DetailNextBtn');
    const idx = t2DetailCurrentIndex;
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === total - 1;
  },

  initT2DetailSidebar() {
    if (_t2DetailInitialized) return;

    const collapsedTypes = {};
    for (const [qtype, questions] of Object.entries(t2DetailQuestionsByType)) {
      collapsedTypes[qtype] = true;
    }
    const allQuestions = Object.values(t2DetailQuestionsByType).flat();
    if (allQuestions.length > 0) {
      const firstQ = allQuestions[0];
      for (const [qtype, questions] of Object.entries(t2DetailQuestionsByType)) {
        if (questions.some(q => q.id === firstQ.id)) {
          delete collapsedTypes[qtype];
          break;
        }
      }
    }
    t2DetailCollapsedTypes = collapsedTypes;
    _t2DetailInitialized = true;
  },

  renderSidebar(container) {
    if (!container) return;
    const questionsByType = t2DetailQuestionsByType;
    const currentQ = t2DetailAllQuestions[t2DetailCurrentIndex];
    const currentQid = currentQ?.id;

    // Auto-expand the section containing current question
    if (currentQ) delete t2DetailCollapsedTypes[currentQ.type];

    let questionsHtml = '';
    for (const [qtype, questions] of Object.entries(questionsByType)) {
      if (!questions?.length) continue;
      const collapsed = t2DetailCollapsedTypes[qtype] ? ' collapsed' : '';
      questionsHtml += `<div class="type-section${collapsed}">
        <div class="type-header" data-toggle-type="${qtype}">
          <span>${TYPE_LABELS_SHORT[qtype]} (${questions.length})</span>
          <i class="bi bi-chevron-down"></i>
        </div>
        <div class="type-body">
          ${questions.map(q => {
            let c = 'question-circle';
            if (q.id === currentQid) c += ' current';
            return `<div class="${c}" data-qid="${q.id}" title="#${q.number}">${q.number}</div>`;
          }).join('')}
        </div>
      </div>`;
    }

    // Save scroll position before DOM replacement so we can restore it after.
    // Without this, every question switch would reset sidebar scroll to top.
    const oldQuestionsDiv = container.querySelector('.exam-sidebar-questions');
    const savedSidebarScroll = oldQuestionsDiv ? oldQuestionsDiv.scrollTop : 0;

    container.innerHTML = `<h6 class="mb-3">题目导航</h6><div class="exam-sidebar-questions">${questionsHtml}</div>`;

    // Circle click → navigate
    container.querySelectorAll('.question-circle').forEach(circle => {
      circle.addEventListener('click', () => {
        const idx = t2DetailAllQuestions.findIndex(q => q.id === parseInt(circle.dataset.qid));
        if (idx >= 0) {
          t2DetailCurrentIndex = idx;
          this.showQuestion();
        }
      });
    });

    // Section collapse/expand
    container.querySelectorAll('.type-header').forEach(header => {
      header.addEventListener('click', () => {
        const section = header.parentElement;
        section.classList.toggle('collapsed');
        t2DetailCollapsedTypes[header.dataset.toggleType] = section.classList.contains('collapsed');
      });
    });

    // Restore sidebar scroll position after DOM rebuild
    const newQuestionsDiv = container.querySelector('.exam-sidebar-questions');
    if (newQuestionsDiv) newQuestionsDiv.scrollTop = savedSidebarScroll;
  },

  bindSearchEvents() {
    const searchInput = document.getElementById('t2DetailSearch');
    const clearBtn = document.getElementById('t2ClearSearch');

    searchInput?.addEventListener('input', debounce(async (e) => {
      t2DetailSearchQuery = e.target.value.trim();
      t2DetailCurrentIndex = 0;

      if (t2DetailSearchQuery) {
        t2DetailAllQuestions = await searchQuestions(this._bankId, t2DetailSearchQuery);
      } else {
        t2DetailAllQuestions = await getQuestionsByBank(this._bankId);
      }

      // Sort by type order then by number
      const typeOrder = { single: 0, multi: 1, tf: 2, fill: 3, essay: 4 };
      t2DetailAllQuestions.sort((a, b) => {
        const ta = typeOrder[a.type] ?? 99;
        const tb = typeOrder[b.type] ?? 99;
        if (ta !== tb) return ta - tb;
        return (a.number || 0) - (b.number || 0);
      });

      // Regroup by type
      t2DetailQuestionsByType = {};
      for (const q of t2DetailAllQuestions) {
        (t2DetailQuestionsByType[q.type] ??= []).push(q);
      }

      if (clearBtn) clearBtn.style.display = t2DetailSearchQuery ? 'inline-flex' : 'none';
      this.showQuestion();
    }, 300));

    clearBtn?.addEventListener('click', async () => {
      t2DetailSearchQuery = '';
      t2DetailCurrentIndex = 0;
      t2DetailAllQuestions = await getQuestionsByBank(this._bankId);
      t2DetailQuestionsByType = {};
      for (const q of t2DetailAllQuestions) {
        (t2DetailQuestionsByType[q.type] ??= []).push(q);
      }
      if (searchInput) searchInput.value = '';
      if (clearBtn) clearBtn.style.display = 'none';
      this.showQuestion();
    });
  },

  bindKeyboardNav() {
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
    }
    this._keyHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (t2DetailCurrentIndex > 0) { t2DetailCurrentIndex--; this.showQuestion(); this.renderSidebar(document.getElementById('t2DetailSidebar')); }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (t2DetailCurrentIndex < t2DetailAllQuestions.length - 1) {
          t2DetailCurrentIndex++; this.showQuestion(); this.renderSidebar(document.getElementById('t2DetailSidebar'));
        }
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  },

  async destroy() {
    t2DetailAllQuestions = [];
    t2DetailQuestionsByType = {};
    t2DetailCurrentIndex = 0;
    t2DetailCollapsedTypes = {};
    _t2DetailInitialized = false;
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
  }
};

async function t2DetailExportWithConfirm(bankId, bankName) {
  const confirmed = await showConfirm('导出题库', `确定要导出《${bankName}》吗？`, '导出', '取消', false);
  if (confirmed) exportBank(bankId);
}

window._t2DetailPage = _t2DetailPage;
