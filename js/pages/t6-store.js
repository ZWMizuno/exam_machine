// === T6 Skin Store Page ===

let _t6Filter = 'all'; // 'all' | 'owned' | 'unowned'

const _t6StorePage = {
  async render(container) {
    const user = getCurrentUser();
    const userCoins = await getUserCoins(user.id);
    const ownedSkins = await getUserOwnedSkins(user.id);

    // 从 window 变量动态构建分组（避免硬编码索引）
    const skinGroups = [
      { names: window._SKIN_CLASSIC_NAMES, label: window.SKIN_GROUP_NAMES[0] },
      { names: window._SKIN_FESTIVE_NAMES, label: window.SKIN_GROUP_NAMES[1] },
      { names: window._SKIN_GENTLE_NAMES,  label: window.SKIN_GROUP_NAMES[2] },
      { names: window._SKIN_SWEET_NAMES,   label: window.SKIN_GROUP_NAMES[3] },
    ];

    let globalIdx = 0;
    const groups = skinGroups.map((g, gi) => {
      const indices = g.names.map(() => globalIdx++);
      return { name: g.label, indices };
    });

    let groupsHtml = '';
    let totalVisible = 0;
    for (const [gi, grp] of groups.entries()) {
      const price = window.SKIN_PRICES[gi];
      const priceLabel = price === 0 ? '默认拥有' : price + ' 硬币';

      let cardsHtml = '';
      for (const idx of grp.indices) {
        const scheme = BOOK_COLOR_SCHEMES[idx];
        const name = window.SKIN_DISPLAY_NAMES[idx];
        const owned = ownedSkins.includes(idx);

        // 根据筛选条件决定是否显示
        const show =
          (_t6Filter === 'all') ||
          (_t6Filter === 'owned' && owned) ||
          (_t6Filter === 'unowned' && !owned);

        if (!show) continue;
        totalVisible++;

        cardsHtml +=
          '<div class="store-showcase' + (owned ? '' : ' clickable') + '" data-skin-idx="' + idx + '"' + (owned ? '' : ' onclick="t6BuySkin(' + idx + ')"') + '>' +
            '<div class="store-book-wrap">' +
              '<div class="store-book" style="--logo:' + scheme.logo + ';--text:' + scheme.text + ';--bookmark:' + scheme.bookmark + ';--book:' + scheme.book + ';--bm-text:' + getBookmarkTextColor(scheme.bookmark) + '">' +
                '<div class="store-book-logo"><i class="bi bi-book-fill"></i></div>' +
                '<div class="store-book-body"><span class="store-book-center-n">N</span></div>' +
                '<div class="store-book-bookmark"></div>' +
              '</div>' +
              '<div class="store-book-shelf"></div>' +
            '</div>' +
            '<div class="store-price-tag">' +
              '<div class="store-skin-name">' + name + '</div>' +
              '<div class="store-skin-price-row">' +
                (owned ?
                  '<span class="store-price-free">已拥有</span>' :
                  (price === 0 ?
                    '<span class="store-price-free">免费</span>' :
                    '<svg class="store-coin-icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#F5C23A" stroke="#C9920A" stroke-width="1.5"/><circle cx="12" cy="12" r="7" fill="#F5D76E"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="#8B6914" font-family="serif">$</text></svg><span class="store-price-value">' + price + '</span>'
                  )
                ) +
              '</div>' +
            '</div>' +
          '</div>';
      }

      // 该类别下没有任何可显示的皮肤则不显示该类别
      if (!cardsHtml) continue;

      groupsHtml +=
        '<div class="store-group">' +
          '<div class="store-group-header">' +
            '<h5 class="store-group-name">' + grp.name + '</h5>' +
          '</div>' +
          '<div class="store-showcase-grid">' + cardsHtml + '</div>' +
        '</div>';
    }

    const emptyStateHtml =
      '<div class="empty-state" style="background:var(--paper);border:1px solid var(--color-border);border-radius:4px 12px 4px 12px;padding:3rem 2rem;">' +
        '<i class="bi bi-palette" style="color:var(--paper-3)"></i>' +
        '<p style="margin-bottom:1rem;font-family:var(--font-display);color:var(--ink-soft)">' +
          (_t6Filter === 'owned' ? '尚未收藏任何皮' : _t6Filter === 'unowned' ? '皆已收齐' : '无可显之皮') +
        '</p>' +
        (_t6Filter !== 'all' ? '<a href="#/t6" class="btn-seal btn-seal-sm" onclick="event.preventDefault();_t6Filter=\'all\';_t6StorePage.render(document.getElementById(\'app-content\'));">看全部</a>' : '') +
      '</div>';

    // Header actions
    setHeaderActions('');

    container.innerHTML =
      '<div class="store-page"><div class="store-page-inner">' +
        '<div class="store-filter-tabs mb-3">' +
          '<div class="tab-group">' +
            '<input type="radio" id="filter-all" name="store-filter" value="all" ' + (_t6Filter === 'all' ? 'checked' : '') + ' onchange="_t6Filter=\'all\';_t6StorePage.render(document.getElementById(\'app-content\'))">' +
            '<label for="filter-all"><span>全部</span></label>' +
          '</div>' +
          '<div class="tab-group">' +
            '<input type="radio" id="filter-owned" name="store-filter" value="owned" ' + (_t6Filter === 'owned' ? 'checked' : '') + ' onchange="_t6Filter=\'owned\';_t6StorePage.render(document.getElementById(\'app-content\'))">' +
            '<label for="filter-owned"><span>已拥有</span></label>' +
          '</div>' +
          '<div class="tab-group">' +
            '<input type="radio" id="filter-unowned" name="store-filter" value="unowned" ' + (_t6Filter === 'unowned' ? 'checked' : '') + ' onchange="_t6Filter=\'unowned\';_t6StorePage.render(document.getElementById(\'app-content\'))">' +
            '<label for="filter-unowned"><span>未拥有</span></label>' +
          '</div>' +
        '</div>' +
        (totalVisible === 0 ? emptyStateHtml : groupsHtml) +
      '</div></div>';

    // Apply store background to app-content
    document.getElementById('app-content').classList.add('store-bg');
  },

  async buySkin(colorIndex, userId) {
    const price = window.getSkinPrice(colorIndex);
    const userCoins = await getUserCoins(userId);

    if (userCoins < price) {
      showToast('硬币不足，无法购买', 'error');
      return;
    }

    const name = window.SKIN_DISPLAY_NAMES[colorIndex];
    const confirmed = await showConfirm('确认购买', '确定花费 ' + price + ' 枚硬币购买「' + name + '」皮肤吗？', '购买', '取消');
    if (!confirmed) return;

    await updateUserCoins(userId, -price);
    await addUserSkin(userId, colorIndex);
    emit('coins:updated');
    showToast('「' + name + '」购买成功！', 'success');

    this.render(document.getElementById('app-content'));
  },

  async destroy() {
    document.getElementById('app-content').classList.remove('store-bg');
  }
};

window._t6StorePage = _t6StorePage;
window.t6BuySkin = async function(colorIndex) {
  const user = getCurrentUser();
  await _t6StorePage.buySkin(colorIndex, user.id);
};
