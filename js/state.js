// === Simple Pub/Sub State Management ===

const _state = {
  currentUser: null,
  breadcrumb: [],
  currentExam: null  // active exam/practice session reference
};

const _listeners = {};

function subscribe(event, fn) {
  if (!_listeners[event]) _listeners[event] = [];
  _listeners[event].push(fn);
  return () => { _listeners[event] = _listeners[event].filter(f => f !== fn); };
}

function emit(event, data) {
  if (!_listeners[event]) return;
  for (const fn of _listeners[event]) {
    try { fn(data); } catch (e) { console.error(`State listener error [${event}]:`, e); }
  }
}

function getState() { return _state; }

function setState(partial) {
  Object.assign(_state, partial);
  if (partial.currentUser !== undefined) emit('auth:changed', _state.currentUser);
  if (partial.breadcrumb !== undefined) emit('breadcrumb:changed', _state.breadcrumb);
  emit('state:changed', _state);
}
