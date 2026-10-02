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
  let formImages = [];                       // fotos del producto en el formulario; la primera es la principal
  let imagesProcessing = Promise.resolve();  // fotos que se están achicando
  let formLeagueLogo = null;
  let formTeamLogo = null;

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
      html += `<div class="alert alert-low">
        <p class="alert-title low">${outOfStock.length} producto(s) sin stock</p>
        <ul class="alert-list">${outOfStock.slice(0, 5).map(p => `<li class="truncate">• ${p.title}</li>`).join('')}</ul>
      </div>`;
    }
    if (lowStock.length > 0) {
      html += `<div class="alert ${outOfStock.length ? 'mt-2' : ''}">
        <p class="alert-title low">${lowStock.length} producto(s) con stock bajo</p>
        <ul class="alert-list">${lowStock.slice(0, 5).map(p => `<li class="truncate">• ${p.title}</li>`).join('')}</ul>
      </div>`;
    }
    if (!html) {
      html = `<div class="alert">
        <p class="alert-title">Todo el inventario en orden</p>
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
      container.innerHTML = `<div class="empty"><p class="empty-title">No se encontraron productos</p></div>`;
      return;
    }

    container.innerHTML = products.map(p => {
      const team = store.getTeamById(p.teamId);
      const totalStock = Object.values(p.sizes).reduce((s, v) => s + v, 0);
      const stockColor = totalStock <= 5 ? 'low' : '';

      return `
        <div class="admin-row">
          <div class="th">
            <img src="${p.images[0]}" alt="${p.title}"
                 onerror="this.src='https://placehold.co/64x80/e7e7e3/6b6b66?text=?'">
          </div>
          <div class="row-body">
            <h4 class="row-title line-clamp-2">${p.title}</h4>
            <p class="row-meta">
              ${team ? `<span class="inline-flex items-center gap-1.5">${teamMark(team)}${team.name}</span>` : ''}
              ${p.featured ? '<span class="tag">Destacado</span>' : ''}
              ${p.isNew ? '<span class="tag">Nuevo</span>' : ''}
              ${p.originalPrice && p.originalPrice > p.price
                ? `<span class="price"><span class="low font-medium">${CONFIG.currency}${p.price.toLocaleString('es-AR')}</span>
                   <s>${CONFIG.currency}${p.originalPrice.toLocaleString('es-AR')}</s>
                   <span class="tag low">-${Math.round((1 - p.price/p.originalPrice)*100)}%</span></span>`
                : `<span class="price text-ink-2">${CONFIG.currency}${p.price.toLocaleString('es-AR')}</span>`
              }
            </p>
            <div class="avail">
              ${Object.entries(p.sizes).map(([size, stock]) => `
                <i class="${stock === 0 ? 'off' : stock <= 3 ? 'low' : ''}">${size}: ${stock}</i>`).join('')}
            </div>
            <p class="row-stock ${stockColor}">Stock total: ${totalStock}</p>
          </div>
          <div class="row-actions">
            <button onclick="editProduct('${p.id}')" class="text-btn">Editar</button>
            <button onclick="deleteProduct('${p.id}', '${p.title.replace(/'/g, "\\'")}')" class="text-btn text-btn-low">Eliminar</button>
          </div>
        </div>`;
    }).join('');
  }

  // ══════════════════════════════════════════════════════════════
  //  IMÁGENES – Fotos de productos y logos desde la galería o el dispositivo
  // ══════════════════════════════════════════════════════════════
  // Se achican en el navegador antes de guardarlas: el catálogo vive en
  // localStorage y ese espacio es limitado (unos 5 MB por sitio).
  function imageFileToDataUrl(file, maxSide, quality) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        // WebP conserva la transparencia de fotos recortadas y logos; si el navegador no lo genera, PNG o JPEG
        let data = canvas.toDataURL('image/webp', quality);
        if (!data.startsWith('data:image/webp')) {
          data = file.type === 'image/png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', quality);
        }
        resolve(data);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo leer la imagen'));
      };
      img.src = url;
    });
  }

  const isPlaceholder = (src) => src.startsWith('https://placehold.co/');

  function renderImagePreview() {
    const box = $('#formImagesPreview');
    if (!box) return;
    box.innerHTML = formImages.length
      ? formImages.map((src, i) => `
          <div class="photo">
            <div class="th"><img src="${src}" alt="Foto ${i + 1}"></div>
            <div class="photo-foot">
              <span class="tag">${i === 0 ? 'Principal' : i + 1}</span>
              <button type="button" class="link-btn" data-remove-photo="${i}">Quitar</button>
            </div>
          </div>`).join('')
      : `<p class="field-hint">Sin fotos. Si no agregás ninguna, se usa una imagen con el color del equipo.</p>`;
  }

  function renderLogoPreview(kind) {
    const logo = kind === 'league' ? formLeagueLogo : formTeamLogo;
    const box = $(`#${kind}LogoPreview`);
    if (box) box.innerHTML = logo ? `<img src="${logo}" alt="Logo">` : '—';
    $(`#${kind}LogoRemove`)?.classList.toggle('hidden', !logo);
  }

  // localStorage tiene un límite: si una imagen no entra se avisa en vez de fallar en silencio
  function notifySaveError(err) {
    console.error(err);
    showAdminNotif(err && /quota/i.test(err.name)
      ? 'No hay más espacio en este navegador para guardar imágenes. Quitá alguna foto o usá imágenes más livianas.'
      : 'No se pudo guardar. Probá de nuevo.', 'error');
  }

  $('#formImageUpload')?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    imagesProcessing = imagesProcessing.then(async () => {
      const added = [];
      for (const file of files) {
        try {
          added.push(await imageFileToDataUrl(file, 900, 0.8));
        } catch (err) {
          showAdminNotif(`No se pudo leer "${file.name}". Probá con una foto JPG o PNG.`, 'error');
        }
      }
      if (!added.length) return;
      // Las imágenes de ejemplo se reemplazan apenas hay una foto real
      formImages = formImages.filter(src => !isPlaceholder(src)).concat(added);
      renderImagePreview();
    });
  });

  $('#formImagesPreview')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-photo]');
    if (!btn) return;
    formImages.splice(Number(btn.dataset.removePhoto), 1);
    renderImagePreview();
  });

  ['league', 'team'].forEach((kind) => {
    $(`#${kind}LogoInput`)?.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        const logo = await imageFileToDataUrl(file, 160, 0.9);
        if (kind === 'league') formLeagueLogo = logo; else formTeamLogo = logo;
        renderLogoPreview(kind);
      } catch (err) {
        showAdminNotif(`No se pudo leer "${file.name}". Probá con una imagen JPG o PNG.`, 'error');
      }
    });
    $(`#${kind}LogoRemove`)?.addEventListener('click', () => {
      if (kind === 'league') formLeagueLogo = null; else formTeamLogo = null;
      renderLogoPreview(kind);
    });
  });

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
      $('#formTitleLabel').textContent = 'Nuevo producto';
      $('#productFormEl').reset();
      editingProductId = null;
      formImages = [];
      renderImagePreview();
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
    $('#formTitleLabel').textContent = 'Editar producto';

    $('#formProductTitle').value = product.title;
    $('#formDescription').value = product.description;
    $('#formPrice').value = product.price;
    $('#formOriginalPrice').value = product.originalPrice || '';
    $('#formFeatured').checked = !!product.featured;
    $('#formIsNew').checked = !!product.isNew;
    $('#formLeague').value = product.leagueId;
    updateProductTeamSelect();
    setTimeout(() => { $('#formTeam').value = product.teamId; }, 50);
    formImages = [...(product.images || [])];
    renderImagePreview();
    $('#formStockS').value = product.sizes.S || 0;
    $('#formStockM').value = product.sizes.M || 0;
    $('#formStockL').value = product.sizes.L || 0;
    $('#formStockXL').value = product.sizes.XL || 0;
    $('#formStockXXL').value = product.sizes.XXL || 0;
  };

  window.deleteProduct = async function (productId, title) {
    const product = store.getProductById(productId);
    const stock = product ? Object.values(product.sizes).reduce((s, v) => s + v, 0) : 0;
    const ok = await confirmDialog({
      kicker: 'Eliminar producto',
      title: product?.title || title,
      message: `${stock > 0 ? `Tiene ${stock} unidad${stock !== 1 ? 'es' : ''} en stock. ` : ''}Se borra del catálogo y deja de verse en la tienda.`,
      media: product?.images?.[0] ? `<img src="${product.images[0]}" alt="">` : '',
      confirmLabel: 'Eliminar producto',
    });
    if (!ok) return;
    store.deleteProduct(productId);
    renderProductList();
    renderStats();
    showAdminNotif('Producto eliminado', 'success');
  };

  window.handleProductSubmit = async function (e) {
    e.preventDefault();
    const title = $('#formProductTitle').value.trim();
    const description = $('#formDescription').value.trim();
    const price = parseInt($('#formPrice').value) || 0;
    const leagueId = $('#formLeague').value;
    const teamId = $('#formTeam').value;
    if (!title || !leagueId || !teamId || price <= 0) {
      showAdminNotif('Completá todos los campos obligatorios', 'error');
      return;
    }

    await imagesProcessing;
    const images = [...formImages];

    // Con Firebase Storage configurado, las fotos nuevas se suben y se guarda su URL
    if (typeof storage !== 'undefined' && images.some(src => src.startsWith('data:'))) {
      const btn = $('#productFormEl button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Subiendo fotos…';
      btn.disabled = true;

      try {
        for (let i = 0; i < images.length; i++) {
          if (!images[i].startsWith('data:')) continue;
          const blob = await (await fetch(images[i])).blob();
          const ref = storage.ref(`productos/${Date.now()}_${i}.${blob.type.split('/')[1]}`);
          await ref.put(blob);
          images[i] = await ref.getDownloadURL();
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

    try {
      if (editingProductId) {
        await store.updateProduct(editingProductId, productData);
        showAdminNotif('Producto actualizado', 'success');
      } else {
        await store.addProduct(productData);
        showAdminNotif('Producto creado', 'success');
      }
    } catch (err) {
      notifySaveError(err);
      return;
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
      container.innerHTML = `<div class="empty"><p class="empty-title">No hay ligas creadas</p></div>`;
      return;
    }

    container.innerHTML = leagues.map(l => {
      const teamCount = store.getTeamsByLeague(l.id).length;
      const productCount = store.getProductsByLeague(l.id).length;

      return `
        <div class="admin-row items-center">
          <span class="row-icon">${leagueMark(l)}</span>
          <div class="row-body">
            <h4 class="row-title">${l.name}</h4>
            <p class="row-meta">
              <span>${teamCount} equipo${teamCount !== 1 ? 's' : ''}</span>
              <span>${productCount} producto${productCount !== 1 ? 's' : ''}</span>
              <span>Orden: ${l.order}</span>
            </p>
          </div>
          <div class="row-actions">
            <button onclick="editLeague('${l.id}')" class="text-btn">Editar</button>
            <button onclick="deleteLeague('${l.id}', '${l.name.replace(/'/g, "\\'")}')" class="text-btn text-btn-low">Eliminar</button>
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
      $('#leagueFormTitle').textContent = 'Nueva liga';
      $('#leagueFormEl').reset();
      editingLeagueId = null;
      formLeagueLogo = null;
      renderLogoPreview('league');
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
    $('#leagueFormTitle').textContent = 'Editar liga';
    $('#formLeagueName').value = league.name;
    $('#formLeagueIcon').value = league.icon;
    $('#formLeagueOrder').value = league.order;
    formLeagueLogo = league.logo || null;
    renderLogoPreview('league');
  };

  window.deleteLeague = async function (leagueId, name) {
    const league = store.getLeagueById(leagueId);
    const teamCount = store.getTeamsByLeague(leagueId).length;
    const productCount = store.getProductsByLeague(leagueId).length;
    const cascade = [];
    if (teamCount > 0) cascade.push(`${teamCount} equipo${teamCount !== 1 ? 's' : ''}`);
    if (productCount > 0) cascade.push(`${productCount} producto${productCount !== 1 ? 's' : ''}`);

    const ok = await confirmDialog({
      kicker: 'Eliminar liga',
      title: league?.name || name,
      message: cascade.length ? 'Junto con la liga se borran todos sus equipos y productos.' : 'La liga no tiene equipos ni productos cargados.',
      cascade,
      media: league ? leagueMark(league) : '',
      confirmLabel: 'Eliminar liga',
    });
    if (!ok) return;
    store.deleteLeague(leagueId);
    renderLeagueList();
    renderStats();
    showAdminNotif(`Liga "${name}" eliminada`, 'success');
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

    const logo = formLeagueLogo;

    try {
      if (editingLeagueId) {
        store.updateLeague(editingLeagueId, { name, icon, order, logo });
        showAdminNotif('Liga actualizada', 'success');
      } else {
        store.addLeague({ name, icon, order, logo });
        showAdminNotif('Liga creada', 'success');
      }
    } catch (err) {
      notifySaveError(err);
      return;
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
      container.innerHTML = `<div class="empty"><p class="empty-title">No se encontraron equipos</p></div>`;
      return;
    }

    container.innerHTML = teams.map(t => {
      const league = store.getLeagueById(t.leagueId);
      const productCount = store.getProductsByTeam(t.id).length;

      return `
        <div class="admin-row items-center">
          ${t.logo
            ? `<span class="swatch swatch-logo"><img src="${t.logo}" alt=""></span>`
            : `<span class="swatch" style="background:${t.color}">${t.name.substring(0, 2).toUpperCase()}</span>`}
          <div class="row-body">
            <h4 class="row-title">${t.name}</h4>
            <p class="row-meta">
              ${league ? `<span>${leagueMark(league)} ${league.name}</span>` : '<span class="low">Sin liga</span>'}
              <span>${productCount} producto${productCount !== 1 ? 's' : ''}</span>
              <span class="count">${t.color}</span>
            </p>
          </div>
          <div class="row-actions">
            <button onclick="editTeam('${t.id}')" class="text-btn">Editar</button>
            <button onclick="deleteTeam('${t.id}', '${t.name.replace(/'/g, "\\'")}')" class="text-btn text-btn-low">Eliminar</button>
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
      $('#teamFormTitle').textContent = 'Nuevo equipo';
      $('#teamFormEl').reset();
      $('#formTeamColor').value = '#10b981';
      editingTeamId = null;
      formTeamLogo = null;
      renderLogoPreview('team');
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
    $('#teamFormTitle').textContent = 'Editar equipo';
    $('#formTeamName').value = team.name;
    $('#formTeamLeague').value = team.leagueId;
    $('#formTeamColor').value = team.color;
    formTeamLogo = team.logo || null;
    renderLogoPreview('team');
  };

  window.deleteTeam = async function (teamId, name) {
    const team = store.getTeamById(teamId);
    const productCount = store.getProductsByTeam(teamId).length;
    const media = !team ? ''
      : team.logo ? `<img src="${team.logo}" alt="">`
      : `<span class="swatch" style="background:${team.color}">${team.name.substring(0, 2).toUpperCase()}</span>`;

    const ok = await confirmDialog({
      kicker: 'Eliminar equipo',
      title: team?.name || name,
      message: productCount > 0 ? 'Junto con el equipo se borran todos sus productos.' : 'El equipo no tiene productos cargados.',
      cascade: productCount > 0 ? [`${productCount} producto${productCount !== 1 ? 's' : ''}`] : [],
      media,
      confirmLabel: 'Eliminar equipo',
    });
    if (!ok) return;
    store.deleteTeam(teamId);
    renderTeamList();
    renderStats();
    showAdminNotif(`Equipo "${name}" eliminado`, 'success');
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

    const logo = formTeamLogo;

    try {
      if (editingTeamId) {
        store.updateTeam(editingTeamId, { name, leagueId, color, logo });
        showAdminNotif('Equipo actualizado', 'success');
      } else {
        store.addTeam({ name, leagueId, color, logo });
        showAdminNotif('Equipo creado', 'success');
      }
    } catch (err) {
      notifySaveError(err);
      return;
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
    btn.innerHTML = 'Guardando…';
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
  window.resetAllData = async function () {
    const ok = await confirmDialog({
      kicker: 'Restablecer datos',
      title: '¿Volver a los datos de ejemplo?',
      message: 'Se reemplazan todas las ligas, equipos y productos por los de ejemplo, y se pierden los cambios que hiciste.',
      confirmLabel: 'Restablecer',
    });
    if (!ok) return;
    store.resetData();
    renderStats();
    switchTab(currentTab);
    showAdminNotif('Datos reseteados correctamente', 'info');
  };

  // ══════════════════════════════════════════════════════════════
  //  Admin Notification
  // ══════════════════════════════════════════════════════════════
  function showAdminNotif(message, type = 'success') {
    const container = $('#adminNotif');
    if (!container) return;

    const variants = { success: 'toast', error: 'toast toast-error', info: 'toast' };

    container.innerHTML = `
      <div class="${variants[type]} notif-enter">
        <span>${message}</span>
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
