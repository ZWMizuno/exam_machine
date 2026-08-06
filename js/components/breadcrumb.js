// === Breadcrumb Component ===

function renderBreadcrumb() {
  const container = document.getElementById('app-breadcrumb');
  if (!container) return;

  const breadcrumb = getState().breadcrumb;
  if (!breadcrumb || breadcrumb.length === 0) {
    container.innerHTML = '';
    return;
  }

  const items = breadcrumb.map((crumb, i) => {
    const isLast = i === breadcrumb.length - 1;
    if (isLast || !crumb.href) {
      return `<li class="breadcrumb-item active" aria-current="page">${escapeHtml(crumb.label)}</li>`;
    }
    return `<li class="breadcrumb-item"><a href="${crumb.href}">${escapeHtml(crumb.label)}</a></li>`;
  }).join('');

  container.innerHTML = `<nav aria-label="breadcrumb"><ol class="breadcrumb">${items}</ol></nav>`;
}

// Subscribe to breadcrumb changes
subscribe('breadcrumb:changed', () => renderBreadcrumb());
