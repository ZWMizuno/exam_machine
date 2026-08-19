// === Navigation Bar Component — modernized ===

function renderNavbar() {
  const container = document.getElementById('app-navbar');
  if (!container) return;

  const user = getCurrentUser();
  if (!user) { container.innerHTML = ''; return; }

  const links = [
    { href: '#/home', icon: 'bi-house', label: '首页' },
    { href: '#/t1', icon: 'bi-pencil-square', label: '考试&练习' },
    { href: '#/t2', icon: 'bi-collection', label: '题库集' },
    { href: '#/t3', icon: 'bi-clock-history', label: '历史记录' },
    { href: '#/t4', icon: 'bi-book', label: '错题集' },
    { href: '#/t6', icon: 'bi-layers', label: '书架' },
    { href: '#/t5', icon: 'bi-file-earmark-text', label: '试卷生成' },
  ];

  const navLinks = links.map(l =>
    `<li class="nav-item"><a id="nav-${l.href.replace('#/', '').replace(/\//g, '-')}" class="nav-link" href="${l.href}"><i class="bi ${l.icon} me-1"></i>${l.label}</a></li>`
  ).join('');

  container.innerHTML = `
    <nav class="navbar navbar-expand-lg">
      <div class="container-fluid">
        <a class="navbar-brand" href="#/home">
          <span class="navbar-mark">EM</span>
          <span>考试机</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-links">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbar-links">
          <ul class="navbar-nav me-auto">${navLinks}</ul>
          <span class="navbar-text d-flex align-items-center gap-3 me-3" id="navbar-user">
            <div class="coin-badge" id="coinDisplay">
              <span class="coin-help-btn" id="coinHelpBtn" title="硬币获取规则：考试/练习每答对一道题奖励1枚；错题扫盲每掌握一道奖励1枚">
                <i class="bi bi-question-circle-fill"></i>
              </span>
              <svg class="coin-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#B07A1B" stroke="#1A1D29" stroke-width="1.5"/>
                <circle cx="12" cy="12" r="7" fill="#E5C97A"/>
                <text x="12" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="#1A1D29" font-family="serif">$</text>
              </svg>
              <span id="coinCount" class="coin-count">0</span>
            </div>
            <span class="user-chip">
              <i class="bi bi-person-circle"></i>
              <span>${escapeHtml(user.username)}</span>
              ${user.role === 'admin' ? '<span class="role-badge">管理员</span>' : ''}
            </span>
          </span>
          <button class="btn-icon-flat" onclick="confirmLogout()" title="退出登录" aria-label="退出登录">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>
    </nav>`;

  // Initialize tooltip
  setTimeout(() => {
    const tipEl = document.getElementById('coinHelpBtn');
    if (tipEl && typeof bootstrap !== 'undefined') {
      try { new bootstrap.Tooltip(tipEl); } catch (e) {}
    }
  }, 100);

  // Load coins
  loadCoinsDisplay(user.id);

  // Subscribe to coin updates
  subscribe('coins:updated', () => loadCoinsDisplay(user.id));

  // Set active
  const hash = location.hash.slice(1) || '/home';
  updateNavbarActive(hash);
}

async function loadCoinsDisplay(userId) {
  const countEl = document.getElementById('coinCount');
  if (!countEl) return;
  const coins = await getUserCoins(userId);
  countEl.textContent = coins;
}

function updateNavbarActive(hash) {
  document.querySelectorAll('#navbar-links .nav-link').forEach(link => {
    link.classList.remove('active');
  });
  if (hash === '/home') {
    document.getElementById('nav-home')?.classList.add('active');
  } else if (hash.startsWith('/t1')) {
    document.getElementById('nav-t1')?.classList.add('active');
  } else if (hash.startsWith('/t2')) {
    document.getElementById('nav-t2')?.classList.add('active');
  } else if (hash.startsWith('/t3')) {
    document.getElementById('nav-t3')?.classList.add('active');
  } else if (hash.startsWith('/t4')) {
    document.getElementById('nav-t4')?.classList.add('active');
  } else if (hash.startsWith('/t5')) {
    document.getElementById('nav-t5')?.classList.add('active');
  } else if (hash.startsWith('/t6')) {
    document.getElementById('nav-t6')?.classList.add('active');
  }
}

// Subscribe to auth changes
subscribe('auth:changed', (user) => renderNavbar());
