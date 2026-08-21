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
    const totalQ = t2DetailAllQuestions.length;
    const counts = t2DetailAllQuestions.reduce((acc, q) => { acc[q.type] = (acc[q.type] || 0) + 1; return acc; }, {});

    // Type chips with paper aesthetic
    const TYPE_META = {
      single: { label: '单选', color: 'var(--jade)', icon: '◉' },
      multi:  { label: '多选', color: '#4A7B95',     icon: '◎' },
      tf:     { label: '判断', color: 'var(--gold)',  icon: '⊕' },
      fill:   { label: '填空', color: '#1B7A4E',     icon: '◇' },
      essay:  { label: '问答', color: '#7C3AED',     icon: '✎' },
    };
    const statChips = [];
    for (const [type, meta] of Object.entries(TYPE_META)) {
      if (counts[type]) {
        statChips.push(
          `<span class="bank-cover-stat" style="--type-color:${meta.color}">
            <span class="bank-cover-stat-mark">${meta.icon}</span>
            <span class="bank-cover-stat-label">${meta.label}</span>
            <strong>${counts[type]}</strong>
          </span>`
        );
      }
    }

    setHeaderActions(`
      <a href="#/t2" class="btn-tag" style="text-decoration:none"><i class="bi bi-arrow-left"></i> 返卷宗</a>
      <button class="btn-tag" onclick="t2DetailExportWithConfirm(${bank.id}, '${escapeHtml(bank.name)}')"><i class="bi bi-download"></i> 导出</button>
    `);

    // 卷册封面 — first char as 篆刻 seal
    const firstChar = (bank.name || '卷').trim().charAt(0) || '卷';

    container.innerHTML = `
      <div class="bank-cover">
        <div class="bank-cover-seal" aria-hidden="true">${escapeHtml(firstChar)}</div>
        <div class="bank-cover-text">
          <div class="bank-cover-eyebrow">卷  册  ·  卷  二</div>
          <h2 class="bank-cover-title">《${escapeHtml(bank.name)}》</h2>
          <p class="bank-cover-meta">共 <strong>${totalQ}</strong> 题 · 静阅卷 · ${counts.essay ? '含问答' : '客观题'}</p>
        </div>
        <div class="bank-cover-stats">${statChips.join('')}</div>
      </div>

      <div class="t2-search-row">
        <div class="input-group">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control" id="t2DetailSearch" placeholder="寻题 · 题干关键词..." value="${escapeHtml(t2DetailSearchQuery)}">
          <button class="btn-icon-jade" id="t2ClearSearch" title="清空" style="${t2DetailSearchQuery ? '' : 'display:none'}">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>

      <div class="exam-layout">
        <aside class="exam-sidebar-col">
          <div class="exam-sidebar" id="t2DetailSidebar"></div>
        </aside>
        <section class="exam-main-col">
          <div class="exam-main-scroll">
            <div class="question-area" id="t2DetailMain"></div>
          </div>
          <div class="exam-main-foot">
            <div class="exam-pager">
              <button class="btn-tag" id="t2DetailPrevBtn" ${t2DetailCurrentIndex === 0 ? 'disabled' : ''} title="上一题 (←)"><i class="bi bi-chevron-left"></i> 上一题</button>
              <span class="exam-pager-counter" id="t2DetailPagerCount">${t2DetailCurrentIndex + 1} / ${totalQ || 0}</span>
              <button class="btn-tag" id="t2DetailNextBtn" ${t2DetailCurrentIndex === (t2DetailAllQuestions.length - 1) ? 'disabled' : ''} title="下一题 (→)">下一题 <i class="bi bi-chevron-right"></i></button>
              <span class="t2-pager-hint"><i class="bi bi-keyboard"></i> ← / → 翻页</span>
            </div>
          </div>
        </section>
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
      area.innerHTML = '<div class="text-center text-muted py-5">暂无题目</div>';
      const sidebar = document.getElementById('t2DetailSidebar');
      if (sidebar) sidebar.innerHTML = '';
      return;
    }

    t2DetailCurrentIndex = Math.max(0, Math.min(t2DetailCurrentIndex, total - 1));
    const q = t2DetailAllQuestions[t2DetailCurrentIndex];

    // 卷面 — 题号印 + 题干 + 答案朱批 + 解析
    const answerText = formatAnswerForRead(q);
    const optionsHtml = renderReadOnlyOptions(q);
    const explanationHtml = q.explanation
      ? `<div class="q-explanation">
           <div class="q-explanation-label">解  笺</div>
           <p>${escapeHtml(q.explanation)}</p>
         </div>`
      : '';

    area.innerHTML = `
      <article class="q-page">
        <header class="q-page-head">
          <div class="q-stamp" aria-label="题号">
            <span class="q-stamp-num">${t2DetailCurrentIndex + 1}</span>
            <span class="q-stamp-label">第 ${t2DetailCurrentIndex + 1} 题</span>
          </div>
          <div class="q-page-meta">
            <span class="q-type-tag" data-type="${q.type}">${(TYPE_LABELS[q.type] || q.type)}</span>
            <span class="q-counter">${t2DetailCurrentIndex + 1} / ${total}</span>
          </div>
        </header>

        <div class="q-content">${escapeHtml(q.content || '')}</div>

        ${optionsHtml}

        ${answerText ? `<div class="q-answer-line">
          <span class="q-answer-mark">答</span>
          <span class="q-answer-text">${escapeHtml(answerText)}</span>
        </div>` : ''}

        ${explanationHtml}
      </article>
    `;
    this.initT2DetailSidebar();
    this.renderSidebar(document.getElementById('t2DetailSidebar'));

    // Restore scroll position after innerHTML replacement
    if (mainScroll) mainScroll.scrollTop = savedScroll;

    // Update prev/next button states
    const prevBtn = document.getElementById('t2DetailPrevBtn');
    const nextBtn = document.getElementById('t2DetailNextBtn');
    const pagerCount = document.getElementById('t2DetailPagerCount');
    const idx = t2DetailCurrentIndex;
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === total - 1;
    if (pagerCount) pagerCount.textContent = `${idx + 1} / ${total}`;
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

    const totalInBank = t2DetailAllQuestions.length;
    let questionsHtml = '';
    for (const [qtype, questions] of Object.entries(questionsByType)) {
      if (!questions?.length) continue;
      const collapsed = t2DetailCollapsedTypes[qtype] ? ' collapsed' : '';
      const idx0 = t2DetailAllQuestions.findIndex(q => q.id === questions[0]?.id);
      const idx1 = t2DetailAllQuestions.findIndex(q => q.id === questions[questions.length - 1]?.id);
      questionsHtml += `<div class="type-section${collapsed}" data-type="${qtype}">
        <div class="type-header" data-toggle-type="${qtype}">
          <span class="type-header-name">${TYPE_LABELS_SHORT[qtype]}</span>
          <span class="type-header-count">${questions.length}</span>
          <i class="bi bi-chevron-down type-header-arrow"></i>
        </div>
        <div class="type-body">
          ${questions.map(q => {
            const c = (q.id === currentQid) ? 'question-circle current' : 'question-circle';
            const num = q.number || '';
            return `<div class="${c}" data-qid="${q.id}" title="#${num}">${num}</div>`;
          }).join('')}
        </div>
      </div>`;
    }

    // Save scroll position before DOM replacement
    const oldQuestionsDiv = container.querySelector('.exam-sidebar-questions');
    const savedSidebarScroll = oldQuestionsDiv ? oldQuestionsDiv.scrollTop : 0;

    container.innerHTML = `
      <header class="t2-toc-head">
        <div class="t2-toc-eyebrow">题  录</div>
        <div class="t2-toc-total">共 <strong>${totalInBank}</strong> 题</div>
      </header>
      <div class="exam-sidebar-questions">${questionsHtml}</div>
    `;

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

// === Read-only answer formatter (for t2/view 卷面) ===
function formatAnswerForRead(q) {
  if (!q) return '';
  const a = q.answer;
  if (a == null || a === '') return '';
  const opts = q.options;
  const isObj = opts && !Array.isArray(opts) && typeof opts === 'object';
  const isArr = Array.isArray(opts);
  if (q.type === 'single') {
    if (isObj) {
      const key = String(a).trim().toUpperCase();
      if (opts[key] != null) return `${key}. ${opts[key]}`;
      return String(a);
    }
    const arr = isArr ? opts : [];
    const i = parseInt(a);
    if (!isNaN(i) && arr[i - 1]) return `${toLetter(i)}. ${arr[i - 1]}`;
    return String(a);
  }
  if (q.type === 'multi') {
    if (isObj) {
      const labels = String(a).split(/[,，\s]+/).filter(Boolean).map(s => s.trim().toUpperCase());
      if (!labels.length) return String(a);
      return labels.map(l => `${l}. ${opts[l] || ''}`).join('　');
    }
    const arr = isArr ? opts : [];
    const idxs = String(a).split(/[,，\s]+/).filter(Boolean).map(s => parseInt(s)).filter(n => !isNaN(n));
    if (!idxs.length) return String(a);
    return idxs.map(i => `${toLetter(i)}. ${arr[i - 1] || ''}`).join('　');
  }
  if (q.type === 'tf') {
    return /^t|对|正确|true|√/i.test(String(a)) ? '对 · 正确' : '错 · 错误';
  }
  if (q.type === 'fill') {
    return String(a).split('|').join('　/　');
  }
  if (q.type === 'essay') {
    return String(a).split('\n').join('　');
  }
  return String(a);
}

function toLetter(n) {
  if (n >= 1 && n <= 26) return String.fromCharCode(64 + n);
  return String(n);
}

// === Read-only options renderer ===
// Supports both Array (["A", "B", "C"]) and Object ({A: "...", B: "...", C: "..."}) shapes
function renderReadOnlyOptions(q) {
  if (!q || !q.options) return '';
  const opts = q.options;
  // Object form: { A: '...', B: '...', ... }
  if (!Array.isArray(opts) && typeof opts === 'object') {
    const labels = Object.keys(opts);
    if (!labels.length) return '';
    const answer = String(q.answer || '').trim();
    const isMulti = q.type === 'multi';
    const correctLabels = isMulti
      ? answer.split(/[,，\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean)
      : [answer.toUpperCase()].filter(Boolean);
    const items = labels.map(label => {
      const isCorrect = correctLabels.includes(label.toUpperCase());
      const cls = isCorrect ? 'q-option q-option-readonly q-option-correct' : 'q-option q-option-readonly';
      return `
        <div class="${cls}">
          <span class="q-option-letter">${escapeHtml(label)}</span>
          <span class="q-option-text">${escapeHtml(opts[label] || '')}</span>
          ${isCorrect ? '<span class="q-option-mark" title="正确答案"><i class="bi bi-check2"></i> 答</span>' : ''}
        </div>
      `;
    }).join('');
    return `<div class="q-options">${items}</div>`;
  }
  // Array form: [text0, text1, ...] with numeric answers
  if (!Array.isArray(opts) || !opts.length) return '';
  const answer = String(q.answer || '').trim();
  const isMulti = q.type === 'multi';
  const correctIdxs = isMulti
    ? answer.split(/[,，\s]+/).map(s => parseInt(s)).filter(n => !isNaN(n))
    : [parseInt(answer)].filter(n => !isNaN(n));
  const items = opts.map((opt, i) => {
    const idx = i + 1;
    const isCorrect = correctIdxs.includes(idx);
    const cls = isCorrect ? 'q-option q-option-readonly q-option-correct' : 'q-option q-option-readonly';
    return `
      <div class="${cls}">
        <span class="q-option-letter">${toLetter(idx)}</span>
        <span class="q-option-text">${escapeHtml(opt)}</span>
        ${isCorrect ? '<span class="q-option-mark" title="正确答案"><i class="bi bi-check2"></i> 答</span>' : ''}
      </div>
    `;
  }).join('');
  return `<div class="q-options">${items}</div>`;
}

window._t2DetailPage = _t2DetailPage;
