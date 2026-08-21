// === Question Renderer Component ===
// Renders a single question by type with various display modes

function renderQuestion(question, options = {}) {
  const {
    readOnly = false,
    showAnswer = false,
    userAnswer = null,
    instantFeedback = false,
    correctStreak = 0,
    sessionNumber = null,
    wrongCount = 0,
    showDelete = false,
    onDelete = null
  } = options;

  const displayNumber = sessionNumber !== null ? sessionNumber : question.number;
  const type = question.type;

  let answerHtml = '';
  let feedbackHtml = '';

  switch (type) {
    case 'single':
      answerHtml = renderSingleChoice(question, readOnly, showAnswer, userAnswer, instantFeedback);
      break;
    case 'multi':
      answerHtml = renderMultiChoice(question, readOnly, showAnswer, userAnswer, instantFeedback);
      break;
    case 'tf':
      answerHtml = renderTrueFalse(question, readOnly, showAnswer, userAnswer, instantFeedback);
      break;
    case 'fill':
      answerHtml = renderFillBlank(question, readOnly, showAnswer, userAnswer, instantFeedback);
      break;
    case 'essay':
      answerHtml = renderEssay(question, readOnly, showAnswer, userAnswer, instantFeedback);
      break;
  }

  if (instantFeedback && userAnswer !== null && userAnswer !== undefined && userAnswer !== '') {
    const isCorrect = checkAnswerDisplay(userAnswer, question.answer, type);
    if (isCorrect) {
      feedbackHtml = `<div class="instant-feedback correct"><i class="bi bi-check-circle me-1"></i>回答正确！</div>`;
    } else {
      feedbackHtml = `<div class="instant-feedback wrong"><i class="bi bi-x-circle me-1"></i>回答错误！正确答案：${formatCorrectAnswer(question.answer, type)}</div>`;
    }
  }

  if (showAnswer && !instantFeedback) {
    feedbackHtml = `<div class="mt-2 p-2 rounded" style="background:#e6f9f3;color:#0d6b3c;"><strong>正确答案：</strong>${formatCorrectAnswer(question.answer, type)}</div>`;
  }

  // Streak lights (for review mode)
  let streakHtml = '';
  if (correctStreak !== undefined && correctStreak >= 0) {
    streakHtml = `<div class="streak-lights mt-2">${[0,1,2].map(i => `<div class="streak-light ${i < correctStreak ? 'lit' : ''}"></div>`).join('')}</div>`;
  }

  // Wrong count + delete button
  let metaHtml = '';
  if (wrongCount > 0) {
    metaHtml += `<span class="badge bg-warning text-dark me-2"><i class="bi bi-exclamation-triangle me-1"></i>错误 ${wrongCount} 次</span>`;
  }
  if (showDelete && onDelete) {
    metaHtml += `<button class="btn btn-sm btn-outline-danger btn-icon" title="从错题本移除" data-delete-q="${question.id || question.questionId}"><i class="bi bi-trash"></i></button>`;
  }

  return `
    <div class="question-card mb-3" data-question-id="${question.id || question.questionId}" data-question-type="${type}">
      <div class="question-meta d-flex align-items-center gap-2">
        ${typeBadge(type)}
        <span class="fw-bold">#${displayNumber}</span>
        <div class="question-content" style="flex:1">${escapeHtml(question.content)}</div>
        ${metaHtml}
      </div>
      ${answerHtml}
      ${streakHtml}
      ${feedbackHtml}
    </div>`;
}

function renderSingleChoice(question, readOnly, showAnswer, userAnswer, instantFeedback) {
  const opts = question.options || {};
  const labels = Object.keys(opts).sort();
  const correctAnswer = question.answer;

  return `<ul class="options-list">
    ${labels.map(label => {
      const isSelected = userAnswer === label;
      let cssClass = 'option-item';
      if (readOnly) cssClass += ' no-hover';
      if (showAnswer && label === correctAnswer) cssClass += ' correct-answer';
      if (showAnswer && isSelected && label !== correctAnswer) cssClass += ' wrong-answer';
      if (!showAnswer && isSelected) cssClass += ' selected';

      return `<li class="${cssClass}" data-value="${label}">
        <span class="option-letter">${label}</span>
        <span>${escapeHtml(opts[label] || '')}</span>
        ${showAnswer && label === correctAnswer ? '<i class="bi bi-check-circle-fill text-success ms-auto"></i>' : ''}
        ${showAnswer && isSelected && label !== correctAnswer ? '<i class="bi bi-x-circle-fill text-danger ms-auto"></i>' : ''}
      </li>`;
    }).join('')}
  </ul>`;
}

function renderMultiChoice(question, readOnly, showAnswer, userAnswer, instantFeedback) {
  const opts = question.options || {};
  const labels = Object.keys(opts).sort();
  const correctAnswer = question.answer || ''; // e.g., "ABC"
  const selectedAnswers = (userAnswer || '').split('').filter(c => /[A-H]/i.test(c)).map(c => c.toUpperCase());

  return `<ul class="options-list" data-multi="true">
    ${labels.map(label => {
      const isSelected = selectedAnswers.includes(label);
      const isCorrect = correctAnswer.includes(label);
      let cssClass = 'option-item';
      if (readOnly) cssClass += ' no-hover';
      if (showAnswer && isCorrect) cssClass += ' correct-answer';
      if (showAnswer && isSelected && !isCorrect) cssClass += ' wrong-answer';
      if (!showAnswer && isSelected) cssClass += ' selected';

      return `<li class="${cssClass}" data-value="${label}">
        <span class="option-letter">${label}</span>
        <span>${escapeHtml(opts[label] || '')}</span>
        ${showAnswer && isCorrect ? '<i class="bi bi-check-circle-fill text-success ms-auto"></i>' : ''}
        ${showAnswer && isSelected && !isCorrect ? '<i class="bi bi-x-circle-fill text-danger ms-auto"></i>' : ''}
      </li>`;
    }).join('')}
  </ul>`;
}

function renderTrueFalse(question, readOnly, showAnswer, userAnswer, instantFeedback) {
  const correctAnswer = question.answer; // "true" or "false"
  const labels = { 'true': '正确 / True', 'false': '错误 / False' };

  return `<ul class="options-list">
    ${['true', 'false'].map(val => {
      const isSelected = userAnswer === val;
      let cssClass = 'option-item';
      if (readOnly) cssClass += ' no-hover';
      if (showAnswer && val === correctAnswer) cssClass += ' correct-answer';
      if (showAnswer && isSelected && val !== correctAnswer) cssClass += ' wrong-answer';
      if (!showAnswer && isSelected) cssClass += ' selected';

      return `<li class="${cssClass}" data-value="${val}">
        <span class="option-letter">${val === 'true' ? '✓' : '✗'}</span>
        <span>${labels[val]}</span>
        ${showAnswer && val === correctAnswer ? '<i class="bi bi-check-circle-fill text-success ms-auto"></i>' : ''}
        ${showAnswer && isSelected && val !== correctAnswer ? '<i class="bi bi-x-circle-fill text-danger ms-auto"></i>' : ''}
      </li>`;
    }).join('')}
  </ul>`;
}

function renderFillBlank(question, readOnly, showAnswer, userAnswer, instantFeedback) {
  const blanks = question.answer || []; // array of correct answers
  const userBlanks = Array.isArray(userAnswer) ? userAnswer : [];
  // In view mode (readOnly && showAnswer): pre-fill with correct answer, no "正确答案" text
  const viewMode = readOnly && showAnswer;

  return `<div class="fill-blanks">
    ${blanks.map((ans, i) => {
      const userVal = viewMode ? ans : (userBlanks[i] || '');
      let inputClass = 'form-control fill-blank-input';
      if (showAnswer && !viewMode) {
        const ua = (userVal || '').trim().replace(/\s+/g, '').toLowerCase();
        const ca = (ans || '').toLowerCase();
        if (ua === ca) inputClass += ' is-valid';
        else inputClass += ' is-invalid';
      }
      return `<div class="mb-2">
        <label class="form-label fw-bold">第 ${i+1} 空</label>
        <input type="text" class="${inputClass}" data-blank-index="${i}" value="${escapeHtml(userVal)}" ${readOnly ? 'readonly' : ''} placeholder="请输入答案">
        ${showAnswer && !viewMode ? `<div class="form-text ${(userVal||'').trim().replace(/\s+/g,'').toLowerCase() === ans.toLowerCase() ? 'text-success' : 'text-danger'}">正确答案：${escapeHtml(ans)}</div>` : ''}
      </div>`;
    }).join('')}
  </div>`;
}

function renderEssay(question, readOnly, showAnswer, userAnswer, instantFeedback) {
  const userVal = userAnswer || '';
  // In view mode (readOnly && showAnswer): pre-fill with correct answer, no "正确答案" text
  const viewMode = readOnly && showAnswer;
  const displayVal = viewMode ? (question.answer || '') : userVal;
  let textareaClass = 'form-control essay-textarea';
  if (showAnswer && !viewMode) {
    const ua = (userVal || '').trim().replace(/\s+/g, '').toLowerCase();
    const ca = (question.answer || '').toLowerCase();
    if (ua === ca) textareaClass += ' is-valid';
    else textareaClass += ' is-invalid';
  }

  return `<div>
    <textarea class="${textareaClass}" data-type="essay" ${readOnly ? 'readonly' : ''} placeholder="请输入答案">${escapeHtml(displayVal)}</textarea>
    ${showAnswer && !viewMode ? `<div class="mt-1"><strong>正确答案：</strong>${escapeHtml(question.answer || '')}</div>` : ''}
  </div>`;
}

// Extract user answer from rendered question
function getUserAnswer(questionEl) {
  const type = questionEl.dataset.questionType;
  const card = questionEl.closest('.question-card') || questionEl;

  switch (type) {
    case 'single':
      const selected = card.querySelector('.option-item.selected');
      return selected ? selected.dataset.value : null;

    case 'multi':
      const selectedMulti = card.querySelectorAll('.option-item.selected');
      const vals = Array.from(selectedMulti).map(el => el.dataset.value).sort();
      return vals.join('');

    case 'tf':
      const sel = card.querySelector('.option-item.selected');
      return sel ? sel.dataset.value : null;

    case 'fill':
      const inputs = card.querySelectorAll('.fill-blank-input');
      return Array.from(inputs).map(inp => inp.value);

    case 'essay':
      const ta = card.querySelector('textarea');
      return ta ? ta.value : '';

    default:
      return null;
  }
}

// Check answer for instant feedback display
function checkAnswerDisplay(userAnswer, correctAnswer, type) {
  return checkAnswerStatic(userAnswer, correctAnswer, type);
}

function checkAnswerStatic(userAnswer, correctAnswer, type) {
  switch (type) {
    case 'single':
      return (userAnswer || '').trim().toUpperCase() === correctAnswer;

    case 'multi': {
      const ua = [...(userAnswer || '')].filter(c => /[A-H]/i.test(c)).map(c => c.toUpperCase()).sort().join('');
      return ua === correctAnswer;
    }

    case 'tf':
      return String(userAnswer) === String(correctAnswer);

    case 'fill':
      if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) return false;
      return correctAnswer.every((ans, i) =>
        (userAnswer[i] || '').trim().replace(/\s+/g, '').toLowerCase() === ans.toLowerCase()
      );

    case 'essay':
      return (userAnswer || '').trim().replace(/\s+/g, '').toLowerCase() === (correctAnswer || '').toLowerCase();

    default:
      return false;
  }
}

function formatCorrectAnswer(answer, type) {
  switch (type) {
    case 'single':
      return answer ? `<strong>${answer}</strong>` : '';
    case 'multi':
      return answer ? answer.split('').join(', ') : '';
    case 'tf':
      return answer === 'true' ? '正确 (True)' : '错误 (False)';
    case 'fill':
      return Array.isArray(answer) ? answer.map((a, i) => `空${i+1}: ${a}`).join('；') : (answer || '');
    case 'essay':
      return answer || '';
    default:
      return '';
  }
}
