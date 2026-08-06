// === Reusable Pagination Component ===

function renderPagination(container, { total, pageSize, current, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, current), totalPages);

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let pageNums = [];
  const maxVisible = 7;
  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pageNums.push(i);
  } else {
    pageNums.push(1);
    let start = Math.max(2, page - 2);
    let end = Math.min(totalPages - 1, page + 2);
    if (page <= 3) { end = 5; }
    if (page >= totalPages - 2) { start = totalPages - 4; }
    if (start > 2) pageNums.push('...');
    for (let i = start; i <= end; i++) pageNums.push(i);
    if (end < totalPages - 1) pageNums.push('...');
    pageNums.push(totalPages);
  }

  const html = `
    <div class="pagination-wrapper">
      <nav aria-label="Page navigation">
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item ${page <= 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${Math.max(1, page - 1)}"><i class="bi bi-chevron-left"></i></a>
          </li>
          ${pageNums.map(p => {
            if (p === '...') return '<li class="page-item disabled"><span class="page-link">...</span></li>';
            return `<li class="page-item ${p === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${p}">${p}</a></li>`;
          }).join('')}
          <li class="page-item ${page >= totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${Math.min(totalPages, page + 1)}"><i class="bi bi-chevron-right"></i></a>
          </li>
        </ul>
      </nav>
      <span class="ms-2 text-muted small">共 ${total} 条</span>
      <input type="number" class="form-control form-control-sm page-jump ms-2" min="1" max="${totalPages}" placeholder="跳转" style="width:70px">
      <button class="btn btn-sm btn-outline-secondary ms-1 page-jump-btn">Go</button>
    </div>`;

  container.innerHTML = html;

  container.querySelectorAll('.page-link[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const p = parseInt(link.dataset.page);
      if (p !== page) onChange(p);
    });
  });

  const jumpBtn = container.querySelector('.page-jump-btn');
  const jumpInput = container.querySelector('.page-jump');
  if (jumpBtn && jumpInput) {
    jumpBtn.addEventListener('click', () => {
      const p = parseInt(jumpInput.value);
      if (p >= 1 && p <= totalPages) onChange(p);
    });
    jumpInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const p = parseInt(jumpInput.value);
        if (p >= 1 && p <= totalPages) onChange(p);
      }
    });
  }
}
