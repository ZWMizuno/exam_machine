// === T1 Exam/Practice Session (Shared Answering UI) ===

const _t1SessionPage = {
  async render(container, params) {
    this._examExpired = false;
    const user = getCurrentUser();

    // Try to restore existing session, or get from state
    let session = getState().currentExam;
    if (!session) {
      // Check both exam session (userId) and practice session (userId_practice)
      let examSession = await getSessionByUser(user.id);
      let pracSession = await getSessionByUser(user.id + '_practice');
      // Prefer whichever is newer / has more recent startTime
      if (examSession && pracSession) {
        session = new Date(examSession.startTime) > new Date(pracSession.startTime) ? examSession : pracSession;
      } else {
        session = examSession || pracSession;
      }
      if (session && !session.submitted) {
        const storedType = sessionStorage.getItem('exam_active');
        // Detected a stored session — check if it's from a refresh (abandoned)
        if (storedType === 'exam' || storedType === 'practice') {
          sessionStorage.removeItem('exam_active');
          // If stored type doesn't match recovered session type, delete both
          if (storedType === 'exam' && pracSession) {
            await deleteSessionByUser(user.id + '_practice');
          }
          if (storedType === 'practice' && examSession) {
            await deleteSessionByUser(user.id);
          }
          if (storedType === 'exam' && examSession) {
            await deleteSessionByUser(user.id);
          }
          if (storedType === 'practice' && pracSession) {
            await deleteSessionByUser(user.id + '_practice');
          }
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

    // Initialize instance state
    this._sessionState = session;
    this._sessionAllQuestions = session.questions;
    this._sessionCurrentIndex = 0;

    // Build questionsByType map
    this._sessionQuestionsByType = {};
    for (const t of QUESTION_TYPES) {
      this._sessionQuestionsByType[t] = this._sessionAllQuestions.filter(q => q.type === t);
    }

    // Find first unanswered question
    const firstUnanswered = this._sessionAllQuestions.findIndex(q => {
      const ua = session.userAnswers[q.questionId];
      return ua === undefined || ua === null || ua === '';
    });
    if (firstUnanswered >= 0) this._sessionCurrentIndex = firstUnanswered;

    // Set type hint in sessionStorage so refresh recovery knows the session type
    sessionStorage.setItem('exam_active', session.type);

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
        if (this._sessionCurrentIndex > 0) { this._sessionCurrentIndex--; _t1SessionPage.showQuestion(); }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (this._sessionCurrentIndex < this._sessionAllQuestions.length - 1) { this._sessionCurrentIndex++; _t1SessionPage.showQuestion(); }
      }
    };
    document.addEventListener('keydown', this._t1KeyHandler);
  },

  renderSessionUI(container) {
    const isExam = this._sessionState.type === 'exam';
    // Hide header actions and main header (we have our own toolbar at the bottom)
    setHeaderActions('');

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
          <div class="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <button class="btn-tag" id="btnPrev" onclick="_t1SessionPage.navPrev()"><i class="bi bi-chevron-left"></i> 上一题</button>
              <button class="btn-tag" id="btnNext" onclick="_t1SessionPage.navNext()">下一题 <i class="bi bi-chevron-right"></i></button>
              <span style="font-size:0.8rem;font-family:var(--font-hand);color:var(--ink-faint)"><i class="bi bi-keyboard me-1"></i>← → 亦可</span>
            </div>
            <div class="d-flex gap-2">
              <button class="btn-seal" id="btnEnd" onclick="_t1SessionPage.endSession()"><i class="bi bi-stop-circle me-1"></i>收卷</button>
              <button class="btn-seal btn-seal-jade" id="btnSubmit" onclick="_t1SessionPage.submitSession()"><i class="bi bi-check-lg me-1"></i>交卷</button>
            </div>
          </div>
        </div>
      </div>`;

    // Store callbacks on this object (not window) for clean lifecycle
    this._onSidebarNavigate = (qid) => {
      const idx = this._sessionAllQuestions.findIndex(q => q.questionId === qid);
      if (idx >= 0) { this._sessionCurrentIndex = idx; _t1SessionPage.showQuestion(); }
    };

    this._onFeedbackToggle = (checked) => {
      this._sessionState.instantFeedback = checked;
      const timerToggle = document.getElementById('instantFeedbackToggleTimer');
      if (timerToggle) timerToggle.checked = checked;
      updateSidebarFeedback(checked);
      _t1SessionPage.renderSidebar();
      _t1SessionPage.showQuestion();
    };

    // Init sidebar state once for this session (resets flag so first render is full DOM).
    // Subsequent showQuestion() → renderSidebar() calls go through the incremental path,
    // preserving sidebar scroll position.
    initSidebar(
      this._sessionQuestionsByType,
      this._sessionState.userAnswers,
      this._sessionState.type,
      this._sessionState.instantFeedback
    );
    this.renderSidebar();
  },

  renderSidebar() {
    const sidebar = document.getElementById('examSidebar');
    if (!sidebar) return;
    // Do NOT call initSidebar() here — it's only called once per session from
    // renderSessionUI(). Calling it here would reset _sidebarInitialized and force
    // a full DOM rebuild on every question switch, destroying sidebar scroll position.
    renderSidebar(
      sidebar,
      this._sessionAllQuestions[this._sessionCurrentIndex]?.questionId,
      { onNavigate: this._onSidebarNavigate, onFeedbackToggle: this._onFeedbackToggle }
    );
  },

  setupTimer() {
    const timerBar = document.getElementById('examTimerBar');
    if (!timerBar) return;

    const isExam = this._sessionState.type === 'exam';

    // Store handler reference so it can be removed in destroy()
    this._toggleChangeHandler = (e) => {
      const id = e.target.id;
      if (id === 'instantFeedbackToggle') {
        this._sessionState.instantFeedback = e.target.checked;
        const timerToggle = document.getElementById('instantFeedbackToggleTimer');
        if (timerToggle) timerToggle.checked = e.target.checked;
        updateSidebarFeedback(e.target.checked);
        this.renderSidebar();
        this.showQuestion();
      } else if (id === 'instantFeedbackToggleTimer') {
        this._sessionState.instantFeedback = e.target.checked;
        const sidebarToggle = document.getElementById('instantFeedbackToggle');
        if (sidebarToggle) sidebarToggle.checked = e.target.checked;
        updateSidebarFeedback(e.target.checked);
        this.renderSidebar();
        this.showQuestion();
      }
    };

    // Initial render of timer bar (only once, not on every tick)
    timerBar.innerHTML = renderTimerBar(
      isExam ? this._sessionState.durationSeconds - (this._sessionState.elapsedSeconds || 0) : (this._sessionState.elapsedSeconds || 0),
      this._sessionState.type,
      this._sessionState.instantFeedback
    );

    document.addEventListener('change', this._toggleChangeHandler);

    if (isExam) {
      const elapsed = this._sessionState.elapsedSeconds || 0;
      startExamTimer(
        this._sessionState.durationSeconds,
        (remaining) => {
          const timerDisplay = document.getElementById('examTimerDisplay');
          if (timerDisplay) timerDisplay.textContent = formatTime(remaining);
        },
        () => {
          _t1SessionPage._examExpired = true;
          showToast('考试时间到，系统将自动提交', 'warning');
          _t1SessionPage.submitSession(true);
        },
        elapsed
      );
    } else {
      startPracticeTimer((elapsed) => {
        const timerDisplay = document.getElementById('examTimerDisplay');
        if (timerDisplay) {
          timerDisplay.textContent = formatTime(elapsed);
        }
      });
    }
  },

  showQuestion() {
    if (this._sessionAllQuestions.length === 0) return;
    const idx = this._sessionCurrentIndex;
    const q = this._sessionAllQuestions[idx];

    const area = document.getElementById('questionArea');
    if (!area) return;

    const userAnswer = this._sessionState.userAnswers[q.questionId];
    const isExam = this._sessionState.type === 'exam';

    area.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="text-muted">${idx + 1} / ${this._sessionAllQuestions.length}</span>
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
      })}`;

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
            if (!autoAdvancePending && this._sessionCurrentIndex < this._sessionAllQuestions.length - 1) {
              autoAdvancePending = true;
              setTimeout(() => {
                this._sessionCurrentIndex++;
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

    // Update nav buttons
    document.getElementById('btnPrev').disabled = idx === 0;
    document.getElementById('btnNext').disabled = idx === this._sessionAllQuestions.length - 1;

    this.renderSidebar();
  },

  saveAnswer(questionId, value) {
    this._sessionState.userAnswers[questionId] = value;
    updateSidebarAnswers(this._sessionState.userAnswers);
    this.renderSidebar();
    // Persist to DB (debounced)
    this.debouncedSave();
  },

  _saveTimeout: null,
  debouncedSave() {
    if (this._saveTimeout) clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(async () => {
      await saveSession(this._sessionState);
    }, 500);
  },

  navPrev() {
    if (this._sessionCurrentIndex > 0) { this._sessionCurrentIndex--; this.showQuestion(); }
  },

  navNext() {
    if (this._sessionCurrentIndex < this._sessionAllQuestions.length - 1) { this._sessionCurrentIndex++; this.showQuestion(); }
  },

  async submitSession(isAutoSubmit = false) {
    // Prevent manual submit after timer expired
    if (!isAutoSubmit && this._examExpired) return;

    // Auto-submit from timer: skip confirmation
    if (!isAutoSubmit) {
      const unanswered = this._sessionAllQuestions.filter(q => {
        const ua = this._sessionState.userAnswers[q.questionId];
        return ua === undefined || ua === null || ua === '';
      });

      let message = '确认提交试卷吗？';
      if (unanswered.length > 0) {
        message += `\n\n⚠ 还有 ${unanswered.length} 道题未作答：\n${unanswered.map(q => `#${q.sessionNumber} ${TYPE_LABELS_SHORT[q.type]}`).slice(0, 10).join('、')}${unanswered.length > 10 ? '...' : ''}`;
      }

      const confirmed = await showConfirm('提交试卷', message, '确认提交', '继续检查');
      if (!confirmed) return;
    }

    this._removeBeforeUnload();
    sessionStorage.removeItem('exam_active');
    stopTimer();

    // Capture elapsed time before recording
    this._sessionState.elapsedSeconds = getElapsedSeconds();

    // Score
    const scoreResult = scoreSession(this._sessionState);

    // Record results
    await recordResults(this._sessionState, scoreResult);

    // Mark submitted
    this._sessionState.submitted = true;
    await saveSession(this._sessionState);
    await deleteSessionByUser(this._sessionState.userId);
    setState({ currentExam: null });

    // Show results
    const isExam = this._sessionState.type === 'exam';
    const passed = isExam && scoreResult.totalScore >= this._sessionState.passScore;

    let resultsHtml = `
      <div class="text-center mb-3">
        <h4>${isExam ? '考试' : '练习'}结果</h4>
        ${isExam ? `<h2 class="${passed ? 'text-success' : 'text-danger'}">${scoreResult.totalScore} / ${this._sessionState.totalScore}</h2>
        <p>${passed ? '<span class="badge bg-success fs-6">及格</span>' : '<span class="badge bg-danger fs-6">未及格</span>'}（及格线：${this._sessionState.passScore} 分）</p>` : ''}
        <p class="text-muted">正确 ${scoreResult.correctCount} / ${scoreResult.totalQuestions} 题</p>
      </div>`;

    // Show wrong answers
    if (scoreResult.wrongQuestionIds.length > 0) {
      resultsHtml += `<h6>错题及正确答案：</h6><div class="list-group">`;
      for (const qid of scoreResult.wrongQuestionIds) {
        const q = this._sessionAllQuestions.find(sq => sq.questionId === qid);
        if (!q) continue;
        const ua = this._sessionState.userAnswers[q.questionId];
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
    await deleteSessionByUser(this._sessionState.userId);
    setState({ currentExam: null });
    this._sessionState = null;
    location.hash = '#/t1';
  },

  // Called by router when user confirms leaving an active session
  async abandonAndDestroy() {
    this._abandoned = true;
    const user = this._sessionState?.userId;
    if (user) await deleteSessionByUser(user);
    sessionStorage.removeItem('exam_active');
    setState({ currentExam: null });
    await this.destroy();
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
    if (this._toggleChangeHandler) {
      document.removeEventListener('change', this._toggleChangeHandler);
      this._toggleChangeHandler = null;
    }
    stopTimer();
    // Skip save if session was already deleted by abandonAndDestroy()
    if (!this._abandoned && this._sessionState && !this._sessionState.submitted) {
      this._sessionState.elapsedSeconds = getElapsedSeconds();
      await saveSession(this._sessionState);
    }
    this._abandoned = false;
    this._sessionState = null;
    this._sessionAllQuestions = [];
    this._sessionCurrentIndex = 0;
    this._sessionQuestionsByType = {};
  }
};

window._t1SessionPage = _t1SessionPage;

function formatUserAnswer(ua, type) {
  if (ua === null || ua === undefined || ua === '') return '(未作答)';
  switch (type) {
    case 'single': return escapeHtml(ua);
    case 'multi': return ua.split('').map(c => escapeHtml(c)).join(', ');
    case 'tf': return ua === 'true' ? '正确' : '错误';
    case 'fill': return Array.isArray(ua) ? ua.map(v => escapeHtml(v)).join(', ') : escapeHtml(ua);
    case 'essay': return escapeHtml(ua.length > 50 ? ua.slice(0, 50) + '...' : ua);
    default: return escapeHtml(String(ua));
  }
}
