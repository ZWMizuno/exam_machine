// === Exam Timer Component ===
// Countdown for exam mode, count-up for practice mode
// Uses absolute time to prevent drift

let timerInterval = null;
let timerStartTime = null;
let timerDuration = 0; // total seconds for exam countdown
let timerType = 'exam'; // 'exam' | 'practice'
let timerCallback = null; // called each second with formatted time
let timerExpireCallback = null;
let timerRemaining = 0;

function startExamTimer(durationSeconds, onTick, onExpire, elapsedSeconds = 0) {
  stopTimer();
  timerType = 'exam';
  timerDuration = durationSeconds;
  timerStartTime = Date.now() - Math.min(elapsedSeconds, durationSeconds) * 1000;
  timerCallback = onTick;
  timerExpireCallback = onExpire;
  timerRemaining = durationSeconds - Math.min(elapsedSeconds, durationSeconds);

  tick();
  timerInterval = setInterval(tick, 250);

  // Handle visibility change (tab backgrounding)
  document.addEventListener('visibilitychange', onVisibilityChange);
}

function startPracticeTimer(onTick) {
  stopTimer();
  timerType = 'practice';
  timerStartTime = Date.now();
  timerCallback = onTick;
  timerRemaining = 0;

  tick();
  timerInterval = setInterval(tick, 250);

  document.addEventListener('visibilitychange', onVisibilityChange);
}

function tick() {
  if (timerType === 'exam') {
    const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
    timerRemaining = Math.max(0, timerDuration - elapsed);

    if (timerCallback) timerCallback(timerRemaining);

    if (timerRemaining <= 0) {
      stopTimer();
      if (timerExpireCallback) timerExpireCallback();
    }
  } else {
    timerRemaining = Math.floor((Date.now() - timerStartTime) / 1000);
    if (timerCallback) timerCallback(timerRemaining);
  }
}

function onVisibilityChange() {
  if (document.hidden) return;
  // Recalculate from absolute time when tab becomes visible
  tick();
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  document.removeEventListener('visibilitychange', onVisibilityChange);
}

function getElapsedSeconds() {
  return Math.floor((Date.now() - timerStartTime) / 1000);
}

function getRemainingSeconds() {
  return timerRemaining;
}

function renderTimerDisplay(seconds, type) {
  const timeStr = formatTime(seconds);
  let cssClass = 'timer-display';
  if (type === 'exam') {
    const total = timerDuration;
    const ratio = seconds / total;
    if (ratio < 0.1) cssClass += ' danger';
    else if (ratio < 0.25) cssClass += ' warning';
  }
  return `<span class="${cssClass}">${timeStr}</span>`;
}

function renderTimerBar(seconds, type, instantFeedback) {
  const timeStr = formatTime(seconds);
  let progressWidth = 100;
  let barClass = 'bg-primary';

  if (type === 'exam') {
    const total = timerDuration;
    progressWidth = Math.max(0, (seconds / total) * 100);
    if (seconds < total * 0.1) barClass = 'bg-danger';
    else if (seconds < total * 0.25) barClass = 'bg-warning';
  }

  let timeClass = 'timer-display';
  if (type === 'exam' && seconds < 60) timeClass += ' danger';

  const feedbackToggle = type === 'practice' ? `
    <div class="form-check form-switch d-inline-block">
      <input class="form-check-input" type="checkbox" id="instantFeedbackToggleTimer" ${instantFeedback ? 'checked' : ''}>
      <label class="form-check-label small" for="instantFeedbackToggleTimer">即时纠错</label>
    </div>` : '';

  return `
    <div class="exam-timer-bar">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-${type === 'exam' ? 'hourglass-split' : 'stopwatch'} text-primary"></i>
        <span class="${timeClass}" id="examTimerDisplay">${timeStr}</span>
        <span class="text-muted small">${type === 'exam' ? '剩余时间' : '已用时间'}</span>
      </div>
      ${feedbackToggle}
      <div class="text-muted" style="font-size:0.75rem">注意：重新加载页面将导致${type === 'exam' ? '考试' : '练习'}退出</div>
    </div>`;
}
