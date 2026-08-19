// === Login / Register Page (doodle card flip) ===

const _loginPage = {
  async render(container) {
    container.style.overflow = 'hidden';
    container.style.background = '#c9e4ca';
    container.classList.add('login-page-content');
    const breadcrumb = document.getElementById('app-breadcrumb');
    if (breadcrumb) breadcrumb.style.display = 'none';
    container.innerHTML = `
      <div class="login-page">
        <div class="login-banner">考试机</div>
        <div class="doodle-wrapper">
          <input type="checkbox" id="doodle-flip" class="doodle-toggle" aria-label="Toggle Login and Sign up" />

          <div class="doodle-header">
            <span class="doodle-mode-text login-text">登录</span>
            <label class="doodle-switch-label" for="doodle-flip" tabindex="0">
              <span class="doodle-switch-handle"></span>
            </label>
            <span class="doodle-mode-text signup-text">注册</span>
          </div>

          <div class="doodle-card-scene">
            <svg class="doodle-svg doodle-star" viewBox="0 0 24 24" fill="#ffd166" stroke="var(--ink)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <svg class="doodle-svg doodle-sparkle" viewBox="0 0 24 24" fill="#06d6a0" stroke="var(--ink)" stroke-width="1.5">
              <path d="M12 2 Q12 12 22 12 Q12 12 12 22 Q12 12 2 12 Q12 12 12 2 Z"></path>
            </svg>
            <svg class="doodle-svg doodle-swirl" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-linecap="round">
              <path d="M3 12 C 3 5 10 5 16 5 C 20 5 21 9 18 12 C 15 15 10 13 12 9 C 14 5 22 9 21 16"></path>
            </svg>

            <div class="doodle-card-inner">
              <!-- Login Side -->
              <div class="doodle-card-front">
                <div class="doodle-title">欢迎回来！</div>
                <form class="doodle-form" id="loginForm" action="">
                  <div class="doodle-input-wrapper">
                    <input class="doodle-input" name="username" placeholder="用户名" type="text" required />
                  </div>
                  <div class="doodle-input-wrapper">
                    <input class="doodle-input" name="password" placeholder="密码" type="password" required />
                    <button type="button" class="password-toggle-btn" aria-label="切换密码可见性" tabindex="-1">
                      <i class="bi bi-eye"></i>
                    </button>
                  </div>
                  <button type="submit" class="doodle-btn">进入！</button>
                  <p style="font-size:12px;color:var(--ink);opacity:0.6;margin:0">默认管理员：admin / admin123</p>
                </form>
              </div>

              <!-- Register Side -->
              <div class="doodle-card-back">
                <div class="doodle-title doodle-title-alt">注册！</div>
                <form class="doodle-form" id="registerForm" action="">
                  <div class="doodle-input-wrapper">
                    <input class="doodle-input" name="username" placeholder="用户名（至少2个字符）" type="text" required minlength="2" />
                  </div>
                  <div class="doodle-input-wrapper">
                    <input class="doodle-input" name="password" placeholder="密码（至少4个字符）" type="password" required minlength="4" />
                    <button type="button" class="password-toggle-btn" aria-label="切换密码可见性" tabindex="-1">
                      <i class="bi bi-eye"></i>
                    </button>
                  </div>
                  <div class="doodle-input-wrapper">
                    <input class="doodle-input" name="password2" placeholder="确认密码" type="password" required />
                    <button type="button" class="password-toggle-btn" aria-label="切换密码可见性" tabindex="-1">
                      <i class="bi bi-eye"></i>
                    </button>
                  </div>
                  <button type="submit" class="doodle-btn doodle-btn-alt">确认！</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    // Login
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = e.target.username.value.trim();
      const password = e.target.password.value;
      const btn = e.target.querySelector('button');
      btn.disabled = true;
      btn.textContent = '登录中...';

      const result = await login(username, password);
      if (result.success) {
        showToast('登录成功', 'success');
        renderNavbar();
        location.hash = '#/home';
      } else {
        showToast(result.message, 'error');
        btn.disabled = false;
        btn.textContent = '进入！';
      }
    });

    // Register
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = e.target.username.value.trim();
      const password = e.target.password.value;
      const password2 = e.target.password2.value;
      const btn = e.target.querySelector('button');

      if (password !== password2) {
        showToast('两次输入的密码不一致', 'warning');
        return;
      }

      btn.disabled = true;
      btn.textContent = '注册中...';

      const result = await register(username, password);
      if (result.success) {
        showToast('注册成功', 'success');
        renderNavbar();
        location.hash = '#/home';
      } else {
        showToast(result.message, 'error');
        btn.disabled = false;
        btn.textContent = '确认！';
      }
    });

    // Wire up show/hide toggles for password inputs. Toggle is part of the wrapper
    // markup (rendered once), so it stays in the DOM across focus changes. Visibility
    // is controlled by focus/blur — shows only while the field is focused, hides on
    // blur. Independent of input.value so empty fields also reveal the button when
    // clicked.
    container.querySelectorAll('.password-toggle-btn').forEach(btn => {
      const wrapper = btn.closest('.doodle-input-wrapper');
      if (!wrapper) return;
      const input = wrapper.querySelector('input');
      if (!input) return;

      input.addEventListener('focus', () => { btn.style.display = 'flex'; });
      input.addEventListener('blur', () => { btn.style.display = 'none'; });

      // Keep input focused on mousedown so the blur handler doesn't hide the
      // button mid-click (which would cause click to never fire in some browsers,
      // making the toggle and icon swap silently fail).
      btn.addEventListener('mousedown', (e) => { e.preventDefault(); });

      btn.addEventListener('click', () => {
        const showing = input.type === 'text';
        // Changing input.type resets the caret to position 0 in most browsers,
        // and that reset happens AFTER our synchronous setSelectionRange. Defer
        // the restore to the next tick so it survives the browser's reset.
        const selStart = input.selectionStart;
        const selEnd = input.selectionEnd;
        input.type = showing ? 'password' : 'text';
        const icon = btn.querySelector('i');
        if (icon) icon.className = showing ? 'bi bi-eye' : 'bi bi-eye-slash';
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
      appContent.style.background = 'var(--color-bg)';
      appContent.style.overflow = '';
      appContent.classList.remove('login-page-content');
    }
  }
};

window._loginPage = _loginPage;
