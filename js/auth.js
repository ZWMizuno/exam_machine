// === Authentication Module ===

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode("exam_machine_salt_" + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function register(username, password) {
  if (!username || !password) return { success: false, message: '用户名和密码不能为空' };
  if (username.length < 2) return { success: false, message: '用户名至少2个字符' };
  if (password.length < 4) return { success: false, message: '密码至少4个字符' };

  const existing = await getUserByUsername(username);
  if (existing) return { success: false, message: '用户名已存在' };

  const passwordHash = await hashPassword(password);
  const user = { username, passwordHash, role: 'user', createdAt: new Date().toISOString() };
  const id = await createUser(user);
  const newUser = { id, username, role: 'user' };
  persistSession(newUser);
  setState({ currentUser: newUser });
  return { success: true, user: newUser };
}

async function login(username, password) {
  if (!username || !password) return { success: false, message: '请输入用户名和密码' };

  const user = await getUserByUsername(username);
  if (!user) return { success: false, message: '用户名不存在' };

  const passwordHash = await hashPassword(password);
  if (user.passwordHash !== passwordHash) return { success: false, message: '密码错误' };

  const sessionUser = { id: user.id, username: user.username, role: user.role };
  persistSession(sessionUser);
  setState({ currentUser: sessionUser });
  return { success: true, user: sessionUser };
}

function logout() {
  localStorage.removeItem('exam_machine_session');
  setState({ currentUser: null, breadcrumb: [] });
  location.hash = '#/login';
}

function persistSession(user) {
  localStorage.setItem('exam_machine_session', JSON.stringify(user));
}

async function restoreSession() {
  const stored = localStorage.getItem('exam_machine_session');
  if (!stored) return null;
  try {
    const user = JSON.parse(stored);
    const dbUser = await getUserById(user.id);
    if (!dbUser) { localStorage.removeItem('exam_machine_session'); return null; }
    const sessionUser = { id: dbUser.id, username: dbUser.username, role: dbUser.role };
    setState({ currentUser: sessionUser });
    return sessionUser;
  } catch (e) {
    localStorage.removeItem('exam_machine_session');
    return null;
  }
}

function getCurrentUser() { return getState().currentUser; }
function isAdmin() { const u = getCurrentUser(); return u && u.role === 'admin'; }
function isLoggedIn() { return !!getCurrentUser(); }
