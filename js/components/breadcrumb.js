// === Page Header (replaces breadcrumb in the new design) ===

// Page metadata: title + optional subtitle
const PAGE_META = {
  '/home':       { title: '案头',     sub: '今日学课' },
  '/t1':         { title: '贡院',     sub: '考 · 练' },
  '/t1/exam':    { title: '贡院',     sub: '考试模式' },
  '/t1/practice':{ title: '贡院',     sub: '练习模式' },
  '/t1/session': { title: '贡院',     sub: '作答中' },
  '/t2':         { title: '卷宗',     sub: '题库集' },
  '/t2/add':     { title: '卷宗',     sub: '新增题库' },
  '/t2/view':    { title: '卷宗',     sub: '查看题库' },
  '/t3':         { title: '履历',     sub: '历史记录' },
  '/t4':         { title: '拾遗',     sub: '拾遗录' },
  '/t4/review':  { title: '拾遗',     sub: '扫盲' },
  '/t5':         { title: '拟卷',     sub: '试卷生成' },
  '/t6':         { title: '书铺',     sub: '皮肤商店' },
};

function getPageMeta(hashPath) {
  // Match the longest prefix
  const segs = hashPath.split('?')[0].split('/').filter(Boolean);
  const candidates = [];
  let path = '';
  for (const s of segs) {
    path += '/' + s;
    candidates.push(path);
  }
  // Try the full path first, then progressively shorter prefixes
  for (let i = candidates.length - 1; i >= 0; i--) {
    if (PAGE_META[candidates[i]]) return PAGE_META[candidates[i]];
  }
  return { title: '案头', sub: '' };
}

function renderBreadcrumb() {
  const container = document.getElementById('app-breadcrumb');
  if (!container) return;

  const breadcrumb = getState().breadcrumb || [];
  const hash = (location.hash.slice(1) || '/home').split('?')[0];

  // On login or empty, hide the header
  if (hash === '/login' || hash === '/register' || !getCurrentUser()) {
    container.innerHTML = '';
    return;
  }

  const meta = getPageMeta(hash);
  const lastCrumb = breadcrumb[breadcrumb.length - 1];
  const locText = lastCrumb ? lastCrumb.label : meta.sub;

  // Preserve any header actions that were injected by a page's render() before
  // updateBreadcrumb() fires `breadcrumb:changed` and rewrites this container.
  const prevActions = container.querySelector('#pageHeaderActions')?.innerHTML || '';

  container.innerHTML = `
    <div class="page-header-title">${escapeHtml(meta.title)}</div>
    <span class="page-header-loc"><i class="bi bi-geo-alt-fill"></i>${escapeHtml(locText)}</span>
    <div class="page-header-actions" id="pageHeaderActions">${prevActions}</div>
  `;
}

// Subscribe to breadcrumb changes
subscribe('breadcrumb:changed', () => renderBreadcrumb());

// Public helper: a page can call this to inject a header action button
function setHeaderActions(html) {
  const el = document.getElementById('pageHeaderActions');
  if (el) el.innerHTML = html;
}
window.setHeaderActions = setHeaderActions;
