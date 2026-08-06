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

function initSidebar(questionsByType, userAnswers, type, instantFeedback) {
  // Preserve collapsedTypes across reinitialization
  const prevCollapsed = sidebarState.collapsedTypes || {};
  sidebarState = {
    questionsByType,
    userAnswers: userAnswers || {},
    currentIndex: 0,
    type: type || 'exam',
    instantFeedback: instantFeedback || false,
    collapsedTypes: prevCollapsed
  };
}

function renderSidebar(container, currentQuestionId) {
  sidebarState.currentQuestionId = currentQuestionId;
  const { questionsByType, userAnswers, type, instantFeedback, collapsedTypes } = sidebarState;

  // Auto-expand the type section containing the current question
  if (currentQuestionId) {
    for (const [qtype, questions] of Object.entries(questionsByType)) {
      if (questions.some(q => q.questionId === currentQuestionId)) {
        delete collapsedTypes[qtype];
        break;
      }
    }
  }

  let html = '';

  for (const [qtype, questions] of Object.entries(questionsByType)) {
    if (questions.length === 0) continue;
    const collapsed = collapsedTypes[qtype] ? ' collapsed' : '';
    html += `<div class="type-section${collapsed}">
      <div class="type-header" data-toggle-type="${qtype}">
        <span>${TYPE_LABELS_SHORT[qtype]} (${questions.length})</span>
        <i class="bi bi-chevron-down"></i>
      </div>
      <div class="type-body">
        ${questions.map(q => {
          const qid = q.questionId;
          const answered = userAnswers[qid] !== undefined && userAnswers[qid] !== null && userAnswers[qid] !== '';
          let cssClass = 'question-circle';
          if (instantFeedback) {
            // In instant feedback mode, show correct/wrong
            if (answered) {
              const isCorrectResult = checkAnswer(userAnswers[qid], q.answer, q.type);
              cssClass += isCorrectResult ? ' correct' : ' wrong';
            }
          } else {
            if (answered) cssClass += ' answered';
          }
          if (q.questionId === currentQuestionId) cssClass += ' current';
          return `<div class="${cssClass}" data-qid="${q.questionId}" title="#${q.sessionNumber}">${q.sessionNumber}</div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // Legend
  let legendHtml = '';
  if (instantFeedback && type === 'practice') {
    legendHtml = `
      <div class="sidebar-legend">
        <span><span class="question-circle correct" style="width:14px;height:14px;cursor:default"></span> 正确</span>
        <span><span class="question-circle wrong" style="width:14px;height:14px;cursor:default"></span> 错误</span>
      </div>`;
  } else {
    legendHtml = `
      <div class="sidebar-legend">
        <span><span class="question-circle answered" style="width:14px;height:14px;cursor:default"></span> 已作答</span>
        <span><span class="question-circle" style="width:14px;height:14px;cursor:default"></span> 未作答</span>
      </div>`;
  }

  // Instant feedback toggle (practice only)
  if (type === 'practice') {
    legendHtml += `
      <div class="mt-2 pt-2 border-top">
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" id="instantFeedbackToggle" ${instantFeedback ? 'checked' : ''}>
          <label class="form-check-label small" for="instantFeedbackToggle">即时纠错</label>
        </div>
      </div>`;
  }

  container.innerHTML = `<h6 class="mb-3">题目导航</h6>${html}${legendHtml}`;

  // Circle click handlers
  container.querySelectorAll('.question-circle').forEach(circle => {
    circle.addEventListener('click', () => {
      const qid = parseInt(circle.dataset.qid);
      if (window._onSidebarNavigate) window._onSidebarNavigate(qid);
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
      if (window._onFeedbackToggle) window._onFeedbackToggle(feedbackToggle.checked);
    });
  }
}

function updateSidebarAnswers(userAnswers) {
  sidebarState.userAnswers = userAnswers;
}

function updateSidebarFeedback(instantFeedback) {
  sidebarState.instantFeedback = instantFeedback;
}
