// === Navigation Bar Component ===

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
    { href: '#/t5', icon: 'bi-file-earmark-text', label: '试卷生成' },
  ];

  const navLinks = links.map(l =>
    `<li class="nav-item"><a id="nav-${l.href.replace('#/', '').replace(/\//g, '-')}" class="nav-link" href="${l.href}"><i class="bi ${l.icon} me-1"></i>${l.label}</a></li>`
  ).join('');

  container.innerHTML = `
    <nav class="navbar navbar-expand-lg">
      <div class="container-fluid">
        <a class="navbar-brand" href="#/home"><i class="bi bi-journal-check"></i>考试机</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-links">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbar-links">
          <ul class="navbar-nav me-auto">${navLinks}</ul>
          <span class="navbar-text me-3" id="navbar-user"><i class="bi bi-person-circle me-1"></i>${escapeHtml(user.username)} ${user.role === 'admin' ? '<span class="badge bg-warning text-dark ms-1">管理员</span>' : ''}</span>
          <button class="btn btn-outline-danger btn-sm" onclick="logout()"><i class="bi bi-box-arrow-right"></i> 退出</button>
        </div>
      </div>
    </nav>`;

  // Set active
  const hash = location.hash.slice(1) || '/home';
  updateNavbarActive(hash);
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
  }
}

// Subscribe to auth changes
subscribe('auth:changed', (user) => renderNavbar());
