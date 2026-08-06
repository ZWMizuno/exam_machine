// === Login / Register Page ===

const _loginPage = {
  async render(container) {
    container.innerHTML = `
      <div class="login-page">
        <div class="login-card">
          <h2><i class="bi bi-journal-check me-2"></i>考试机</h2>
          <p class="text-center text-muted mb-3">网页版考试系统</p>
          <ul class="nav nav-tabs" id="authTabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#loginTab" type="button">登录</button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" data-bs-toggle="tab" data-bs-target="#registerTab" type="button">注册</button>
            </li>
          </ul>
          <div class="tab-content mt-3">
            <div class="tab-pane fade show active" id="loginTab">
              <form id="loginForm">
                <div class="mb-3">
                  <label class="form-label">用户名</label>
                  <input type="text" class="form-control" id="loginUsername" placeholder="请输入用户名" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">密码</label>
                  <input type="password" class="form-control" id="loginPassword" placeholder="请输入密码" required>
                </div>
                <button type="submit" class="btn btn-primary w-100"><i class="bi bi-box-arrow-in-right me-1"></i>登录</button>
              </form>
              <p class="text-muted text-center mt-2 small">默认管理员: admin / admin123</p>
            </div>
            <div class="tab-pane fade" id="registerTab">
              <form id="registerForm">
                <div class="mb-3">
                  <label class="form-label">用户名</label>
                  <input type="text" class="form-control" id="regUsername" placeholder="请输入用户名（至少2个字符）" required minlength="2">
                </div>
                <div class="mb-3">
                  <label class="form-label">密码</label>
                  <input type="password" class="form-control" id="regPassword" placeholder="请输入密码（至少4个字符）" required minlength="4">
                </div>
                <div class="mb-3">
                  <label class="form-label">确认密码</label>
                  <input type="password" class="form-control" id="regPassword2" placeholder="请再次输入密码" required>
                </div>
                <button type="submit" class="btn btn-success w-100"><i class="bi bi-person-plus me-1"></i>注册</button>
              </form>
            </div>
          </div>
        </div>
      </div>`;

    // Clear breadcrumb
    renderBreadcrumb();
    // Hide navbar
    document.getElementById('app-navbar').innerHTML = '';

    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;
      const btn = e.target.querySelector('button');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>登录中...';

      const result = await login(username, password);
      if (result.success) {
        showToast('登录成功', 'success');
        renderNavbar();
        location.hash = '#/home';
      } else {
        showToast(result.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-1"></i>登录';
      }
    });

    // Register form
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('regUsername').value.trim();
      const password = document.getElementById('regPassword').value;
      const password2 = document.getElementById('regPassword2').value;
      const btn = e.target.querySelector('button');

      if (password !== password2) {
        showToast('两次输入的密码不一致', 'warning');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>注册中...';

      const result = await register(username, password);
      if (result.success) {
        showToast('注册成功', 'success');
        renderNavbar();
        location.hash = '#/home';
      } else {
        showToast(result.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-person-plus me-1"></i>注册';
      }
    });
  },

  async destroy() {}
};

window._loginPage = _loginPage;
