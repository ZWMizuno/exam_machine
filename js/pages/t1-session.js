// === T1 Exam/Practice Session (Shared Answering UI) ===

let sessionState = null;
let sessionCurrentIndex = 0;
let sessionQuestionsByType = {};
let sessionAllQuestions = [];

const _t1SessionPage = {
  async render(container, params) {
    const user = getCurrentUser();
    // Try to restore existing session, or get from state
    let session = getState().currentExam;
    if (!session) {
      session = await getSessionByUser(user.id);
      if (session && !session.submitted) {
        // Detected a stored session — check if it's from a refresh (abandoned)
        if (sessionStorage.getItem('exam_active') === 'true') {
          sessionStorage.removeItem('exam_active');
          await deleteSessionByUser(user.id);
          setState({ currentExam: null });
          showToast('已退出考试/练习', 'info');
          location.hash = '#/t1';
          return;
        }
      }
      if (!session || session.submitted) {
        showToast('没有活跃的考试/练习', 'warning');
        location.hash = '#/t1';
        return;
      }
      setState({ currentExam: session });
    }

    // Set flag so refresh will be detected as abandoned
    sessionStorage.setItem('exam_active', 'true');

    sessionState = session;
    sessionAllQuestions = session.questions;
    sessionCurrentIndex = 0;

    // Build questionsByType map
    sessionQuestionsByType = {};
    for (const t of QUESTION_TYPES) {
      sessionQuestionsByType[t] = sessionAllQuestions.filter(q => q.type === t);
    }

    // Find first unanswered question
    const firstUnanswered = sessionAllQuestions.findIndex(q => {
      const ua = session.userAnswers[q.questionId];
      return ua === undefined || ua === null || ua === '';
    });
    if (firstUnanswered >= 0) sessionCurrentIndex = firstUnanswered;

    this.renderSessionUI(container);
    this.setupTimer();
    this.showQuestion();

    // Prevent accidental refresh/close during active session
    this._beforeUnload = (e) => { e.preventDefault(); e.returnValue = '重新加载站点？\n刷新会导致考试退出'; };
    window.addEventListener('beforeunload', this._beforeUnload);

    // Keyboard navigation
    this._t1KeyHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (sessionCurrentIndex > 0) { sessionCurrentIndex--; _t1SessionPage.showQuestion(); }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (sessionCurrentIndex < sessionAllQuestions.length - 1) { sessionCurrentIndex++; _t1SessionPage.showQuestion(); }
      }
    };
    document.addEventListener('keydown', this._t1KeyHandler);
  },

  renderSessionUI(container) {
    const isExam = sessionState.type === 'exam';
    container.innerHTML = `
      <div class="exam-layout">
        <div class="exam-sidebar-col">
          <div class="exam-sidebar" id="examSidebar"></div>
        </div>
        <div class="exam-main-col">
          <div id="examTimerBar"></div>
          <div class="exam-main-scroll">
            <div class="question-area" id="questionArea"></div>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-3">
            <div>
              <button class="btn btn-outline-primary me-2" id="btnPrev" onclick="_t1SessionPage.navPrev()"><i class="bi bi-chevron-left"></i> 上一题</button>
              <button class="btn btn-outline-primary" id="btnNext" onclick="_t1SessionPage.navNext()">下一题 <i class="bi bi-chevron-right"></i></button>
            </div>
            <button class="btn btn-danger" id="btnEnd" onclick="_t1SessionPage.endSession()"><i class="bi bi-stop-circle me-1"></i>结束${isExam ? '考试' : '练习'}</button>
            <button class="btn btn-success btn-lg" id="btnSubmit" onclick="_t1SessionPage.submitSession()"><i class="bi bi-check-lg me-1"></i>提交试卷</button>
          </div>
        </div>
      </div>`;

    // Sidebar navigation callback
    window._onSidebarNavigate = (qid) => {
      const idx = sessionAllQuestions.findIndex(q => q.questionId === qid);
      if (idx >= 0) { sessionCurrentIndex = idx; _t1SessionPage.showQuestion(); }
    };

    // Instant feedback toggle callback
    window._onFeedbackToggle = (checked) => {
      sessionState.instantFeedback = checked;
      updateSidebarFeedback(checked);
      _t1SessionPage.renderSidebar();
      _t1SessionPage.showQuestion();
    };

    this.renderSidebar();
  },

  renderSidebar() {
    const sidebar = document.getElementById('examSidebar');
    if (!sidebar) return;
    initSidebar(sessionQuestionsByType, sessionState.userAnswers, sessionState.type, sessionState.instantFeedback);
    renderSidebar(sidebar, sessionAllQuestions[sessionCurrentIndex]?.questionId);
  },

  setupTimer() {
    const timerBar = document.getElementById('examTimerBar');
    if (!timerBar) return;

    const isExam = sessionState.type === 'exam';

    if (isExam) {
      const elapsed = sessionState.elapsedSeconds || 0;
      startExamTimer(
        sessionState.durationSeconds,
        (remaining) => { timerBar.innerHTML = renderTimerBar(remaining, 'exam'); },
        () => {
          showToast('考试时间到，系统将自动提交', 'warning');
          setTimeout(() => _t1SessionPage.submitSession(), 1000);
        },
        elapsed
      );
    } else {
      startPracticeTimer((elapsed) => { timerBar.innerHTML = renderTimerBar(elapsed, 'practice'); });
    }
  },

  showQuestion() {
    if (sessionAllQuestions.length === 0) return;
    const idx = sessionCurrentIndex;
    const q = sessionAllQuestions[idx];

    const area = document.getElementById('questionArea');
    if (!area) return;

    const userAnswer = sessionState.userAnswers[q.questionId];
    const isExam = sessionState.type === 'exam';

    area.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="text-muted">${idx + 1} / ${sessionAllQuestions.length}</span>
        ${!isExam ? `<div class="form-check form-switch d-inline-block">
          <input class="form-check-input" type="checkbox" id="instantFeedbackInline" ${sessionState.instantFeedback ? 'checked' : ''}>
          <label class="form-check-label small" for="instantFeedbackInline">即时纠错</label>
        </div>` : ''}
      </div>
      ${renderQuestion({
        ...q,
        options: q.options,
        answer: q.displayAnswer !== undefined ? q.displayAnswer : q.answer
      }, {
        readOnly: false,
        showAnswer: false,
        userAnswer,
        instantFeedback: false,
        correctStreak: -1,
        sessionNumber: q.sessionNumber
      })}
      <div class="text-center text-muted mt-2" style="font-size:0.8rem"><i class="bi bi-keyboard me-1"></i>键盘 ← → 键可切换题目</div>`;

    // Option click handlers
    if (q.type === 'single' || q.type === 'multi' || q.type === 'tf') {
      let autoAdvancePending = false;
      area.querySelectorAll('.option-item').forEach(item => {
        item.addEventListener('click', () => {
          if (q.type === 'single' || q.type === 'tf') {
            area.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            this.saveAnswer(q.questionId, item.dataset.value);
            // Auto-advance after brief delay (guard against rapid clicks)
            if (!autoAdvancePending && sessionCurrentIndex < sessionAllQuestions.length - 1) {
              autoAdvancePending = true;
              setTimeout(() => {
                sessionCurrentIndex++;
                _t1SessionPage.showQuestion();
              }, 200);
            }
          } else if (q.type === 'multi') {
            item.classList.toggle('selected');
            const selected = area.querySelectorAll('.option-item.selected');
            const vals = Array.from(selected).map(el => el.dataset.value).sort();
            this.saveAnswer(q.questionId, vals.join(''));
          }
        });
      });
    }

    // Fill blank / essay input handlers
    area.querySelectorAll('input, textarea').forEach(inp => {
      inp.addEventListener('change', () => {
        if (q.type === 'fill') {
          const inputs = area.querySelectorAll('input');
          const vals = Array.from(inputs).map(i => i.value);
          this.saveAnswer(q.questionId, vals);
        } else if (q.type === 'essay') {
          this.saveAnswer(q.questionId, inp.value);
        }
      });
    });

    // Inline feedback toggle
    const inlineToggle = document.getElementById('instantFeedbackInline');
    if (inlineToggle) {
      inlineToggle.addEventListener('change', () => {
        sessionState.instantFeedback = inlineToggle.checked;
        updateSidebarFeedback(inlineToggle.checked);
        this.renderSidebar();
        this.showQuestion();
      });
    }

    // Update nav buttons
    document.getElementById('btnPrev').disabled = idx === 0;
    document.getElementById('btnNext').disabled = idx === sessionAllQuestions.length - 1;

    this.renderSidebar();
  },

  saveAnswer(questionId, value) {
    sessionState.userAnswers[questionId] = value;
    updateSidebarAnswers(sessionState.userAnswers);
    this.renderSidebar();
    // Persist to DB (debounced)
    this.debouncedSave();
  },

  _saveTimeout: null,
  debouncedSave() {
    if (this._saveTimeout) clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(async () => {
      await saveSession(sessionState);
    }, 500);
  },

  navPrev() {
    if (sessionCurrentIndex > 0) { sessionCurrentIndex--; this.showQuestion(); }
  },

  navNext() {
    if (sessionCurrentIndex < sessionAllQuestions.length - 1) { sessionCurrentIndex++; this.showQuestion(); }
  },

  async submitSession() {
    const unanswered = sessionAllQuestions.filter(q => {
      const ua = sessionState.userAnswers[q.questionId];
      return ua === undefined || ua === null || ua === '';
    });

    let message = '确认提交试卷吗？';
    if (unanswered.length > 0) {
      message += `\n\n⚠ 还有 ${unanswered.length} 道题未作答：\n${unanswered.map(q => `#${q.sessionNumber} ${TYPE_LABELS_SHORT[q.type]}`).slice(0, 10).join('、')}${unanswered.length > 10 ? '...' : ''}`;
    }

    const confirmed = await showConfirm('提交试卷', message, '确认提交', '继续检查');
    if (!confirmed) return;

    this._removeBeforeUnload();
    sessionStorage.removeItem('exam_active');
    stopTimer();

    // Capture elapsed time before recording
    sessionState.elapsedSeconds = getElapsedSeconds();

    // Score
    const scoreResult = scoreSession(sessionState);

    // Record results
    await recordResults(sessionState, scoreResult);

    // Mark submitted
    sessionState.submitted = true;
    await saveSession(sessionState);
    await deleteSessionByUser(sessionState.userId);
    setState({ currentExam: null });

    // Show results
    const isExam = sessionState.type === 'exam';
    const passed = isExam && scoreResult.totalScore >= sessionState.passScore;

    let resultsHtml = `
      <div class="text-center mb-3">
        <h4>${isExam ? '考试' : '练习'}结果</h4>
        ${isExam ? `<h2 class="${passed ? 'text-success' : 'text-danger'}">${scoreResult.totalScore} / ${sessionState.totalScore}</h2>
        <p>${passed ? '<span class="badge bg-success fs-6">及格</span>' : '<span class="badge bg-danger fs-6">未及格</span>'}（及格线：${sessionState.passScore} 分）</p>` : ''}
        <p class="text-muted">正确 ${scoreResult.correctCount} / ${scoreResult.totalQuestions} 题</p>
      </div>`;

    // Show wrong answers
    if (scoreResult.wrongQuestionIds.length > 0) {
      resultsHtml += `<h6>错题及正确答案：</h6><div class="list-group">`;
      for (const qid of scoreResult.wrongQuestionIds) {
        const q = sessionAllQuestions.find(sq => sq.questionId === qid);
        if (!q) continue;
        const ua = sessionState.userAnswers[q.questionId];
        resultsHtml += `<div class="list-group-item">
          <div class="fw-bold">#${q.sessionNumber} ${TYPE_LABELS_SHORT[q.type]}</div>
          <div>${escapeHtml(q.content)}</div>
          <div class="text-danger small">你的答案：${formatUserAnswer(ua, q.type)}</div>
          <div class="text-success small">正确答案：${formatCorrectAnswer(q.answer, q.type)}</div>
        </div>`;
      }
      resultsHtml += `</div>`;
    } else {
      resultsHtml += `<div class="text-center text-success"><i class="bi bi-emoji-smile fs-1"></i><p class="mt-2">全部正确！</p></div>`;
    }

    const { result } = showModal('作答结果', resultsHtml, [{ text: '返回', cls: 'btn-primary' }], 'lg');
    await result;
    location.hash = '#/t1';
  },

  async endSession() {
    const confirmed = await showConfirm('结束作答', '确定要结束吗？进度将丢失。', '确认结束', '继续作答', true);
    if (!confirmed) return;

    this._removeBeforeUnload();
    sessionStorage.removeItem('exam_active');
    stopTimer();
    await deleteSessionByUser(sessionState.userId);
    setState({ currentExam: null });
    sessionState = null;
    location.hash = '#/t1';
  },

  _removeBeforeUnload() {
    if (this._beforeUnload) {
      window.removeEventListener('beforeunload', this._beforeUnload);
      this._beforeUnload = null;
    }
  },

  async destroy() {
    this._removeBeforeUnload();
    if (this._t1KeyHandler) {
      document.removeEventListener('keydown', this._t1KeyHandler);
      this._t1KeyHandler = null;
    }
    stopTimer();
    if (sessionState && !sessionState.submitted) {
      sessionState.elapsedSeconds = getElapsedSeconds();
      await saveSession(sessionState);
    }
  }
};

window._t1SessionPage = _t1SessionPage;

function formatUserAnswer(ua, type) {
  if (ua === null || ua === undefined || ua === '') return '(未作答)';
  switch (type) {
    case 'single': return ua;
    case 'multi': return ua.split('').join(', ');
    case 'tf': return ua === 'true' ? '正确' : '错误';
    case 'fill': return Array.isArray(ua) ? ua.join(', ') : ua;
    case 'essay': return ua.length > 50 ? ua.slice(0, 50) + '...' : ua;
    default: return String(ua);
  }
}
