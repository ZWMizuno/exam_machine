// === Home / Desk Overview Page ===

const _homePage = {
  async render(container) {
    // Render HTML synchronously, then upgrade with data
    try {
      const user = (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || { username: '访客' };

      // Localised greeting
      const now = new Date();
      const hour = now.getHours();
      const greet = hour < 6 ? '夜深了' : hour < 12 ? '早安' : hour < 14 ? '午安' : hour < 18 ? '下午好' : hour < 22 ? '晚上好' : '夜深了';
      const dateText = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

      if (typeof setHeaderActions === 'function') {
        setHeaderActions(
          '<button class="btn-tag" onclick="exportAllData()"><i class="bi bi-download"></i> 备份</button>' +
          '<button class="btn-tag" onclick="document.getElementById(\'importFileInput\').click()"><i class="bi bi-upload"></i> 恢复</button>'
        );
      }

      container.innerHTML = [
        '<div class="content-narrow">',
          '<div class="home-welcome">',
            '<div class="home-welcome-text">',
              '<h2 class="home-welcome-greeting">', greet, '，', escapeHtml(user.username), '。</h2>',
              '<p class="home-welcome-date">今天是 ', dateText, '</p>',
            '</div>',
            '<div class="home-welcome-seal" title="学而时习之">习</div>',
          '</div>',

          '<div class="home-stats" id="home-stats">',
            '<div class="home-stat bank"><i class="bi bi-collection home-stat-icon"></i><div class="home-stat-num" id="stat-bank">—</div><div class="home-stat-label">题库册数</div></div>',
            '<div class="home-stat q"><i class="bi bi-question-circle home-stat-icon"></i><div class="home-stat-num" id="stat-q">—</div><div class="home-stat-label">题数</div></div>',
            '<div class="home-stat exam"><i class="bi bi-clock-history home-stat-icon"></i><div class="home-stat-num" id="stat-exam">—</div><div class="home-stat-label">考 · 练次数</div></div>',
            '<div class="home-stat wrong"><i class="bi bi-journal-x home-stat-icon"></i><div class="home-stat-num" id="stat-wrong">—</div><div class="home-stat-label">错题</div></div>',
          '</div>',

          '<h6 class="home-section-title">工 · 具 · 印 · 章</h6>',
          '<div class="home-tools">',
            '<a class="home-tool home-tool-jade" href="#/t1/exam"><div class="home-tool-seal"><i class="bi bi-pencil-square"></i></div><div class="home-tool-name">开考</div><div class="home-tool-sub">计时 · 评分</div></a>',
            '<a class="home-tool" href="#/t1/practice"><div class="home-tool-seal"><i class="bi bi-journal-text"></i></div><div class="home-tool-name">开练</div><div class="home-tool-sub">即时纠错</div></a>',
            '<a class="home-tool home-tool-gold" href="#/t2"><div class="home-tool-seal"><i class="bi bi-folder2-open"></i></div><div class="home-tool-name">卷宗</div><div class="home-tool-sub">题库管理</div></a>',
            '<a class="home-tool" href="#/t4"><div class="home-tool-seal"><i class="bi bi-book"></i></div><div class="home-tool-name">拾遗</div><div class="home-tool-sub">扫盲复习</div></a>',
            '<a class="home-tool home-tool-gold" href="#/t3"><div class="home-tool-seal"><i class="bi bi-clock-history"></i></div><div class="home-tool-name">履历</div><div class="home-tool-sub">历史回顾</div></a>',
            '<a class="home-tool" href="#/t5"><div class="home-tool-seal"><i class="bi bi-file-earmark-text"></i></div><div class="home-tool-name">拟卷</div><div class="home-tool-sub">打印卷子</div></a>',
          '</div>',

          '<div class="paper-card" style="margin-top:8px">',
            '<h6 class="paper-card-title">学课提示</h6>',
            '<p style="margin:0;font-family:var(--font-hand);color:var(--ink-soft);font-size:1.05rem;line-height:1.7">',
              '点左栏「<strong style="color:var(--jade)">贡院</strong>」可开始一次新的考试或练习。',
              '点「<strong style="color:var(--seal)">卷宗</strong>」管理你的题库。',
              '错题会自动收入「<strong style="color:var(--jade)">贡院</strong>」书铺，扫一遍错题收获颇多。',
            '</p>',
          '</div>',

          '<input type="file" id="importFileInput" accept=".json" style="display:none" onchange="handleImportFile(this)">',
        '</div>'
      ].join('');

      // Load stats asynchronously and update DOM in place
      if (user && user.id && typeof db !== 'undefined') {
        _homePage._loadStats(user.id);
      }
    } catch (err) {
      console.error('Home render failed', err);
      container.innerHTML = '<div class="paper-card"><h6 class="paper-card-title">案头加载失败</h6><p style="font-family:var(--font-hand);color:var(--seal)">' + escapeHtml(err.message || String(err)) + '</p></div>';
    }
  },

  _loadStats(userId) {
    // Each count wrapped so a single failure doesn't kill the rest
    const safe = (fn, elId) => {
      Promise.resolve()
        .then(fn)
        .then(v => {
          const el = document.getElementById(elId);
          if (!el) return;
          el.textContent = v;
          el.classList.add('loaded');
        })
        .catch(() => { /* leave dash */ });
    };
    safe(() => db.banks.count(), 'stat-bank');
    safe(() => db.questions.count(), 'stat-q');
    safe(() => db.history.where('userId').equals(userId).count(), 'stat-exam');
    safe(() => db.wrongQuestions.where('userId').equals(userId).count(), 'stat-wrong');
  },

  destroy() {}
};

async function handleImportFile(input) {
  if (!input.files || !input.files[0]) return;
  if (typeof importAllData === 'function') {
    await importAllData(input.files[0]);
  }
  input.value = '';
}

window._homePage = _homePage;
