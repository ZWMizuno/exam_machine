// === Utility Functions ===

// --- Constants ---
const QUESTION_TYPES = ['single', 'multi', 'tf', 'fill', 'essay'];
const TYPE_LABELS = {
  single: '单选题', multi: '多选题', tf: '判断题', fill: '填空题', essay: '问答题'
};
const TYPE_LABELS_SHORT = {
  single: '单选', multi: '多选', tf: '判断', fill: '填空', essay: '问答'
};

// --- Toast ---
function showToast(message, type = 'info', title = '', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: 'bi-check-circle', error: 'bi-x-circle', warning: 'bi-exclamation-triangle', info: 'bi-info-circle' };
  const titles = { success: '成功', error: '错误', warning: '警告', info: '提示' };

  const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  const icon = icons[type] || icons.info;
  const displayTitle = title || titles[type] || '';

  const html = `
    <div id="${id}" class="toast toast-${type}" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header">
        <i class="bi ${icon} me-2"></i>
        <strong class="me-auto">${escapeHtml(displayTitle)}</strong>
        <small>${new Date().toLocaleTimeString()}</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">${escapeHtml(message)}</div>
    </div>`;

  container.insertAdjacentHTML('beforeend', html);
  const toastEl = document.getElementById(id);
  const toast = new bootstrap.Toast(toastEl, { delay: duration });
  toast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// --- Modal ---
function showModal(title, bodyHtml, buttons = [], size = '') {
  const container = document.getElementById('modal-container');
  if (!container) return { close: () => {} };

  const id = 'modal-' + Date.now();
  const modalSize = size ? 'modal-' + size : '';

  const btnHtml = buttons.map((b, i) =>
    `<button type="button" class="btn ${b.cls || 'btn-secondary'}" data-modal-action="${i}">${b.text}</button>`
  ).join('');

  const html = `
    <div class="modal fade" id="${id}" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog ${modalSize} modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${escapeHtml(title)}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">${bodyHtml}</div>
          ${buttons.length ? `<div class="modal-footer">${btnHtml}</div>` : ''}
        </div>
      </div>
    </div>`;

  container.insertAdjacentHTML('beforeend', html);
  const modalEl = document.getElementById(id);
  const modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: true });

  let resolved = false;
  const result = new Promise((resolve) => {
    modalEl.addEventListener('hidden.bs.modal', () => {
      modalEl.remove();
      if (!resolved) { resolved = true; resolve(-1); }
    });
    if (buttons.length) {
      modalEl.querySelectorAll('[data-modal-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.modalAction);
          resolved = true;
          modal.hide();
          resolve(idx);
        });
      });
    }
  });

  modal.show();
  return { modal, close: () => { if (!resolved) { resolved = true; modal.hide(); resolve(-1); } }, result };
}

async function showConfirm(title, message, confirmText = '确认', cancelText = '取消', danger = false) {
  const buttons = [
    { text: cancelText, cls: 'btn-secondary' },
    { text: confirmText, cls: danger ? 'btn-danger' : 'btn-primary' }
  ];
  const { result } = showModal(title, `<p>${escapeHtml(message)}</p>`, buttons);
  const idx = await result;
  return idx === 1;
}

// --- Formatters ---
function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function generateId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// --- Shuffle (Fisher-Yates) ---
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Debounce ---
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// --- Model Name Helper ---
function numberToLetters(n) {
  let result = '';
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

async function getDefaultModeName(bankId) {
  const modes = await getExamModesByBank(bankId);
  const existing = new Set(modes.map(m => m.name));
  let n = 1;
  while (existing.has('Model ' + numberToLetters(n))) { n++; }
  return 'Model ' + numberToLetters(n);
}

// --- TF Normalization ---
const TF_TRUE_PATTERNS = /^(对|正确|是|y|yes|t|true|真|√)$/i;
const TF_FALSE_PATTERNS = /^(错|错误|否|n|no|f|false|假|×|x)$/i;

function normalizeTFAnswer(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (TF_TRUE_PATTERNS.test(s)) return 'true';
  if (TF_FALSE_PATTERNS.test(s)) return 'false';
  return null;
}

// --- Sheet Type Detection ---
function detectSheetType(sheetName) {
  const s = sheetName.trim();
  if (/单[项选择]/.test(s)) return 'single';
  if (/多[项选择]/.test(s)) return 'multi';
  if (/判断|真假/.test(s)) return 'tf';
  if (/填空/.test(s)) return 'fill';
  if (/简答|问答|essay/i.test(s)) return 'essay';
  return null;
}

// --- Question Type Badge ---
function typeBadge(type) {
  return `<span class="question-type-badge ${type}">${TYPE_LABELS[type]}</span>`;
}
