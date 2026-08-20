// === Exam Sidebar Component ===
// Left sidebar with collapsible type sections, question number circles, and legend

let sidebarState = {
  questionsByType: {},
  userAnswers: {},
  currentIndex: 0,
  type: 'exam', // 'exam' | 'practice'
  instantFeedback: false,
  collapsedTypes: {}  // tracks which type sections are collapsed
};

let _sidebarInitialized = false;
let _sidebarCallbacks = null;

function initSidebar(questionsByType, userAnswers, type, instantFeedback) {
  // Only set initial collapsed state once — don't override user's manual collapses
  if (sidebarState._initialized) return;

  // Initial collapsed state: all collapsed, then expand first question's type
  const collapsedTypes = {};
  for (const [qtype, questions] of Object.entries(questionsByType)) {
    collapsedTypes[qtype] = true;
  }
  const allQuestions = Object.values(questionsByType).flat();
  if (allQuestions.length > 0) {
    const firstQ = allQuestions[0];
    for (const [qtype, questions] of Object.entries(questionsByType)) {
      if (questions.some(q => q.questionId === firstQ.questionId)) {
        delete collapsedTypes[qtype];
        break;
      }
    }
  }
  sidebarState = {
    questionsByType,
    userAnswers: userAnswers || {},
    currentIndex: 0,
    type: type || 'exam',
    instantFeedback: instantFeedback || false,
    collapsedTypes,
    _initialized: true
  };
  _sidebarInitialized = true;
}

function _buildCircleHtml(q, userAnswers, instantFeedback, currentQuestionId) {
  const qid = q.questionId;
  const answered = userAnswers[qid] !== undefined && userAnswers[qid] !== null && userAnswers[qid] !== '';
  let cssClass = 'question-circle';
  if (instantFeedback) {
    if (answered) {
      const isCorrectResult = checkAnswer(userAnswers[qid], q.answer, q.type);
      cssClass += isCorrectResult ? ' correct' : ' wrong';
    }
  } else {
    if (answered) cssClass += ' answered';
  }
  if (q.questionId === currentQuestionId) cssClass += ' current';
  return `<div class="${cssClass}" data-qid="${q.questionId}" title="#${q.sessionNumber}">${q.sessionNumber}</div>`;
}

function _buildSidebarHtml(questionsByType, userAnswers, type, instantFeedback, currentQuestionId) {
  let html = '';
  const { collapsedTypes } = sidebarState;

  for (const [qtype, questions] of Object.entries(questionsByType)) {
    if (questions.length === 0) continue;
    const collapsed = collapsedTypes[qtype] ? ' collapsed' : '';
    html += `<div class="type-section${collapsed}">
      <div class="type-header" data-toggle-type="${qtype}">
        <span>${TYPE_LABELS_SHORT[qtype]} (${questions.length})</span>
        <i class="bi bi-chevron-down"></i>
      </div>
      <div class="type-body">
        ${questions.map(q => _buildCircleHtml(q, userAnswers, instantFeedback, currentQuestionId)).join('')}
      </div>
    </div>`;
  }
  return html;
}

function _buildLegendHtml(type, instantFeedback) {
  if (instantFeedback && type === 'practice') {
    return `
      <div class="sidebar-legend">
        <span><span class="question-circle correct" style="width:14px;height:14px;cursor:default"></span> 正确</span>
        <span><span class="question-circle wrong" style="width:14px;height:14px;cursor:default"></span> 错误</span>
      </div>`;
  } else {
    return `
      <div class="sidebar-legend">
        <span><span class="question-circle answered" style="width:14px;height:14px;cursor:default"></span> 已作答</span>
        <span><span class="question-circle" style="width:14px;height:14px;cursor:default"></span> 未作答</span>
      </div>`;
  }
}

function _buildFeedbackToggleHtml(type, instantFeedback) {
  if (type !== 'practice') return '';
  return `
    <div class="mt-2 pt-2 border-top">
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" id="instantFeedbackToggle" ${instantFeedback ? 'checked' : ''}>
        <label class="form-check-label small" for="instantFeedbackToggle">即时纠错</label>
      </div>
    </div>`;
}

function _attachListeners(container) {
  // Circle click handlers
  container.querySelectorAll('.question-circle').forEach(circle => {
    circle.addEventListener('click', () => {
      const qid = parseInt(circle.dataset.qid);
      if (_sidebarCallbacks?.onNavigate) _sidebarCallbacks.onNavigate(qid);
    });
  });

  // Collapse/expand type sections
  container.querySelectorAll('.type-header').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.parentElement;
      section.classList.toggle('collapsed');
      const qtype = header.dataset.toggleType;
      sidebarState.collapsedTypes[qtype] = section.classList.contains('collapsed');
    });
  });

  // Instant feedback toggle
  const feedbackToggle = document.getElementById('instantFeedbackToggle');
  if (feedbackToggle) {
    feedbackToggle.addEventListener('change', () => {
      if (_sidebarCallbacks?.onFeedbackToggle) _sidebarCallbacks.onFeedbackToggle(feedbackToggle.checked);
    });
  }
}

function _updateCirclesInPlace(container, currentQuestionId, questionsByType, userAnswers, instantFeedback) {
  const questionsDiv = container.querySelector('.exam-sidebar-questions');
  if (!questionsDiv) return;
  const savedScroll = questionsDiv.scrollTop;

  questionsDiv.querySelectorAll('.question-circle').forEach(circle => {
    const qid = parseInt(circle.dataset.qid);
    // Find the question object
    let q = null;
    for (const questions of Object.values(questionsByType)) {
      q = questions.find(item => item.questionId === qid);
      if (q) break;
    }
    if (!q) return;

    const answered = userAnswers[qid] !== undefined && userAnswers[qid] !== null && userAnswers[qid] !== '';
    let cssClass = 'question-circle';
    if (instantFeedback) {
      if (answered) {
        const isCorrect = checkAnswer(userAnswers[qid], q.answer, q.type);
        cssClass += isCorrect ? ' correct' : ' wrong';
      }
    } else {
      if (answered) cssClass += ' answered';
    }
    circle.className = cssClass;
  });

  // Update current highlight
  questionsDiv.querySelectorAll('.question-circle.current').forEach(c => c.classList.remove('current'));
  const newCurrent = questionsDiv.querySelector(`[data-qid="${currentQuestionId}"]`);
  if (newCurrent) newCurrent.classList.add('current');

  questionsDiv.scrollTop = savedScroll;
}

function _updateFeedbackToggle(container, type, instantFeedback) {
  const toggle = container.querySelector('#instantFeedbackToggle');
  if (toggle) {
    toggle.checked = instantFeedback;
  }
  // Update legend classes
  const legend = container.querySelector('.sidebar-legend');
  if (legend) {
    legend.innerHTML = type === 'practice' && instantFeedback
      ? `<span><span class="question-circle correct" style="width:14px;height:14px;cursor:default"></span> 正确</span><span><span class="question-circle wrong" style="width:14px;height:14px;cursor:default"></span> 错误</span>`
      : `<span><span class="question-circle answered" style="width:14px;height:14px;cursor:default"></span> 已作答</span><span><span class="question-circle" style="width:14px;height:14px;cursor:default"></span> 未作答</span>`;
  }
}

function renderSidebar(container, currentQuestionId, callbacks) {
  _sidebarCallbacks = callbacks;
  sidebarState.currentQuestionId = currentQuestionId;

  const { questionsByType, userAnswers, type, instantFeedback, collapsedTypes } = sidebarState;

  // Auto-expand the type containing the current question (only if collapsed)
  if (currentQuestionId) {
    for (const [qtype, questions] of Object.entries(questionsByType)) {
      if (questions.some(q => q.questionId === currentQuestionId)) {
        if (collapsedTypes[qtype]) {
          delete collapsedTypes[qtype];
        }
        break;
      }
    }
  }

  const questionsHtml = _buildSidebarHtml(questionsByType, userAnswers, type, instantFeedback, currentQuestionId);
  const legendHtml = _buildLegendHtml(type, instantFeedback);
  const feedbackHtml = _buildFeedbackToggleHtml(type, instantFeedback);

  if (!_sidebarInitialized) {
    // First render: full DOM + attach listeners
    container.innerHTML = `<h6 class="mb-3">题目导航</h6><div class="exam-sidebar-questions">${questionsHtml}</div>${legendHtml}${feedbackHtml}`;
    _attachListeners(container);
    _sidebarInitialized = true;
  } else {
    // Subsequent renders: only update circles in place
    _updateCirclesInPlace(container, currentQuestionId, questionsByType, userAnswers, instantFeedback);
    _updateFeedbackToggle(container, type, instantFeedback);
  }
}

function updateSidebarAnswers(userAnswers) {
  sidebarState.userAnswers = userAnswers;
}

function updateSidebarFeedback(instantFeedback) {
  sidebarState.instantFeedback = instantFeedback;
}
