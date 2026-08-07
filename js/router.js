// === Hash-Based SPA Router ===

const routes = [];
let currentPage = null;
let _guardRestore = false;

function addRoute(pattern, pageModule, authRequired = true, roles = null) {
  routes.push({ pattern, pageModule, authRequired, roles });
}

function matchRoute(hash) {
  for (const route of routes) {
    const regexStr = route.pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)');
    const regex = new RegExp('^' + regexStr + '$');
    const match = hash.match(regex);
    if (match) return { route, params: match.groups || {} };
  }
  return null;
}

async function handleRoute() {
  // Guard restore: skip re-render when restoring hash after cancelled navigation
  if (_guardRestore) { _guardRestore = false; return; }

  const rawHash = location.hash.slice(1) || '/';
  const hash = rawHash === '/' ? '/home' : rawHash;
  const qsIdx = hash.indexOf('?');
  const hashPath = qsIdx >= 0 ? hash.slice(0, qsIdx) : hash;
  const queryParams = qsIdx >= 0 ? Object.fromEntries(new URLSearchParams(hash.slice(qsIdx))) : {};

  const match = matchRoute(hashPath);
  if (!match) { location.hash = '#/home'; return; }

  const { route, params } = match;
  params._query = queryParams;

  // Auth guard
  if (route.authRequired && !isLoggedIn()) {
    location.hash = '#/login';
    return;
  }

  // Role guard
  if (route.roles && !route.roles.includes(getCurrentUser()?.role)) {
    showToast('权限不足', 'error');
    location.hash = '#/home';
    return;
  }

  // Active exam guard
  const state = getState();
  if (state.currentExam && !hashPath.startsWith('/t1/session')) {
    const confirmed = await showConfirm('考试进行中', '当前有正在进行的考试/练习，离开将丢失进度。确定离开吗？', '离开', '继续作答', true);
    if (!confirmed) { _guardRestore = true; location.hash = '#/t1/session'; return; }
    setState({ currentExam: null });
  }

  // Destroy previous page
  if (currentPage && typeof currentPage.destroy === 'function') {
    try { await currentPage.destroy(); } catch (e) { console.error('Page destroy error:', e); }
  }

  // Render new page
  const content = document.getElementById('app-content');
  if (!content) return;
  content.innerHTML = '<div class="d-flex justify-content-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

  try {
    await route.pageModule.render(content, params);
    currentPage = route.pageModule;
  } catch (e) {
    console.error('Page render error:', e);
    content.innerHTML = `<div class="alert alert-danger m-3">页面加载错误: ${escapeHtml(e.message)}</div>`;
  }

  // Update breadcrumb and navbar AFTER render so pages can setState first
  updateBreadcrumb(hashPath, params);
  updateNavbarActive(hashPath);
}

function updateBreadcrumb(hash, params) {
  if (hash === '/login' || hash === '/register') {
    setState({ breadcrumb: [] });
    return;
  }

  const segs = hash.split('/').filter(Boolean);
  const trail = [{ label: '首页', href: '#/home' }];

  const labelMap = {
    home: '首页', t1: '考试&练习', exam: '考试模式', practice: '练习模式',
    session: getState().currentExam?.type === 'practice' ? '练习中' : '考试中',
    t2: '题库集', add: '新增题库', edit: '编辑题库', view: '查看题库',
    t3: '历史记录', t4: '错题集', review: '错题扫盲', t5: '试卷生成'
  };

  let path = '#';
  for (let i = 0; i < segs.length; i++) {
    path += '/' + segs[i];
    let label = labelMap[segs[i]];
    if (!label) {
      // Check if it's a bankId param
      if (params.bankId && segs[i] === params.bankId) {
        const bn = getState()._bankName || '题库';
        label = `《${bn}》`;
      } else {
        label = segs[i];
      }
    }
    trail.push({ label, href: path });
  }

  // Last segment is not clickable
  if (trail.length > 0) trail[trail.length - 1].href = null;

  // "编辑题库" and "查看题库" are not clickable as intermediate segments
  // because #/t2/edit and #/t2/view (without bankId) are not registered routes
  // trail[i] corresponds to segs[i-1] (trail[0] is 首页)
  for (let i = 1; i < trail.length - 1; i++) {
    if (trail[i].href && (segs[i - 1] === 'edit' || segs[i - 1] === 'view')) {
      trail[i].href = null;
    }
  }

  setState({ breadcrumb: trail });
}

function updateNavbarActive(hash) {
  document.querySelectorAll('#navbar-links .nav-link').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href && hash.startsWith(href.replace('#', '/'))) {
      link.classList.add('active');
    }
  });
}

async function startRouter() {
  // Register routes
  addRoute('/login', window._loginPage, false);
  addRoute('/home', window._homePage, true);
  addRoute('/t1', window._t1Page, true);
  addRoute('/t1/exam', window._t1Page, true);
  addRoute('/t1/practice', window._t1Page, true);
  addRoute('/t1/session', window._t1SessionPage, true);
  addRoute('/t2', window._t2BanksPage, true);
  addRoute('/t2/add', window._t2BanksPage, true, ['admin']);
  addRoute('/t2/edit/:bankId', window._t2DetailPage, true, ['admin']);
  addRoute('/t2/view/:bankId', window._t2DetailPage, true);
  addRoute('/t3', window._t3HistoryPage, true);
  addRoute('/t4', window._t4WrongbookPage, true);
  addRoute('/t4/:bankId', window._t4WrongbookPage, true);
  addRoute('/t4/:bankId/review', window._t4WrongbookPage, true);
  addRoute('/t5', window._t5PaperPage, true);

  // Check for stored session
  const restored = await restoreSession();
  if (!restored) {
    location.hash = '#/login';
  } else {
    if (!location.hash || location.hash === '#/' || location.hash === '#') {
      location.hash = '#/home';
    }
    await handleRoute();
  }

  // Listen for hash changes
  window.addEventListener('hashchange', handleRoute);
}
