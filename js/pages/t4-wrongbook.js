// Color schemes: logo, text, bookmark, book, name
// 高端经典（indices 0-4）
const SKIN_CLASSIC = [
  { logo: '#9FE7E6', text: '#E8FBFF', bookmark: '#156B8C', book: '#052228', name: '幽蓝经典' },
  { logo: '#64A1C0', text: '#E7D2BF', bookmark: '#FF6357', book: '#2E2E2E', name: '墨韵经典' },
  { logo: '#23A8A7', text: '#F46A6A', bookmark: '#053154', book: '#181818', name: '朱砂古典' },
  { logo: '#FF6054', text: '#FFDCAC', bookmark: '#5B889F', book: '#292929', name: '金秋流金' },
  { logo: '#FCC96E', text: '#2E9C91', bookmark: '#136058', book: '#132432', name: '翠玉古韵' },
];
// 质感节日风（indices 5-19）
const SKIN_FESTIVE = [
  { logo: '#053154', text: '#FFFFFF', bookmark: '#5A5750', book: '#F05654', name: '雪夜初雪' },
  { logo: '#C7371D', text: '#FCDC93', bookmark: '#185A56', book: '#4D262B', name: '暖阳如沐' },
  { logo: '#F05654', text: '#D9AE84', bookmark: '#C0732F', book: '#200E02', name: '暮云流金' },
  { logo: '#D1A1BA', text: '#A6D4D6', bookmark: '#024B5E', book: '#841C3C', name: '玫瑰古堡' },
  { logo: '#EC9B7A', text: '#F8C761', bookmark: '#203822', book: '#595182', name: '焦糖暖忆' },
  { logo: '#A92A01', text: '#3E5626', bookmark: '#F4D376', book: '#F3CDA8', name: '檀红印记' },
  { logo: '#9B8037', text: '#9C2C21', bookmark: '#E4B0B7', book: '#FEC1AE', name: '赭红印记' },
  { logo: '#3A4B5B', text: '#061B3A', bookmark: '#F3CDA8', book: '#97D4F1', name: '灰蓝暮色' },
  { logo: '#B9502B', text: '#8D2922', bookmark: '#FFA279', book: '#FFC5CD', name: '砖红盐系' },
  { logo: '#145750', text: '#FCC96E', bookmark: '#212F3A', book: '#2D8A80', name: '翠绿流金' },
  { logo: '#9B8BA6', text: '#E3B0B7', bookmark: '#2A1943', book: '#881C3C', name: '紫檀古韵' },
  { logo: '#A85253', text: '#1C2C58', bookmark: '#CB7761', book: '#FFC4C2', name: '丁香月色' },
];
// 温柔活泼（indices 20-26，共7个）
const SKIN_GENTLE = [
  { logo: '#B4CCD2', text: '#F0DC84', bookmark: '#F7F7E0', book: '#79A3CE', name: '春日花园' },
  { logo: '#3D7695', text: '#C85E3D', bookmark: '#DDB355', book: '#DFC7B4', name: '慵懒海洋' },
  { logo: '#A4C2CA', text: '#B05553', bookmark: '#3B567F', book: '#CAA4A3', name: '复古小镇' },
  { logo: '#95C3BE', text: '#DA6790', bookmark: '#AEBE6C', book: '#ECB4A4', name: '浪漫花墙' },
  { logo: '#C5E8E0', text: '#6B5B95', bookmark: '#F7CAC9', book: '#92A8D1', name: '紫罗兰' },
  { logo: '#FFE4C4', text: '#2F5D62', bookmark: '#FFE4B5', book: '#5E8C7B', name: '琥珀森林' },
  { logo: '#B0C4DE', text: '#FFB6C1', bookmark: '#E6E6FA', book: '#DDA0DD', name: '薰衣草之恋' },
];
// 甜美清新（indices 27-32，共6个）
const SKIN_SWEET = [
  { logo: '#F9F4EA', text: '#8D6C63', bookmark: '#FCD3D5', book: '#CFE4DD', name: '薄荷曼波' },
  { logo: '#B5DAE9', text: '#63BAD9', bookmark: '#CCE7D9', book: '#CAEBED', name: '瓦尔登湖' },
  { logo: '#4663ac', text: '#f3dd87', bookmark: '#ee8984', book: '#79bfe0', name: '美式复古' },
  { logo: '#B9D9EA', text: '#EFE4D4', bookmark: '#F8819B', book: '#F5C7C9', name: '先帝最爱' },
  { logo: '#E4F6A9', text: '#FF82A2', bookmark: '#BDDE93', book: '#FED0D6', name: '青提芭乐' },
  { logo: '#CADEC3', text: '#225DAB', bookmark: '#CBAF98', book: '#95B4E0', name: '椰风海岛' },
  { logo: '#F1D996', text: '#779B84', bookmark: '#B69F8A', book: '#C8D4C0', name: '浮光跃金' },
  { logo: '#C5863C', text: '#FAE593', bookmark: '#849C4D', book: '#FE8F29', name: '橘子汽水' },
  { logo: '#EFE4D4', text: '#302B58', bookmark: '#9078AC', book: '#B6A9C8', name: '海盐葡萄' },
];
// 完整数组（供通用查表，indices 0-32）
const BOOK_COLOR_SCHEMES = [...SKIN_CLASSIC, ...SKIN_FESTIVE, ...SKIN_GENTLE, ...SKIN_SWEET];

// 暴露 name 数组供 db.js 使用（避免硬编码重复）
window._SKIN_CLASSIC_NAMES = SKIN_CLASSIC.map(s => s.name);
window._SKIN_FESTIVE_NAMES = SKIN_FESTIVE.map(s => s.name);
window._SKIN_GENTLE_NAMES  = SKIN_GENTLE.map(s  => s.name);
window._SKIN_SWEET_NAMES   = SKIN_SWEET.map(s  => s.name);

// 重新构建 SKIN_DISPLAY_NAMES（覆盖 db.js 加载时的空值）
window.SKIN_DISPLAY_NAMES = [
  ...window._SKIN_CLASSIC_NAMES,
  ...window._SKIN_FESTIVE_NAMES,
  ...window._SKIN_GENTLE_NAMES,
  ...window._SKIN_SWEET_NAMES,
];


function getBookmarkTextColor(bookmarkHex) {
  const r = parseInt(bookmarkHex.slice(1, 3), 16);
  const g = parseInt(bookmarkHex.slice(3, 5), 16);
  const b = parseInt(bookmarkHex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#1a1a1a' : '#ffffff';
}

// 印文色 — 跟 getBookmarkTextColor 一样的 luma 阈值，但阈值稍微高一点
// 因为 logo 色常更浅（多用 #FCC96E/#9FE7E6 这种亮色作点缀）
function getLogoTextColor(logoHex) {
  const r = parseInt(logoHex.slice(1, 3), 16);
  const g = parseInt(logoHex.slice(3, 5), 16);
  const b = parseInt(logoHex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? '#1a1a1a' : '#ffffff';
}

let t4ReviewEngine = null;
let t4DetailAllQuestions = [];
let t4DetailQuestionsByType = {};
let t4DetailCurrentIndex = 0;
let t4DetailCollapsedTypes = {};
let t4DetailSearchQuery = '';
let _t4DetailInitialized = false;

const _t4WrongbookPage = {
  async render(container, params) {
    const hash = location.hash.slice(1);
    const hashPath = hash.split('?')[0];
    if (hashPath.startsWith('/t4/') && hashPath.endsWith('/review')) {
      await this.renderReview(container, params);
    } else if (params.bankId) {
      await this.renderDetail(container, params);
    } else {
      await this.renderGrid(container);
    }
  },

  async renderGrid(container) {
    document.getElementById('app-content').classList.add('store-bg');
    const user = getCurrentUser();
    const books = await getDistinctWrongBanks(user.id);

    if (books.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="bi bi-book"></i><p>案上空空，去考一场吧</p><a href="#/t1" class="btn-seal">去贡院</a></div>`;
      return;
    }

    setHeaderActions('');

    function renderBookCards() {
      var html = '';
      for (var i = 0; i < books.length; i++) {
        var b = books[i];
        var scheme = BOOK_COLOR_SCHEMES[b.colorIndex != null ? b.colorIndex : i % BOOK_COLOR_SCHEMES.length];
        var bmText = getBookmarkTextColor(scheme.bookmark);
        var logoText = getLogoTextColor(scheme.logo);
        html += '<div class="book-wrapper">' +
          '<div class="book-card" style="--logo:' + scheme.logo + ';--text:' + scheme.text + ';--bookmark:' + scheme.bookmark + ';--book:' + scheme.book + ';--bm-text:' + bmText + ';--logo-text:' + logoText + '" onclick="location.hash=\'#/t4/' + b.bankId + '\'">' +
            '<div class="book-logo" aria-hidden="true">' + escapeHtml((b.bankName || '卷').trim().charAt(0) || '卷') + '</div>' +
            '<div class="book-body">' +
              '<div class="book-name">' + escapeHtml(b.bankName) + '</div>' +
                          '</div>' +
            '<div class="book-bookmark"></div>' +
          '</div>' +
          '<div class="book-shelf"></div>' +
          '<div class="book-label" onclick="t4OpenSkinPopup(this,' + b.bankId + ')" title="点击更换皮肤"><i class="bi bi-palette-fill"></i><span>' + escapeHtml(BOOK_COLOR_SCHEMES[b.colorIndex != null ? b.colorIndex : i % BOOK_COLOR_SCHEMES.length].name) + '</span></div>' +
        '</div>';
      }
      document.getElementById('t4BookGrid').innerHTML = html;
    }

    container.innerHTML = '<div style="display:flex;flex-direction:column;gap:0.5rem;padding:0">' +
        '<p style="font-family:var(--font-hand);color:var(--ink-faint);margin:0 0 8px;letter-spacing:0.05em">每本书收录一本卷宗的错题。点书阅卷，点名牌换皮。</p>' +
        '<div class="book-grid" id="t4BookGrid"></div>' +
      '</div>';

    renderBookCards();
  },


  async renderDetail(container, params) {
    const bankId = parseInt(params.bankId);
    const bank = await getBankById(bankId);
    if (!bank) { showToast('题库不存在', 'error'); location.hash = '#/t4'; return; }
    setState({ _bankName: bank.name });

    const user = getCurrentUser();
    const wrongQs = await getWrongQuestionsByUserAndBank(user.id, bankId);

    // Sort by type order then by number
    const typeOrder = { single: 0, multi: 1, tf: 2, fill: 3, essay: 4 };
    wrongQs.sort((a, b) => {
      const ta = typeOrder[a.type] ?? 99;
      const tb = typeOrder[b.type] ?? 99;
      if (ta !== tb) return ta - tb;
      return (a.number || 0) - (b.number || 0);
    });

    // Build questions by type for sidebar
    t4DetailAllQuestions = wrongQs;
    t4DetailQuestionsByType = {};
    for (const t of QUESTION_TYPES) {
      t4DetailQuestionsByType[t] = wrongQs.filter(q => q.type === t);
    }
    t4DetailCurrentIndex = 0;
    _t4DetailInitialized = false;

    setHeaderActions(`
      <a href="#/t4" class="btn-tag" style="text-decoration:none"><i class="bi bi-arrow-left"></i> 返错题架</a>
      <button class="btn-seal btn-seal-jade" onclick="t4OpenReviewModal(${bankId})"><i class="bi bi-lightbulb me-1"></i>扫盲</button>
    `);

    const firstChar = (bank.name || '卷').trim().charAt(0) || '卷';

    // 题型统计 (复用 t2/view 的 TYPE_META)
    const TYPE_META = {
      single: { label: '单选', color: 'var(--jade)', icon: '◉' },
      multi:  { label: '多选', color: '#4A7B95',     icon: '◎' },
      tf:     { label: '判断', color: 'var(--gold)',  icon: '⊕' },
      fill:   { label: '填空', color: '#1B7A4E',     icon: '◇' },
      essay:  { label: '问答', color: '#7C3AED',     icon: '✎' },
    };
    const counts = wrongQs.reduce((acc, q) => { acc[q.type] = (acc[q.type] || 0) + 1; return acc; }, {});
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
    const totalWrong = wrongQs.reduce((sum, q) => sum + (q.wrongCount || 1), 0);

    container.innerHTML = `
      <div class="bank-cover">
        <div class="bank-cover-seal" aria-hidden="true">${escapeHtml(firstChar)}</div>
        <div class="bank-cover-text">
          <div class="bank-cover-eyebrow">错  题  录  ·  拾  遗</div>
          <h2 class="bank-cover-title">《${escapeHtml(bank.name)}》错题本</h2>
          <p class="bank-cover-meta" id="t4DetailCount">共 <strong>${wrongQs.length}</strong> 道 · 累计错 <strong>${totalWrong}</strong> 次</p>
        </div>
        <div class="bank-cover-stats">${statChips.join('')}</div>
      </div>

      <div class="t2-search-row">
        <div class="input-group">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control" id="t4DetailSearch" placeholder="寻错 · 题干关键词..." value="${escapeHtml(t4DetailSearchQuery)}">
          <button class="btn-icon-jade" id="t4ClearSearch" title="清空" style="${t4DetailSearchQuery ? '' : 'display:none'}">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>

      <div class="exam-layout exam-layout--no-scroll">
        <aside class="exam-sidebar-col">
          <div class="exam-sidebar" id="t4DetailSidebar"></div>
        </aside>
        <section class="exam-main-col">
          <div class="exam-main-scroll">
            <div class="question-area" id="t4DetailMain"></div>
          </div>
          <div class="exam-main-foot">
            <div class="exam-pager">
              <button class="btn-tag" id="t4DetailPrevBtn" ${t4DetailCurrentIndex === 0 ? 'disabled' : ''} title="上一题 (←)"><i class="bi bi-chevron-left"></i> 上一题</button>
              <span class="exam-pager-counter" id="t4DetailPagerCount">${t4DetailCurrentIndex + 1} / ${wrongQs.length || 0}</span>
              <button class="btn-tag" id="t4DetailNextBtn" ${t4DetailCurrentIndex === (wrongQs.length - 1) ? 'disabled' : ''} title="下一题 (→)">下一题 <i class="bi bi-chevron-right"></i></button>
              <button class="btn-tag t4-remove-btn" id="t4DetailDeleteBtn" title="从错题本移除此题"><i class="bi bi-trash"></i> 移除</button>
              <span class="t2-pager-hint"><i class="bi bi-keyboard"></i> ← / → 翻页</span>
            </div>
          </div>
        </section>
      </div>`;

    this.initT4DetailSidebar();
    this.renderT4DetailSidebar(document.getElementById('t4DetailSidebar'));
    this.showT4DetailQuestion();

    // Keyboard navigation
    this._t4KeyHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (t4DetailCurrentIndex > 0) {
          t4DetailCurrentIndex--;
          _t4WrongbookPage.showT4DetailQuestion();
          const sb = document.getElementById('t4DetailSidebar');
          if (sb) _t4WrongbookPage.renderT4DetailSidebar(sb);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (t4DetailCurrentIndex < t4DetailAllQuestions.length - 1) {
          t4DetailCurrentIndex++;
          _t4WrongbookPage.showT4DetailQuestion();
          const sb = document.getElementById('t4DetailSidebar');
          if (sb) _t4WrongbookPage.renderT4DetailSidebar(sb);
        }
      }
    };
    document.addEventListener('keydown', this._t4KeyHandler);

    // Wire up search
    this._t4BindSearch(bankId);
  },

  _t4BindSearch(bankId) {
    const searchInput = document.getElementById('t4DetailSearch');
    const clearBtn = document.getElementById('t4ClearSearch');
    if (!searchInput) return;

    const applyFilter = (rawQ) => {
      const q = rawQ.trim().toLowerCase();
      t4DetailSearchQuery = q;
      if (clearBtn) clearBtn.style.display = q ? 'inline-flex' : 'none';

      // Filter in place (no DB roundtrip needed for read-only search by content)
      if (!q) {
        // Reset to full list — we need to keep a snapshot
        if (this._t4FullList && this._t4FullList.length) {
          t4DetailAllQuestions = this._t4FullList.slice();
          t4DetailQuestionsByType = {};
          for (const t of QUESTION_TYPES) {
            t4DetailQuestionsByType[t] = t4DetailAllQuestions.filter(x => x.type === t);
          }
        }
      } else {
        const filtered = (this._t4FullList || t4DetailAllQuestions).filter(wq => {
          return (wq.content || '').toLowerCase().includes(q)
            || (wq.options || []).some(o => (o || '').toLowerCase().includes(q));
        });
        t4DetailAllQuestions = filtered;
        t4DetailQuestionsByType = {};
        for (const t of QUESTION_TYPES) {
          t4DetailQuestionsByType[t] = filtered.filter(x => x.type === t);
        }
      }
      t4DetailCurrentIndex = 0;
      _t4DetailInitialized = false;
      const sidebar = document.getElementById('t4DetailSidebar');
      if (sidebar) this.renderT4DetailSidebar(sidebar);
      this.showT4DetailQuestion();
    };

    // Snapshot full list for search reset
    if (!this._t4FullList || this._t4FullList.length !== t4DetailAllQuestions.length) {
      this._t4FullList = t4DetailAllQuestions.slice();
    }

    searchInput.addEventListener('input', debounce((e) => applyFilter(e.target.value), 300));
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        applyFilter('');
      });
    }
  },

  // Show one question at a time, with prev/next navigation
  showT4DetailQuestion() {
    const area = document.getElementById('t4DetailMain');
    if (!area) return;

    // Save scroll position before innerHTML replacement
    const mainScroll = area.closest('.exam-main-scroll');
    const savedScroll = mainScroll ? mainScroll.scrollTop : 0;

    const total = t4DetailAllQuestions.length;
    if (total === 0) {
      area.innerHTML = '<div class="text-center text-muted py-4">暂无错题</div>';
      const sidebar = document.getElementById('t4DetailSidebar');
      if (sidebar) sidebar.innerHTML = '';
      const countEl = document.getElementById('t4DetailCount');
      if (countEl) countEl.textContent = '共 0 道错题';
      return;
    }

    // Clamp index
    if (t4DetailCurrentIndex >= total) t4DetailCurrentIndex = total - 1;
    if (t4DetailCurrentIndex < 0) t4DetailCurrentIndex = 0;

    const wq = t4DetailAllQuestions[t4DetailCurrentIndex];

    // 卷面 — 题号印（带错次）+ 题干 + 答案朱批 + 解析笺
    const answerText = formatAnswerForRead(wq);
    const optionsHtml = renderReadOnlyOptions(wq);
    const wrongCount = wq.wrongCount || 1;
    const lastWrong = wq.lastWrongAt ? new Date(wq.lastWrongAt).toLocaleDateString('zh-CN') : '';
    const explanationHtml = wq.explanation
      ? `<div class="q-explanation">
           <div class="q-explanation-label">解  笺</div>
           <p>${escapeHtml(wq.explanation)}</p>
         </div>`
      : '';

    area.innerHTML = `
      <article class="q-page q-page--wrong">
        <header class="q-page-head">
          <div class="q-stamp q-stamp--wrong" aria-label="题号">
            <span class="q-stamp-num">${t4DetailCurrentIndex + 1}</span>
            <span class="q-stamp-label">第 ${t4DetailCurrentIndex + 1} 题</span>
          </div>
          <div class="q-page-meta">
            <span class="q-wrong-badge" title="${wrongCount} 次答错${lastWrong ? '，最近 ' + lastWrong : ''}">
              <i class="bi bi-x-circle-fill"></i> 错 ${wrongCount} 次
            </span>
            <span class="q-type-tag" data-type="${wq.type}">${(TYPE_LABELS[wq.type] || wq.type)}</span>
            <span class="q-counter">${t4DetailCurrentIndex + 1} / ${total}</span>
          </div>
        </header>

        <div class="q-content">${escapeHtml(wq.content || '')}</div>

        ${optionsHtml}

        ${answerText ? `<div class="q-answer-line">
          <span class="q-answer-mark">答</span>
          <span class="q-answer-text">${escapeHtml(answerText)}</span>
        </div>` : ''}

        ${explanationHtml}
      </article>
    `;

    // Delete handler (now lives in the pager)
    const delBtn = document.getElementById('t4DetailDeleteBtn');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        const wqId = wq.id;
        await deleteWrongQuestion(wqId);

        // Remove from data arrays
        const arrIdx = t4DetailAllQuestions.findIndex(q => q.id === wqId);
        if (arrIdx >= 0) {
          const removed = t4DetailAllQuestions[arrIdx];
          t4DetailAllQuestions.splice(arrIdx, 1);
          t4DetailQuestionsByType[removed.type] = (t4DetailQuestionsByType[removed.type] || []).filter(q => q.id !== wqId);
        }

        // Adjust index: if last item was removed, go to previous
        if (t4DetailCurrentIndex >= t4DetailAllQuestions.length && t4DetailAllQuestions.length > 0) {
          t4DetailCurrentIndex = t4DetailAllQuestions.length - 1;
        }

        // Update count
        const countEl = document.getElementById('t4DetailCount');
        if (countEl) {
          const totalWrong = t4DetailAllQuestions.reduce((s, q) => s + (q.wrongCount || 1), 0);
          countEl.innerHTML = `共 <strong>${t4DetailAllQuestions.length}</strong> 道 · 累计错 <strong>${totalWrong}</strong> 次`;
        }

        // Re-render sidebar and current question
        const sidebar = document.getElementById('t4DetailSidebar');
        if (sidebar) _t4WrongbookPage.renderT4DetailSidebar(sidebar);
        _t4WrongbookPage.showT4DetailQuestion();

        showToast('已从错题本移除', 'success');
      });
    }

    // Prev/next buttons
    const prevBtn = document.getElementById('t4DetailPrevBtn');
    const nextBtn = document.getElementById('t4DetailNextBtn');
    const updatePager = () => {
      const idx = t4DetailCurrentIndex;
      const totalN = t4DetailAllQuestions.length;
      if (prevBtn) prevBtn.disabled = idx === 0;
      if (nextBtn) nextBtn.disabled = idx === totalN - 1;
      const pagerCount = document.getElementById('t4DetailPagerCount');
      if (pagerCount) pagerCount.textContent = `${idx + 1} / ${totalN}`;
    };
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (t4DetailCurrentIndex > 0) {
          t4DetailCurrentIndex--;
          _t4WrongbookPage.showT4DetailQuestion();
          const sidebar = document.getElementById('t4DetailSidebar');
          if (sidebar) _t4WrongbookPage.renderT4DetailSidebar(sidebar);
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (t4DetailCurrentIndex < t4DetailAllQuestions.length - 1) {
          t4DetailCurrentIndex++;
          _t4WrongbookPage.showT4DetailQuestion();
          const sidebar = document.getElementById('t4DetailSidebar');
          if (sidebar) _t4WrongbookPage.renderT4DetailSidebar(sidebar);
        }
      });
    }
    updatePager();

    // Update sidebar highlight
    const sidebar = document.getElementById('t4DetailSidebar');
    if (sidebar) _t4WrongbookPage.renderT4DetailSidebar(sidebar);

    // Restore scroll position after innerHTML replacement
    if (mainScroll) mainScroll.scrollTop = savedScroll;
  },

  // Initialize sidebar collapsed state once
  initT4DetailSidebar() {
    if (_t4DetailInitialized) return;

    const collapsedTypes = {};
    for (const [qtype, questions] of Object.entries(t4DetailQuestionsByType)) {
      collapsedTypes[qtype] = true;
    }
    const allQuestions = Object.values(t4DetailQuestionsByType).flat();
    if (allQuestions.length > 0) {
      const firstQ = allQuestions[0];
      for (const [qtype, questions] of Object.entries(t4DetailQuestionsByType)) {
        if (questions.some(q => q.questionId === firstQ.questionId)) {
          delete collapsedTypes[qtype];
          break;
        }
      }
    }
    t4DetailCollapsedTypes = collapsedTypes;
    _t4DetailInitialized = true;
  },

  // Render sidebar with type-grouped question circles for quick navigation
  renderT4DetailSidebar(container) {
    if (!container) return;

    const questionsByType = t4DetailQuestionsByType;
    const totalQuestions = t4DetailAllQuestions.length;
    if (totalQuestions === 0) {
      container.innerHTML = '';
      return;
    }

    const currentWq = t4DetailAllQuestions[t4DetailCurrentIndex];
    const currentQid = currentWq ? currentWq.questionId : null;

    // Auto-expand the type section containing the current question
    if (currentWq) {
      delete t4DetailCollapsedTypes[currentWq.type];
    }

    let html = '';

    for (const [qtype, questions] of Object.entries(questionsByType)) {
      if (!questions || questions.length === 0) continue;
      const collapsed = t4DetailCollapsedTypes[qtype] ? ' collapsed' : '';
      html += `<div class="type-section${collapsed}" data-type="${qtype}">
        <div class="type-header" data-toggle-type="${qtype}">
          <span class="type-header-name">${TYPE_LABELS_SHORT[qtype]}</span>
          <span class="type-header-count">${questions.length}</span>
          <i class="bi bi-chevron-down type-header-arrow"></i>
        </div>
        <div class="type-body">
          ${questions.map(q => {
            const cssClass = (q.questionId === currentQid) ? 'question-circle current' : 'question-circle';
            return `<div class="${cssClass}" data-qid="${q.questionId}" title="#${q.number} — 错${q.wrongCount || 1}次">${q.number}</div>`;
          }).join('')}
        </div>
      </div>`;
    }


    const totalInBook = t4DetailAllQuestions.length;
    const totalWrong = t4DetailAllQuestions.reduce((s, q) => s + (q.wrongCount || 1), 0);
    container.innerHTML = `
      <header class="t2-toc-head">
        <div class="t2-toc-eyebrow">错  题  录</div>
        <div class="t2-toc-total">共 <strong>${totalInBook}</strong> · 错 <strong>${totalWrong}</strong> 次</div>
      </header>
      <div class="exam-sidebar-questions">${html}</div>
    `;

    // Circle click handlers — navigate to the clicked question
    container.querySelectorAll('.question-circle').forEach(circle => {
      circle.addEventListener('click', () => {
        const qid = parseInt(circle.dataset.qid);
        const idx = t4DetailAllQuestions.findIndex(q => q.questionId === qid);
        if (idx >= 0) {
          t4DetailCurrentIndex = idx;
          _t4WrongbookPage.renderT4DetailSidebar(container);
          _t4WrongbookPage.showT4DetailQuestion();
        }
      });
    });

    // Collapse/expand type sections
    container.querySelectorAll('.type-header').forEach(header => {
      header.addEventListener('click', () => {
        const section = header.parentElement;
        section.classList.toggle('collapsed');
        const qtype = header.dataset.toggleType;
        t4DetailCollapsedTypes[qtype] = section.classList.contains('collapsed');
      });
    });
  },

  async renderReview(container, params) {
    const bankId = parseInt(params.bankId);
    const bank = await getBankById(bankId);
    setState({ _bankName: bank ? bank.name : '题库' });

    const user = getCurrentUser();
    // Get types from router-provided query params (if coming from modal)
    const typeParam = (params._query && params._query.types) || '';

    let selectedTypes;
    if (typeParam) {
      selectedTypes = typeParam.split(',');
    } else {
      // Fallback: all types present
      const allWQs = await getWrongQuestionsByUserAndBank(user.id, bankId);
      selectedTypes = [...new Set(allWQs.map(w => w.type))];
    }

    // Fetch wrong questions for selected types
    let allWQs = await getWrongQuestionsByUserAndBank(user.id, bankId);
    allWQs = allWQs.filter(w => selectedTypes.includes(w.type));

    if (allWQs.length === 0) {
      showToast('没有可扫盲的错题', 'warning');
      location.hash = `#/t4/${bankId}`;
      return;
    }

    // Initialize review engine with current index for one-at-a-time mode
    t4ReviewEngine = {
      pool: shuffle(allWQs),
      group: [],
      groupIndex: 0,
      cleared: 0,
      showingResult: false  // whether we're showing answer feedback
    };
    // Fill initial 5 into group
    t4ReviewEngine.group = t4ReviewEngine.pool.splice(0, Math.min(5, t4ReviewEngine.pool.length));
    // Make sure all questions have correctStreak initialized
    for (const wq of t4ReviewEngine.group) {
      if (wq.correctStreak === undefined) wq.correctStreak = 0;
    }

    await this.renderReviewUI(container, bankId);
  },

  async renderReviewUI(container, bankId) {
    const engine = t4ReviewEngine;
    const totalRemaining = engine.group.length + engine.pool.length;

    container.innerHTML = `
      <h4 class="mb-3">
        <a href="#/t4/${bankId}" class="text-decoration-none text-muted me-2"><i class="bi bi-arrow-left"></i></a>
        错题扫盲
      </h4>

      <div class="d-flex align-items-center gap-3 mb-3" id="t4StatusBar">
        <span class="badge bg-success fs-6"><i class="bi bi-check-circle me-1"></i>已清除 ${engine.cleared} 题</span>
        <span class="badge bg-secondary fs-6"><i class="bi bi-hourglass-split me-1"></i>剩余 ${totalRemaining} 题</span>
      </div>

      <div id="t4ReviewArea"></div>

      <div class="d-flex justify-content-between mt-3">
        <a href="#/t4/${bankId}" class="btn btn-outline-danger"><i class="bi bi-box-arrow-left me-1"></i>退出扫盲</a>
      </div>`;

    this.renderCurrentQuestion();
  },

  // Update the status bar with cleared/remaining counts
  updateReviewStatusBar() {
    const engine = t4ReviewEngine;
    if (!engine) return;
    const totalRemaining = engine.group.length + engine.pool.length;
    const el = document.getElementById('t4StatusBar');
    if (el) {
      el.innerHTML = `
        <span class="badge bg-success fs-6"><i class="bi bi-check-circle me-1"></i>已清除 ${engine.cleared} 题</span>
        <span class="badge bg-secondary fs-6"><i class="bi bi-hourglass-split me-1"></i>剩余 ${totalRemaining} 题</span>`;
    }
  },

  renderCurrentQuestion() {
    const engine = t4ReviewEngine;
    const area = document.getElementById('t4ReviewArea');
    if (!area) return;

    // Check if all done
    if (!engine || engine.group.length === 0) {
      area.innerHTML = `<div class="text-center py-5">
        <i class="bi bi-emoji-smile fs-1 text-success"></i>
        <h5 class="mt-2">扫盲完成！</h5>
        <p class="text-muted">共清除了 ${engine ? engine.cleared : 0} 道错题</p>
        <a href="#/t4/${location.hash.split('/')[2]}" class="btn btn-primary">返回错题本</a>
      </div>`;
      // Update status bar to show final result
      const statusEl = document.getElementById('t4StatusBar');
      if (statusEl) {
        statusEl.innerHTML = `<span class="badge bg-success fs-6"><i class="bi bi-trophy me-1"></i>共清除 ${engine ? engine.cleared : 0} 题</span>`;
      }
      return;
    }

    const wq = engine.group[engine.groupIndex];
    const idx = engine.groupIndex;
    const isResult = engine.showingResult;
    const type = wq.type;

    let answerHtml = '';
    if (isResult) {
      // Show result: correct answer highlighted, user selection shown
      const userAnswer = engine._lastUserAnswer;
      const isCorrect = engine._lastCorrect;
      const correctAnswer = wq.answer;

      // Build result display
      answerHtml += `<div class="alert ${isCorrect ? 'alert-success' : 'alert-danger'} py-2 text-center">${isCorrect ? '<i class="bi bi-check-circle me-1"></i>回答正确！' : '<i class="bi bi-x-circle me-1"></i>回答错误'}</div>`;

      if (!isCorrect) {
        answerHtml += `<div class="p-2 rounded mb-2" style="background:#e6f9f3;color:#0d6b3c;"><strong>正确答案：</strong>${formatCorrectAnswer(correctAnswer, type)}</div>`;
      }

      // Show selected options (read-only)
      answerHtml += this.renderReviewAnswerInput(wq, idx, true, isCorrect, correctAnswer);

      answerHtml += `<div class="text-center mt-3">
        <button class="btn btn-primary btn-lg" onclick="t4NextQuestion()">下一题 <i class="bi bi-arrow-right"></i></button>
      </div>`;
    } else {
      // Interactive answer input
      answerHtml += this.renderReviewAnswerInput(wq, idx, false, false, null);
      // Only show submit button for multi/fill/essay; single/tf auto-submit on click
      if (type === 'multi' || type === 'fill' || type === 'essay') {
        answerHtml += `<div class="text-center mt-3">
          <button class="btn btn-success btn-lg" id="t4SubmitBtn" onclick="t4SubmitAnswer()"><i class="bi bi-check-lg me-1"></i>提交答案</button>
        </div>`;
      }
    }

    area.innerHTML = `
      <div class="card">
        <div class="card-body p-4">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              ${typeBadge(wq.type)}
              <span class="badge bg-warning text-dark ms-1">错误 ${wq.wrongCount} 次</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <div class="streak-lights">
                <div class="streak-light ${wq.correctStreak >= 1 ? 'lit' : ''}"></div>
                <div class="streak-light ${wq.correctStreak >= 2 ? 'lit' : ''}"></div>
                <div class="streak-light ${wq.correctStreak >= 3 ? 'lit' : ''}"></div>
              </div>
              <button class="btn btn-sm btn-outline-primary btn-icon" onclick="t4SkipQuestion(${idx})" title="暂时跳过"><i class="bi bi-skip-forward"></i></button>
            </div>
          </div>
          <div class="question-content mb-3 fs-5">${escapeHtml(wq.content)}</div>
          ${answerHtml}
        </div>
      </div>`;

    // Bind option selection handlers (only in answer mode, not result mode)
    if (!isResult) {
      const type = wq.type;
      if (type === 'single' || type === 'tf') {
        area.querySelectorAll('.option-item').forEach(item => {
          item.addEventListener('click', () => {
            area.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            // Auto-submit for single/tf
            t4SubmitAnswer();
          });
        });
      } else if (type === 'multi') {
        area.querySelectorAll('.option-item').forEach(item => {
          item.addEventListener('click', () => {
            item.classList.toggle('selected');
          });
        });
      }
    }
  },

  renderReviewAnswerInput(wq, idx, readOnly, isCorrect, correctAnswer) {
    const type = wq.type;
    switch (type) {
      case 'single': {
        const opts = wq.options || {};
        const labels = Object.keys(opts).sort();
        return `<ul class="options-list">${labels.map(l => {
          let itemClass = 'option-item';
          if (readOnly) itemClass += ' no-hover';
          if (readOnly && l === correctAnswer) itemClass += ' correct';
          if (readOnly && isCorrect === false) {
            const ua = t4ReviewEngine._lastUserAnswer;
            if (l === ua) itemClass += ' wrong';
          }
          return `<li class="${itemClass}" data-value="${l}"><span class="option-letter">${l}</span><span>${escapeHtml(opts[l])}</span></li>`;
        }).join('')}</ul>`;
      }
      case 'tf': {
        // Show ✓/✗ instead of true/false; fixed order: 正确 first, 错误 second
        const opts = { 'true': '正确', 'false': '错误' };
        const labels = ['true', 'false'];
        return `<ul class="options-list">${labels.map(l => {
          let itemClass = 'option-item';
          if (readOnly) itemClass += ' no-hover';
          if (readOnly && l === correctAnswer) itemClass += ' correct';
          if (readOnly && isCorrect === false) {
            const ua = t4ReviewEngine._lastUserAnswer;
            if (l === ua) itemClass += ' wrong';
          }
          return `<li class="${itemClass}" data-value="${l}"><span class="option-letter">${l === 'true' ? '✓' : '✗'}</span><span>${opts[l]}</span></li>`;
        }).join('')}</ul>`;
      }
      case 'multi': {
        const opts = wq.options || {};
        const labels = Object.keys(opts).sort();
        const uaSet = new Set(t4ReviewEngine._lastUserAnswer || '');
        const caSet = new Set(correctAnswer || '');
        return `<ul class="options-list" data-multi="true">${labels.map(l => {
          let itemClass = 'option-item';
          if (readOnly) itemClass += ' no-hover';
          if (readOnly && caSet.has(l)) itemClass += ' correct';
          if (readOnly && !isCorrect && uaSet.has(l) && !caSet.has(l)) itemClass += ' wrong';
          return `<li class="${itemClass}" data-value="${l}"><span class="option-letter">${l}</span><span>${escapeHtml(opts[l])}</span></li>`;
        }).join('')}</ul>`;
      }
      case 'fill': {
        const blanks = wq.answer || [];
        const ua = t4ReviewEngine._lastUserAnswer || [];
        return blanks.map((ans, i) => {
          if (readOnly) {
            const correct = isCorrect === true || (Array.isArray(isCorrect) && isCorrect[i]);
            const cls = correct ? 'text-success' : 'text-danger';
            return `<div class="mb-1"><label class="form-label small fw-bold">第${i+1}空</label>
              <div><span class="${cls}">你的答案：${escapeHtml(ua[i] || '(未作答)')}</span></div>
              ${!correct ? `<div class="text-success">正确答案：${escapeHtml(ans)}</div>` : ''}
            </div>`;
          }
          return `<div class="mb-1"><label class="form-label small fw-bold">第${i+1}空</label><input type="text" class="form-control form-control-sm review-input" data-blank="${i}"></div>`;
        }).join('');
      }
      case 'essay': {
        if (readOnly) {
          return `<div>
            <div><span class="${isCorrect ? 'text-success' : 'text-danger'}">你的答案：${escapeHtml(t4ReviewEngine._lastUserAnswer || '(未作答)')}</span></div>
            ${!isCorrect ? `<div class="text-success">正确答案：${escapeHtml(correctAnswer)}</div>` : ''}
          </div>`;
        }
        return `<textarea class="form-control review-input" rows="3" placeholder="请输入答案"></textarea>`;
      }
      default:
        return '';
    }
  },

  async destroy() {
    document.getElementById('app-content').classList.remove('store-bg');
    _t4DetailInitialized = false;
    t4ReviewEngine = null;
    t4DetailAllQuestions = [];
    t4DetailQuestionsByType = {};
    t4DetailCurrentIndex = 0;
    t4DetailCollapsedTypes = {};
    if (this._t4KeyHandler) {
      document.removeEventListener('keydown', this._t4KeyHandler);
      this._t4KeyHandler = null;
    }
  }
};

window._t4WrongbookPage = _t4WrongbookPage;

// Global functions for T4
async function t4OpenReviewModal(bankId) {
  const user = getCurrentUser();
  const allWQs = await getWrongQuestionsByUserAndBank(user.id, bankId);
  const types = [...new Set(allWQs.map(w => w.type))];

  let modalHtml = '<p class="mb-3">选择要扫盲的题型：</p>';
  for (const t of types) {
    const count = allWQs.filter(w => w.type === t).length;
    modalHtml += `<div class="form-check"><input class="form-check-input t4-review-type" type="checkbox" value="${t}" id="rt_${t}" checked><label class="form-check-label" for="rt_${t}">${TYPE_LABELS[t]}（${count} 题）</label></div>`;
  }

  const { result } = showModal('选择扫盲题型', modalHtml, [
    { text: '取消', cls: 'btn-secondary' },
    { text: '开始扫盲', cls: 'btn-success' }
  ]);

  const idx = await result;
  if (idx === 1) {
    const selected = document.querySelectorAll('.t4-review-type:checked');
    const selectedTypes = Array.from(selected).map(cb => cb.value);
    if (selectedTypes.length === 0) { showToast('请至少选择一种题型', 'warning'); return; }
    location.hash = `#/t4/${bankId}/review?types=${selectedTypes.join(',')}`;
  }
}

// Submit answer for the current question
async function t4SubmitAnswer() {
  const engine = t4ReviewEngine;
  if (!engine || engine.group.length === 0 || engine.showingResult) return;

  const wq = engine.group[engine.groupIndex];
  const area = document.getElementById('t4ReviewArea');
  const type = wq.type;

  // Get user answer from the DOM
  let userAnswer;
  if (type === 'single' || type === 'tf') {
    const sel = area.querySelector('.option-item.selected');
    userAnswer = sel ? sel.dataset.value : null;
  } else if (type === 'multi') {
    const sels = area.querySelectorAll('.option-item.selected');
    userAnswer = Array.from(sels).map(el => el.dataset.value).sort().join('');
  } else if (type === 'fill') {
    userAnswer = Array.from(area.querySelectorAll('.review-input')).map(inp => inp.value);
  } else if (type === 'essay') {
    userAnswer = area.querySelector('.review-input')?.value || '';
  }

  if (userAnswer === null || userAnswer === undefined || userAnswer === '') {
    showToast('请先作答', 'warning');
    return;
  }

  const isCorrect = checkAnswer(userAnswer, wq.answer, type);

  // Store result for display
  engine._lastUserAnswer = userAnswer;
  engine._lastCorrect = isCorrect;
  engine.showingResult = true;
  if (isCorrect) {
    wq.correctStreak++;
    if (wq.correctStreak >= 3) {
      // Mastered! Remove from DB and group
      await deleteWrongQuestion(wq.id);
      engine.cleared++;
      engine.group.splice(engine.groupIndex, 1);
      // Fill from pool
      if (engine.pool.length > 0) {
        const newQ = engine.pool.shift();
        if (newQ.correctStreak === undefined) newQ.correctStreak = 0;
        engine.group.splice(engine.groupIndex, 0, newQ);
      } else {
        // No more in pool, adjust index
        if (engine.groupIndex >= engine.group.length && engine.group.length > 0) {
          engine.groupIndex = 0;
        }
      }
      engine.showingResult = false;  // Reset for the replacement question
      // Award 1 coin for mastering
      const user = getCurrentUser();
      await updateUserCoins(user.id, 1);
      emit('coins:updated');
      showToast('已掌握！连续正确3次，+1 硬币', 'success');
    } else {
      showToast(`正确！还需连续正确 ${3 - wq.correctStreak} 次`, 'success');
    }
  } else {
    wq.correctStreak = 0;
    wq.wrongCount++;
    await putWrongQuestion(wq);
    showToast('回答错误，连续正确计数已重置', 'warning');
  }

  // Re-render
  _t4WrongbookPage.updateReviewStatusBar();
  _t4WrongbookPage.renderCurrentQuestion();
}

// Move to next question
function t4NextQuestion() {
  const engine = t4ReviewEngine;
  if (!engine || engine.group.length === 0) return;

  engine.showingResult = false;

  // Move to next question in group (cycle)
  engine.groupIndex = (engine.groupIndex + 1) % engine.group.length;

  // If group is now empty, show completion
  if (engine.group.length === 0) {
    _t4WrongbookPage.updateReviewStatusBar();
    _t4WrongbookPage.renderCurrentQuestion();
    return;
  }

  _t4WrongbookPage.updateReviewStatusBar();
  _t4WrongbookPage.renderCurrentQuestion();
}

// Skip current question (move to next without affecting streak)
function t4SkipQuestion(idx) {
  const engine = t4ReviewEngine;
  if (!engine || engine.group.length === 0) return;
  if (engine.showingResult) {
    // If showing result, just go next
    t4NextQuestion();
    return;
  }
  // Just move to next
  engine.groupIndex = (engine.groupIndex + 1) % engine.group.length;
  _t4WrongbookPage.updateReviewStatusBar();
  _t4WrongbookPage.renderCurrentQuestion();
}

// Skin popup for wrongbook books
let _t4SkinPopupActive = null;

async function t4OpenSkinPopup(btn, bankId) {
  // Close any existing popup
  t4CloseSkinPopup();

  const user = getCurrentUser();
  const ownedSkins = await getUserOwnedSkins(user.id);
  const currentSkin = await getBankSkin(user.id, bankId);

  let itemsHtml = '';
  for (const idx of ownedSkins) {
    const scheme = BOOK_COLOR_SCHEMES[idx];
    const name = window.SKIN_DISPLAY_NAMES[idx];
    const active = idx === currentSkin ? ' active' : '';
    itemsHtml += `
      <div class="skin-popup-item${active}" data-idx="${idx}" onclick="t4ApplySkin(${bankId},${idx})" title="${name}">
        <div class="skin-popup-book" style="--book:${scheme.book};--bookmark:${scheme.bookmark}">
          <div class="skin-popup-bookmark"></div>
        </div>
        <div class="skin-popup-name">${name}</div>
      </div>`;
  }

  // Build popup and position it
  const popup = document.createElement('div');
  popup.className = 'skin-popup popup-right';
  popup.id = 't4SkinPopup';
  popup.innerHTML = `
    <div class="skin-popup-title">
      <span>选择皮肤</span>
      <button class="skin-popup-close" onclick="t4CloseSkinPopup()"><i class="bi bi-x"></i></button>
    </div>
    <div class="skin-popup-grid">${itemsHtml}</div>
  `;

  // Insert after the button's wrapper
  btn.closest('.book-wrapper').appendChild(popup);

  // Position adaptation: if popup goes off right edge, flip to left
  requestAnimationFrame(() => {
    const rect = popup.getBoundingClientRect();
    const vw = window.innerWidth;
    if (rect.right > vw - 10) {
      popup.classList.remove('popup-right');
      popup.classList.add('popup-left');
    }
    popup.classList.add('show');
  });

  _t4SkinPopupActive = popup;

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', t4CloseSkinPopupOutside, { once: true });
  }, 10);
}

function t4CloseSkinPopup() {
  const popup = document.getElementById('t4SkinPopup');
  if (popup) popup.remove();
  _t4SkinPopupActive = null;
}

function t4CloseSkinPopupOutside(e) {
  const popup = document.getElementById('t4SkinPopup');
  if (popup && !popup.contains(e.target) && !e.target.closest('.skin-select-btn')) {
    t4CloseSkinPopup();
  }
}

async function t4ApplySkin(bankId, colorIndex) {
  const user = getCurrentUser();
  await setBankSkin(user.id, bankId, colorIndex);
  t4CloseSkinPopup();
  showToast('皮肤已更换', 'success');

  // Refresh the grid to show new colors
  _t4WrongbookPage.renderGrid(document.getElementById('app-content'));
}
