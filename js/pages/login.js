// === Login / Register Page — modern centered form ===

let _loginMode = 'login'; // 'login' | 'register'

const _loginPage = {
  async render(container) {
    container.style.overflow = 'hidden';
    container.style.background = '';
    container.classList.add('login-page-content');
    const breadcrumb = document.getElementById('app-breadcrumb');
    if (breadcrumb) breadcrumb.style.display = 'none';

    _loginMode = 'login';
    this._renderForm(container);
  },

  _renderForm(container) {
    const isLogin = _loginMode === 'login';
    const heading = isLogin ? '欢迎回来' : '创建账户';
    const sub     = isLogin ? '登录以访问你的题库与学习记录' : '注册后即可使用所有考试与练习功能';
    const submitText = isLogin ? '登录' : '注册';
    const busyText   = isLogin ? '登录中…' : '注册中…';

    container.innerHTML = `
      <div class="login-page">
        <div class="login-card">
          <div class="login-card__brand">
            <div class="login-card__brand-mark" aria-hidden="true">EM</div>
            <div class="login-card__brand-text">
              <span class="login-card__brand-title">考试机</span>
              <span class="login-card__brand-sub">EXAM MACHINE</span>
            </div>
          </div>

          <div class="login-card__heading">${heading}</div>
          <div class="login-card__sub">${sub}</div>

          <div class="login-mode-switch" role="tablist">
            <button type="button" class="login-mode-switch__btn ${isLogin ? 'active' : ''}" data-mode="login" role="tab">登录</button>
            <button type="button" class="login-mode-switch__btn ${!isLogin ? 'active' : ''}" data-mode="register" role="tab">注册</button>
          </div>

          <form class="login-form" id="loginForm" novalidate>
            <div>
              <label for="login-username" class="sr-only">用户名</label>
              <input class="form-control" id="login-username" name="username" placeholder="用户名" type="text" required minlength="2" autocomplete="username" aria-required="true" />
            </div>
            ${isLogin ? `
              <div class="login-input-wrapper">
                <label for="login-password" class="sr-only">密码</label>
                <input class="form-control" id="login-password" name="password" placeholder="密码" type="password" required autocomplete="current-password" aria-required="true" />
                <button type="button" class="password-toggle-btn" aria-label="显示或隐藏密码" tabindex="-1">
                  <i class="bi bi-eye" aria-hidden="true"></i>
                </button>
              </div>
            ` : `
              <div class="login-input-wrapper">
                <label for="login-password" class="sr-only">密码</label>
                <input class="form-control" id="login-password" name="password" placeholder="密码（至少 4 个字符）" type="password" required minlength="4" autocomplete="new-password" aria-required="true" />
                <button type="button" class="password-toggle-btn" aria-label="显示或隐藏密码" tabindex="-1">
                  <i class="bi bi-eye" aria-hidden="true"></i>
                </button>
              </div>
              <div class="login-input-wrapper">
                <label for="login-password2" class="sr-only">确认密码</label>
                <input class="form-control" id="login-password2" name="password2" placeholder="再次输入密码" type="password" required autocomplete="new-password" aria-required="true" />
                <button type="button" class="password-toggle-btn" aria-label="显示或隐藏密码" tabindex="-1">
                  <i class="bi bi-eye" aria-hidden="true"></i>
                </button>
              </div>
            `}
            <button type="submit" class="login-form__submit" aria-busy="false">${submitText}</button>
          </form>

          ${isLogin ? `<div class="login-form__hint">默认管理员：admin / admin123</div>` : ''}
        </div>
      </div>`;

    // Mode switch
    container.querySelectorAll('.login-mode-switch__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        if (mode === _loginMode) return;
        _loginMode = mode;
        this._renderForm(container);
      });
    });

    // Submit (single form; password2 is optional when in login mode)
    const form = container.querySelector('#loginForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = e.target.username.value.trim();
      const password = e.target.password.value;
      const password2 = e.target.password2 ? e.target.password2.value : null;
      const submitBtn = form.querySelector('button[type="submit"]');
      const original = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span>' + busyText;

      try {
        if (_loginMode === 'register') {
          if (password !== password2) {
            showToast('两次输入的密码不一致', 'warning');
            submitBtn.disabled = false;
            submitBtn.setAttribute('aria-busy', 'false');
            submitBtn.textContent = original;
            return;
          }
          const result = await register(username, password);
          if (result.success) {
            showToast('注册成功', 'success');
            renderNavbar();
            location.hash = '#/home';
          } else {
            showToast(result.message, 'error');
            submitBtn.disabled = false;
            submitBtn.setAttribute('aria-busy', 'false');
            submitBtn.textContent = original;
          }
        } else {
          const result = await login(username, password);
          if (result.success) {
            showToast('登录成功', 'success');
            renderNavbar();
            location.hash = '#/home';
          } else {
            showToast(result.message, 'error');
            submitBtn.disabled = false;
            submitBtn.setAttribute('aria-busy', 'false');
            submitBtn.textContent = original;
          }
        }
      } catch (err) {
        showToast('操作失败：' + (err.message || '未知错误'), 'error');
        submitBtn.disabled = false;
        submitBtn.setAttribute('aria-busy', 'false');
        submitBtn.textContent = original;
      }
    });

    // Password show/hide toggles
    container.querySelectorAll('.password-toggle-btn').forEach(btn => {
      const wrapper = btn.closest('.login-input-wrapper');
      if (!wrapper) return;
      const input = wrapper.querySelector('input');
      if (!input) return;

      input.addEventListener('focus', () => { btn.style.display = 'flex'; });
      input.addEventListener('blur',  () => { btn.style.display = 'none'; });
      btn.addEventListener('mousedown', (e) => { e.preventDefault(); });

      btn.addEventListener('click', () => {
        const showing = input.type === 'text';
        const selStart = input.selectionStart;
        const selEnd = input.selectionEnd;
        input.type = showing ? 'password' : 'text';
        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = showing ? 'bi bi-eye' : 'bi bi-eye-slash';
          icon.setAttribute('aria-hidden', 'true');
        }
        btn.setAttribute('aria-label', showing ? '显示密码' : '隐藏密码');
        setTimeout(() => {
          if (document.activeElement === input) {
            try { input.setSelectionRange(selStart, selEnd); } catch (_) {}
          }
        }, 0);
      });
    });
  },

  async destroy() {
    const breadcrumb = document.getElementById('app-breadcrumb');
    if (breadcrumb) breadcrumb.style.display = '';
    const appContent = document.getElementById('app-content');
    if (appContent) {
      appContent.style.background = '';
      appContent.style.overflow = '';
      appContent.classList.remove('login-page-content');
    }
  }
};

window._loginPage = _loginPage;
