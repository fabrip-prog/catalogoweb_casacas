/* ===================================================================
   CasacasStore – Admin Panel Logic (Productos + Ligas + Equipos)
   =================================================================== */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  let editingProductId = null;
  let editingLeagueId = null;
  let editingTeamId = null;
  let currentTab = 'products';

  document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
  });

  // ══════════════════════════════════════════════════════════════
  //  Auth
  // ══════════════════════════════════════════════════════════════
  function checkAuth() {
    if (store.isAuthenticated()) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    $('#loginSection').classList.remove('hidden');
    $('#dashboardSection').classList.add('hidden');
  }

  function showDashboard() {
    $('#loginSection').classList.add('hidden');
    $('#dashboardSection').classList.remove('hidden');
    renderStats();
    switchTab('products');
  }

  window.handleLogin = function (e) {
    e.preventDefault();
    const user = $('#loginUser').value.trim();
    const pass = $('#loginPass').value;

    if (store.login(user, pass)) {
      showDashboard();
      showAdminNotif('Bienvenido al panel de administración', 'success');
    } else {
      $('#loginError').classList.remove('hidden');
      setTimeout(() => $('#loginError')?.classList.add('hidden'), 3000);
    }
  };

  window.handleLogout = function () {
    store.logout();
    showLogin();
  };

  // ══════════════════════════════════════════════════════════════
  //  Tab Switching
  // ══════════════════════════════════════════════════════════════
  window.switchTab = function (tab) {
    currentTab = tab;

    // Update tab buttons
    $$('[data-tab-btn]').forEach(btn => {
      btn.classList.toggle('bg-emerald-500', btn.dataset.tabBtn === tab);
      btn.classList.toggle('text-white', btn.dataset.tabBtn === tab);
      btn.classList.toggle('bg-gray-200', btn.dataset.tabBtn !== tab);
      btn.classList.toggle('text-gray-700', btn.dataset.tabBtn !== tab);
    });

    // Show/hide sections
    $$('[data-tab-content]').forEach(section => {
      section.classList.toggle('hidden', section.dataset.tabContent !== tab);
    });

    // Render the active tab's content
    if (tab === 'products') {
      populateProductFormSelects();
      renderProductList();
    } else if (tab === 'leagues') {
      renderLeagueList();
    } else if (tab === 'teams') {
      populateTeamFormLeagueSelect();
      renderTeamList();
    } else if (tab === 'settings') {
      renderSettings();
    }
  };

  // ══════════════════════════════════════════════════════════════
  //  Dashboard Stats
  // ══════════════════════════════════════════════════════════════
  function renderStats() {
    const products = store.getProducts();
    const leagues = store.getLeagues();
    const teams = store.getTeams();
    const totalStock = store.getTotalStock();

    $('#statProducts').textContent = products.length;
    $('#statLeagues').textContent = leagues.length;
    $('#statTeams').textContent = teams.length;
    $('#statStock').textContent = totalStock;

    const lowStock = products.filter(p => {
      const t = Object.values(p.sizes).reduce((s, v) => s + v, 0);
      return t > 0 && t <= 5;
    });
    const outOfStock = products.filter(p => {
      const t = Object.values(p.sizes).reduce((s, v) => s + v, 0);
      return t === 0;
    });

    const alertsEl = $('#stockAlerts');
    if (!alertsEl) return;

    let html = '';
    if (outOfStock.length > 0) {
      html += `<div class="bg-red-50 border border-red-200 rounded-xl p-3">
        <p class="text-red-700 font-semibold text-sm">⚠️ ${outOfStock.length} producto(s) sin stock</p>
        <ul class="mt-1 text-xs text-red-600">${outOfStock.slice(0, 5).map(p => `<li class="truncate">• ${p.title}</li>`).join('')}</ul>
      </div>`;
    }
    if (lowStock.length > 0) {
      html += `<div class="bg-amber-50 border border-amber-200 rounded-xl p-3 ${outOfStock.length ? 'mt-2' : ''}">
        <p class="text-amber-700 font-semibold text-sm">📦 ${lowStock.length} producto(s) con stock bajo</p>
        <ul class="mt-1 text-xs text-amber-600">${lowStock.slice(0, 5).map(p => `<li class="truncate">• ${p.title}</li>`).join('')}</ul>
      </div>`;
    }
    if (!html) {
      html = `<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
        <p class="text-emerald-700 font-semibold text-sm">✅ Todo el inventario en orden</p>
      </div>`;
    }
    alertsEl.innerHTML = html;
  }

  // ══════════════════════════════════════════════════════════════
  //  PRODUCTOS – List
  // ══════════════════════════════════════════════════════════════
  let adminSearch = '';
  let adminLeagueFilter = '';

  window.handleAdminSearch = function (value) {
    adminSearch = value.toLowerCase().trim();
    renderProductList();
  };

  window.handleAdminLeagueFilter = function (value) {
    adminLeagueFilter = value;
    renderProductList();
  };

  function renderProductList() {
    const container = $('#productList');
    if (!container) return;

    let products = store.getProducts();
    if (adminLeagueFilter) products = products.filter(p => p.leagueId === adminLeagueFilter);
    if (adminSearch) {
      products = products.filter(p =>
        p.title.toLowerCase().includes(adminSearch) ||
        p.teamId.toLowerCase().includes(adminSearch)
      );
    }

    if (products.length === 0) {
      container.innerHTML = `<div class="text-center py-12 text-gray-400"><p class="text-4xl mb-2">📦</p><p class="font-semibold">No se encontraron productos</p></div>`;
      return;
    }

    container.innerHTML = products.map(p => {
      const team = store.getTeamById(p.teamId);
      const totalStock = Object.values(p.sizes).reduce((s, v) => s + v, 0);
      const stockColor = totalStock === 0 ? 'text-red-500' : totalStock <= 5 ? 'text-amber-500' : 'text-emerald-500';

      return `
        <div class="admin-row bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3 items-start">
          <img src="${p.images[0]}" alt="${p.title}" class="w-16 h-20 object-cover rounded-lg flex-shrink-0 bg-gray-100"
               onerror="this.src='https://placehold.co/64x80/e2e8f0/94a3b8?text=?'">
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-sm text-gray-800 line-clamp-2">${p.title}</h4>
            <div class="flex flex-wrap items-center gap-2 mt-1">
              ${team ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style="background:${team.color}">${team.name}</span>` : ''}
              ${p.featured ? '<span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400 text-yellow-900">⭐</span>' : ''}
              ${p.isNew ? '<span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white">🆕</span>' : ''}
              ${p.originalPrice && p.originalPrice > p.price
                ? `<span class="text-xs text-red-500 font-bold">-${Math.round((1 - p.price/p.originalPrice)*100)}%</span>
                   <span class="text-xs text-gray-400 line-through">${CONFIG.currency}${p.originalPrice.toLocaleString('es-AR')}</span>
                   <span class="text-xs text-red-600 font-bold">${CONFIG.currency}${p.price.toLocaleString('es-AR')}</span>`
                : `<span class="text-xs text-gray-500">${CONFIG.currency}${p.price.toLocaleString('es-AR')}</span>`
              }
            </div>
            <div class="flex flex-wrap gap-1.5 mt-2">
              ${Object.entries(p.sizes).map(([size, stock]) => `
                <span class="text-[10px] px-2 py-0.5 rounded-full border
                  ${stock === 0 ? 'bg-red-50 border-red-200 text-red-500' : stock <= 3 ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}">
                  ${size}: ${stock}</span>`).join('')}
            </div>
            <p class="text-xs mt-1.5 font-semibold ${stockColor}">Stock total: ${totalStock}</p>
          </div>
          <div class="flex sm:flex-col gap-2 flex-shrink-0 self-start">
            <button onclick="editProduct('${p.id}')" class="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-colors">✏️ Editar</button>
            <button onclick="deleteProduct('${p.id}', '${p.title.replace(/'/g, "\\'")}')" class="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors">🗑️ Eliminar</button>
          </div>
        </div>`;
    }).join('');
  }

  // ══════════════════════════════════════════════════════════════
  //  PRODUCTOS – Form
  // ══════════════════════════════════════════════════════════════
  function populateProductFormSelects() {
    const leagueSelect = $('#formLeague');
    const filterSelect = $('#filterLeague');
    const leagues = store.getLeagues();

    if (leagueSelect) {
      leagueSelect.innerHTML = `<option value="">Seleccionar liga...</option>` +
        leagues.map(l => `<option value="${l.id}">${l.icon} ${l.name}</option>`).join('');
    }
    if (filterSelect) {
      filterSelect.innerHTML = `<option value="">Todas las ligas</option>` +
        leagues.map(l => `<option value="${l.id}">${l.icon} ${l.name}</option>`).join('');
    }
    leagueSelect?.removeEventListener('change', updateProductTeamSelect);
    leagueSelect?.addEventListener('change', updateProductTeamSelect);
  }

  function updateProductTeamSelect() {
    const leagueId = $('#formLeague')?.value;
    const teamSelect = $('#formTeam');
    if (!teamSelect) return;
    if (!leagueId) {
      teamSelect.innerHTML = `<option value="">Primero seleccioná una liga</option>`;
      return;
    }
    const teams = store.getTeamsByLeague(leagueId);
    teamSelect.innerHTML = `<option value="">Seleccionar equipo...</option>` +
      teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  }

  window.showProductForm = function (mode = 'add') {
    const form = $('#productForm');
    if (!form) return;
    form.classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (mode === 'add') {
      $('#formTitleLabel').textContent = '➕ Nuevo Producto';
      $('#productFormEl').reset();
      editingProductId = null;
      updateProductTeamSelect();
    }
  };

  window.hideProductForm = function () {
    $('#productForm')?.classList.add('hidden');
    editingProductId = null;
  };

  window.editProduct = function (productId) {
    const product = store.getProductById(productId);
    if (!product) return;
    editingProductId = productId;
    showProductForm('edit');
    $('#formTitleLabel').textContent = '✏️ Editar Producto';

    $('#formProductTitle').value = product.title;
    $('#formDescription').value = product.description;
    $('#formPrice').value = product.price;
    $('#formOriginalPrice').value = product.originalPrice || '';
    $('#formFeatured').checked = !!product.featured;
    $('#formIsNew').checked = !!product.isNew;
    $('#formLeague').value = product.leagueId;
    updateProductTeamSelect();
    setTimeout(() => { $('#formTeam').value = product.teamId; }, 50);
    $('#formImages').value = product.images.join('\n');
    $('#formStockS').value = product.sizes.S || 0;
    $('#formStockM').value = product.sizes.M || 0;
    $('#formStockL').value = product.sizes.L || 0;
    $('#formStockXL').value = product.sizes.XL || 0;
    $('#formStockXXL').value = product.sizes.XXL || 0;
  };

  window.deleteProduct = function (productId, title) {
    if (confirm(`¿Eliminar "${title}"?\n\nEsta acción no se puede deshacer.`)) {
      store.deleteProduct(productId);
      renderProductList();
      renderStats();
      showAdminNotif('Producto eliminado', 'success');
    }
  };

  window.handleProductSubmit = async function (e) {
    e.preventDefault();
    const title = $('#formProductTitle').value.trim();
    const description = $('#formDescription').value.trim();
    const price = parseInt($('#formPrice').value) || 0;
    const leagueId = $('#formLeague').value;
    const teamId = $('#formTeam').value;
    const imagesRaw = $('#formImages').value.trim();
    const images = imagesRaw ? imagesRaw.split('\n').map(s => s.trim()).filter(Boolean) : [];

    if (!title || !leagueId || !teamId || price <= 0) {
      showAdminNotif('Completá todos los campos obligatorios', 'error');
      return;
    }

    const fileInput = $('#formImageUpload');
    if (fileInput && fileInput.files.length > 0 && typeof storage !== 'undefined') {
      const btn = $('#productFormEl button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = '⏳ Subiendo fotos...';
      btn.disabled = true;

      try {
        for (const file of fileInput.files) {
          const ref = storage.ref(`productos/${Date.now()}_${file.name}`);
          await ref.put(file);
          const url = await ref.getDownloadURL();
          images.push(url);
        }
      } catch (err) {
        console.error("Error al subir imagen:", err);
        showAdminNotif('Error al subir imagen. ¿Configuraste Storage?', 'error');
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
      }

      btn.innerHTML = originalText;
      btn.disabled = false;
    }

    if (images.length === 0) {
      const team = store.getTeamById(teamId);
      const color = team ? team.color.replace('#', '') : 'cccccc';
      images.push(`https://placehold.co/400x500/${color}/ffffff?text=${encodeURIComponent(title.substring(0, 30))}&font=montserrat`);
    }

    const sizes = {
      S: parseInt($('#formStockS').value) || 0,
      M: parseInt($('#formStockM').value) || 0,
      L: parseInt($('#formStockL').value) || 0,
      XL: parseInt($('#formStockXL').value) || 0,
      XXL: parseInt($('#formStockXXL').value) || 0,
    };

    const featured = $('#formFeatured')?.checked || false;
    const isNew = $('#formIsNew')?.checked || false;
    const originalPrice = parseInt($('#formOriginalPrice').value) || null;

    const productData = {
      title, description, price, leagueId, teamId, images, sizes,
      featured, isNew, originalPrice,
      createdAt: editingProductId ? (store.getProductById(editingProductId)?.createdAt || Date.now()) : Date.now(),
    };

    if (editingProductId) {
      await store.updateProduct(editingProductId, productData);
      showAdminNotif('Producto actualizado', 'success');
    } else {
      await store.addProduct(productData);
      showAdminNotif('Producto creado', 'success');
    }

    hideProductForm();
    renderProductList();
    renderStats();
  };

  // ══════════════════════════════════════════════════════════════
  //  LIGAS – List
  // ══════════════════════════════════════════════════════════════
  function renderLeagueList() {
    const container = $('#leagueList');
    if (!container) return;

    const leagues = store.getLeagues();

    if (leagues.length === 0) {
      container.innerHTML = `<div class="text-center py-12 text-gray-400"><p class="text-4xl mb-2">🏆</p><p class="font-semibold">No hay ligas creadas</p></div>`;
      return;
    }

    container.innerHTML = leagues.map(l => {
      const teamCount = store.getTeamsByLeague(l.id).length;
      const productCount = store.getProductsByLeague(l.id).length;

      return `
        <div class="admin-row bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <span class="text-3xl flex-shrink-0">${l.icon}</span>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-sm text-gray-800">${l.name}</h4>
            <div class="flex gap-3 mt-1 text-xs text-gray-500">
              <span>⚽ ${teamCount} equipo${teamCount !== 1 ? 's' : ''}</span>
              <span>👕 ${productCount} producto${productCount !== 1 ? 's' : ''}</span>
              <span class="text-gray-400">Orden: ${l.order}</span>
            </div>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <button onclick="editLeague('${l.id}')" class="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-colors">✏️</button>
            <button onclick="deleteLeague('${l.id}', '${l.name.replace(/'/g, "\\'")}')" class="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors">🗑️</button>
          </div>
        </div>`;
    }).join('');
  }

  // ── LIGAS – Form ──
  window.showLeagueForm = function (mode = 'add') {
    const form = $('#leagueForm');
    if (!form) return;
    form.classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (mode === 'add') {
      $('#leagueFormTitle').textContent = '➕ Nueva Liga';
      $('#leagueFormEl').reset();
      editingLeagueId = null;
    }
  };

  window.hideLeagueForm = function () {
    $('#leagueForm')?.classList.add('hidden');
    editingLeagueId = null;
  };

  window.editLeague = function (leagueId) {
    const league = store.getLeagueById(leagueId);
    if (!league) return;
    editingLeagueId = leagueId;
    showLeagueForm('edit');
    $('#leagueFormTitle').textContent = '✏️ Editar Liga';
    $('#formLeagueName').value = league.name;
    $('#formLeagueIcon').value = league.icon;
    $('#formLeagueOrder').value = league.order;
  };

  window.deleteLeague = function (leagueId, name) {
    const teamCount = store.getTeamsByLeague(leagueId).length;
    const productCount = store.getProductsByLeague(leagueId).length;
    let msg = `¿Eliminar la liga "${name}"?\n`;
    if (teamCount > 0 || productCount > 0) {
      msg += `\n⚠️ ATENCIÓN: También se eliminarán:\n`;
      if (teamCount > 0) msg += `   • ${teamCount} equipo(s)\n`;
      if (productCount > 0) msg += `   • ${productCount} producto(s)\n`;
    }
    msg += `\nEsta acción no se puede deshacer.`;

    if (confirm(msg)) {
      store.deleteLeague(leagueId);
      renderLeagueList();
      renderStats();
      showAdminNotif(`Liga "${name}" eliminada`, 'success');
    }
  };

  window.handleLeagueSubmit = function (e) {
    e.preventDefault();
    const name = $('#formLeagueName').value.trim();
    const icon = $('#formLeagueIcon').value.trim() || '🏆';
    const order = parseInt($('#formLeagueOrder').value) || 1;

    if (!name) {
      showAdminNotif('El nombre de la liga es obligatorio', 'error');
      return;
    }

    if (editingLeagueId) {
      store.updateLeague(editingLeagueId, { name, icon, order });
      showAdminNotif('Liga actualizada', 'success');
    } else {
      store.addLeague({ name, icon, order });
      showAdminNotif('Liga creada', 'success');
    }

    hideLeagueForm();
    renderLeagueList();
    renderStats();
  };

  // ══════════════════════════════════════════════════════════════
  //  EQUIPOS – List
  // ══════════════════════════════════════════════════════════════
  let teamLeagueFilter = '';

  window.handleTeamLeagueFilter = function (value) {
    teamLeagueFilter = value;
    renderTeamList();
  };

  function renderTeamList() {
    const container = $('#teamList');
    if (!container) return;

    let teams = store.getTeams();
    if (teamLeagueFilter) teams = teams.filter(t => t.leagueId === teamLeagueFilter);

    if (teams.length === 0) {
      container.innerHTML = `<div class="text-center py-12 text-gray-400"><p class="text-4xl mb-2">⚽</p><p class="font-semibold">No se encontraron equipos</p></div>`;
      return;
    }

    container.innerHTML = teams.map(t => {
      const league = store.getLeagueById(t.leagueId);
      const productCount = store.getProductsByTeam(t.id).length;

      return `
        <div class="admin-row bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <span class="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm" style="background:${t.color}">
            ${t.name.substring(0, 2).toUpperCase()}
          </span>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-sm text-gray-800">${t.name}</h4>
            <div class="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
              ${league ? `<span>${league.icon} ${league.name}</span>` : '<span class="text-red-400">⚠ Sin liga</span>'}
              <span>•</span>
              <span>👕 ${productCount} producto${productCount !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full inline-block" style="background:${t.color}"></span>${t.color}</span>
            </div>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <button onclick="editTeam('${t.id}')" class="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-colors">✏️</button>
            <button onclick="deleteTeam('${t.id}', '${t.name.replace(/'/g, "\\'")}')" class="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors">🗑️</button>
          </div>
        </div>`;
    }).join('');
  }

  // ── EQUIPOS – Form ──
  function populateTeamFormLeagueSelect() {
    const select = $('#formTeamLeague');
    const filterSelect = $('#filterTeamLeague');
    const leagues = store.getLeagues();

    if (select) {
      select.innerHTML = `<option value="">Seleccionar liga...</option>` +
        leagues.map(l => `<option value="${l.id}">${l.icon} ${l.name}</option>`).join('');
    }
    if (filterSelect) {
      filterSelect.innerHTML = `<option value="">Todas las ligas</option>` +
        leagues.map(l => `<option value="${l.id}">${l.icon} ${l.name}</option>`).join('');
    }
  }

  window.showTeamForm = function (mode = 'add') {
    const form = $('#teamForm');
    if (!form) return;
    form.classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    populateTeamFormLeagueSelect();
    if (mode === 'add') {
      $('#teamFormTitle').textContent = '➕ Nuevo Equipo';
      $('#teamFormEl').reset();
      $('#formTeamColor').value = '#10b981';
      editingTeamId = null;
    }
  };

  window.hideTeamForm = function () {
    $('#teamForm')?.classList.add('hidden');
    editingTeamId = null;
  };

  window.editTeam = function (teamId) {
    const team = store.getTeamById(teamId);
    if (!team) return;
    editingTeamId = teamId;
    showTeamForm('edit');
    $('#teamFormTitle').textContent = '✏️ Editar Equipo';
    $('#formTeamName').value = team.name;
    $('#formTeamLeague').value = team.leagueId;
    $('#formTeamColor').value = team.color;
  };

  window.deleteTeam = function (teamId, name) {
    const productCount = store.getProductsByTeam(teamId).length;
    let msg = `¿Eliminar el equipo "${name}"?\n`;
    if (productCount > 0) {
      msg += `\n⚠️ ATENCIÓN: También se eliminarán ${productCount} producto(s) asociados.\n`;
    }
    msg += `\nEsta acción no se puede deshacer.`;

    if (confirm(msg)) {
      store.deleteTeam(teamId);
      renderTeamList();
      renderStats();
      showAdminNotif(`Equipo "${name}" eliminado`, 'success');
    }
  };

  window.handleTeamSubmit = function (e) {
    e.preventDefault();
    const name = $('#formTeamName').value.trim();
    const leagueId = $('#formTeamLeague').value;
    const color = $('#formTeamColor').value || '#10b981';

    if (!name || !leagueId) {
      showAdminNotif('Completá nombre y liga del equipo', 'error');
      return;
    }

    if (editingTeamId) {
      store.updateTeam(editingTeamId, { name, leagueId, color });
      showAdminNotif('Equipo actualizado', 'success');
    } else {
      store.addTeam({ name, leagueId, color });
      showAdminNotif('Equipo creado', 'success');
    }

    hideTeamForm();
    renderTeamList();
    renderStats();
  };

  // ══════════════════════════════════════════════════════════════
  //  AJUSTES (Settings)
  // ══════════════════════════════════════════════════════════════
  function renderSettings() {
    const s = store.getSettings();
    if ($('#formInsta')) $('#formInsta').value = s.instagram || '';
    if ($('#formFace')) $('#formFace').value = s.facebook || '';
    if ($('#formMaps')) $('#formMaps').value = s.mapsEmbed || '';
  }

  document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const settings = {
      instagram: $('#formInsta').value.trim(),
      facebook: $('#formFace').value.trim(),
      mapsEmbed: $('#formMaps').value.trim()
    };
    
    const btn = $('#settingsForm button[type="submit"]');
    const ogText = btn.innerHTML;
    btn.innerHTML = '⏳ Guardando...';
    btn.disabled = true;

    try {
      await store.updateSettings(settings);
      showAdminNotif('Ajustes guardados', 'success');
    } catch (err) {
      console.error(err);
      showAdminNotif('Error al guardar ajustes', 'error');
    }
    
    btn.innerHTML = ogText;
    btn.disabled = false;
  });

  // ══════════════════════════════════════════════════════════════
  //  Reset Data
  // ══════════════════════════════════════════════════════════════
  window.resetAllData = function () {
    if (confirm('⚠️ ¿Resetear TODOS los datos (ligas, equipos y productos) a los valores de ejemplo?\n\nSe perderán todos los cambios realizados.')) {
      store.resetData();
      renderStats();
      switchTab(currentTab);
      showAdminNotif('Datos reseteados correctamente', 'info');
    }
  };

  // ══════════════════════════════════════════════════════════════
  //  Admin Notification
  // ══════════════════════════════════════════════════════════════
  function showAdminNotif(message, type = 'success') {
    const container = $('#adminNotif');
    if (!container) return;

    const colors = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-blue-500' };

    container.innerHTML = `
      <div class="${colors[type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 notif-enter">
        <span class="text-sm font-medium">${message}</span>
      </div>`;

    setTimeout(() => {
      const notif = container.firstElementChild;
      if (notif) {
        notif.classList.remove('notif-enter');
        notif.classList.add('notif-exit');
        setTimeout(() => container.innerHTML = '', 350);
      }
    }, 2500);
  }

})();
