// === Sidebar (book-spine navigation) ===

// Spine definitions: each section becomes a "book" on the wooden shelf.
// spine-color / spine-text reference colors from the 32 book schemes (see t4-wrongbook.js).
const SIDEBAR_SPINES = [
  { href: '#/home', label: '案头',   spineColor: '#1F1B16', spineText: '#F5DEB3', matchPrefix: '/home' },
  { href: '#/t1',   label: '考场',   spineColor: '#136058', spineText: '#FCC96E', matchPrefix: '/t1' },
  { href: '#/t2',   label: '卷宗',   spineColor: '#B33A26', spineText: '#FFF9E6', matchPrefix: '/t2' },
  { href: '#/t3',   label: '履历',   spineColor: '#5C4632', spineText: '#FFDCA3', matchPrefix: '/t3' },
  { href: '#/t4',   label: '拾遗',   spineColor: '#052228', spineText: '#9FE7E6', matchPrefix: '/t4' },
  { href: '#/t6',   label: '书铺',   spineColor: '#841C3C', spineText: '#D1A1BA', matchPrefix: '/t6' },
  { href: '#/t5',   label: '拟卷',   spineColor: '#F3CDA8', spineText: '#A92A01', matchPrefix: '/t5' },
];

function renderNavbar() {
  const container = document.getElementById('app-navbar');
  if (!container) return;

  const user = getCurrentUser();
  if (!user) { container.innerHTML = ''; return; }

  const isAdmin = user.role === 'admin';

  const spinesHtml = SIDEBAR_SPINES.map(s => `
    <a class="sidebar-spine" href="${s.href}" data-prefix="${s.matchPrefix}"
       style="--spine-color:${s.spineColor};--spine-text:${s.spineText}"
       title="${s.label}" aria-label="${s.label}">
      <span class="sidebar-spine-label">${s.label}</span>
    </a>
  `).join('');

  container.innerHTML = `
    <div class="sidebar-brand">
      <div class="sidebar-brand-seal">考</div>
      <h1 class="sidebar-brand-title">考试机</h1>
      <div class="sidebar-brand-sub">EXAM&nbsp;MACHINE</div>
    </div>
    <ul class="sidebar-spines" id="sidebar-spines">${spinesHtml}</ul>
    <div class="sidebar-user">
      <div class="sidebar-user-info" title="${escapeHtml(user.username)}${isAdmin ? '（管理员）' : ''}">
        <i class="bi bi-person-circle" style="color:#F5DEB3;font-size:1.1rem"></i>
        <span class="sidebar-user-name">${escapeHtml(user.username)}</span>
        ${isAdmin ? '<span class="sidebar-admin-tag">管理员</span>' : ''}
      </div>
      <div class="sidebar-coin-badge" id="coinDisplay" title="铜钱余额" aria-label="铜钱">
        <svg class="sidebar-coin-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="ancientCoin" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stop-color="#E8C896"/>
              <stop offset="50%" stop-color="#B8895A"/>
              <stop offset="100%" stop-color="#6B4A2A"/>
            </radialGradient>
          </defs>
          <circle cx="12" cy="12" r="10.5" fill="url(#ancientCoin)" stroke="#3D2817" stroke-width="0.7"/>
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="#3D2817" stroke-width="0.4" opacity="0.55"/>
          <rect x="8.7" y="8.7" width="6.6" height="6.6" fill="#2A1A0A"/>
          <text x="5" y="8" font-size="2.6" fill="#3D2817" font-family="STSong,'SimSun',serif" font-weight="700" text-anchor="middle">考</text>
          <text x="19" y="8" font-size="2.6" fill="#3D2817" font-family="STSong,'SimSun',serif" font-weight="700" text-anchor="middle">试</text>
          <text x="5" y="20" font-size="2.6" fill="#3D2817" font-family="STSong,'SimSun',serif" font-weight="700" text-anchor="middle">机</text>
          <text x="19" y="20" font-size="2.6" fill="#3D2817" font-family="STSong,'SimSun',serif" font-weight="700" text-anchor="middle">通</text>
          <ellipse cx="8" cy="6" rx="3" ry="1.2" fill="#FFF4DC" opacity="0.35"/>
        </svg>
        <span id="coinCount" class="sidebar-coin-count">0</span>
      </div>
      <button class="sidebar-logout" onclick="confirmLogout()" title="退出登录" aria-label="退出登录">
        <i class="bi bi-box-arrow-right"></i>
      </button>
    </div>
  `;

  // Set active spine
  setActiveSpine((location.hash.slice(1) || '/home').split('?')[0]);

  // Load coins
  loadCoinsDisplay(user.id);
  subscribe('coins:updated', () => loadCoinsDisplay(user.id));
}

function setActiveSpine(hash) {
  document.querySelectorAll('.sidebar-spine').forEach(el => {
    el.classList.remove('active');
    const prefix = el.dataset.prefix;
    if (prefix && hash.startsWith(prefix)) {
      el.classList.add('active');
    }
  });
  // Special case: /home should be active only on /home
  if (hash === '/home' || hash === '/') {
    const home = document.querySelector('.sidebar-spine[data-prefix="/home"]');
    if (home) home.classList.add('active');
  }
}

async function loadCoinsDisplay(userId) {
  const countEl = document.getElementById('coinCount');
  if (!countEl) return;
  const coins = await getUserCoins(userId);
  countEl.textContent = coins;
}

function updateNavbarActive(hash) {
  setActiveSpine(hash.split('?')[0]);
}

// Subscribe to auth changes
subscribe('auth:changed', () => renderNavbar());
