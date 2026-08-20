const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const errors = [];
  const consoleErrors = [];

  page.on('pageerror', err => errors.push({ type: 'pageerror', message: err.message, stack: err.stack }));
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 15000 });

    // Wait a bit for any async JS to run
    await page.waitForTimeout(2000);

    // Check if login page loaded
    const content = await page.content();
    const hasLoginForm = content.includes('login') || content.includes('登录') || content.includes('app-content');
    console.log('Page loaded, has content:', hasLoginForm);

    // Try navigating to home (login first)
    // Check for navbar
    const navbar = await page.$('#app-navbar');
    console.log('Navbar element found:', !!navbar);

    // Check for sidebar
    const sidebar = await page.$('#examSidebar');
    console.log('Sidebar element found:', !!sidebar);

  } catch (e) {
    console.log('Navigation error:', e.message);
  }

  console.log('\n=== PAGE ERRORS ===');
  errors.forEach(e => console.log(`[${e.type}] ${e.message}${e.stack ? '\n' + e.stack : ''}`));

  console.log('\n=== CONSOLE ERRORS ===');
  consoleErrors.forEach(e => console.log(e));

  console.log('\nTotal page errors:', errors.length);
  console.log('Total console errors:', consoleErrors.length);

  await browser.close();
})();
