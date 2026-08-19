// === App Entry Point ===
// Phase 0 pages will be registered in their page files via window._xxxPage
// The router references them, so they must load before router starts.

async function initApp() {
  try {
    // Request persistent storage to prevent browser from deleting data
    await requestPersistentStorage();

    // Initialize database & seed default admin
    await seedDefaultAdmin();

    // Restore session if exists
    const user = await restoreSession();

    // Render navbar if logged in
    if (user) {
      renderNavbar();
      renderBreadcrumb();
    }

    // Start router
    await startRouter();

    console.log('Exam Machine initialized successfully');
  } catch (e) {
    console.error('App initialization failed:', e);
    document.getElementById('app-content').innerHTML =
      `<div class="alert alert-danger m-4"><h4>初始化失败</h4><p>${escapeHtml(e.message)}</p><p>请尝试刷新页面或清除浏览器数据。</p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', initApp);
