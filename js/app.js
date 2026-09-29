/* ===================================================================
   CasacasStore – Main Catalog Application
   =================================================================== */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────
  let currentLeague = null;
  let currentTeam = null;
  let currentSearch = '';

  // ── DOM refs ───────────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ── Init ───────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    cart.init();
    renderLeagueNav();
    renderMobileLeagueBar();
    renderView();
    bindEvents();
    renderFooter();
  });

  document.addEventListener('storeUpdate', () => {
    renderLeagueNav();
    renderMobileLeagueBar();
    renderView();
    renderFooter();
  });

  // ══════════════════════════════════════════════════════════════
  //  Footer (Settings)
  // ══════════════════════════════════════════════════════════════
  function renderFooter() {
    const s = typeof store.getSettings === 'function' ? store.getSettings() : { instagram:'', facebook:'', mapsEmbed:'' };
    
    // Redes Sociales
    const socialsContainer = document.querySelector('#footerSocials > div');
    if (socialsContainer) {
       let linksHTML = '';
       if (s.instagram) linksHTML += `<a href="${s.instagram}" target="_blank" class="hover:text-emerald-400 transition-colors">Instagram</a>`;
       if (s.facebook) linksHTML += `<a href="${s.facebook}" target="_blank" class="hover:text-emerald-400 transition-colors">Facebook</a>`;
       
       if (linksHTML) {
          socialsContainer.innerHTML = linksHTML;
       } else {
          socialsContainer.innerHTML = `<span class="opacity-50">Sin configurar</span>`;
       }
    }

    // Mapa
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer) {
       if (s.mapsEmbed) {
          if (s.mapsEmbed.includes('<iframe')) {
             mapContainer.innerHTML = s.mapsEmbed.replace('<iframe ', '<iframe class="w-full h-full" ');
          } else {
             mapContainer.innerHTML = `<a href="${s.mapsEmbed}" target="_blank" class="text-emerald-500 font-bold hover:underline">🗺️ Abrir en Google Maps</a>`;
          }
       } else {
          mapContainer.innerHTML = 'Sin ubicación configurada';
       }
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  Shared – Product Card HTML
  // ══════════════════════════════════════════════════════════════
  function productCardHTML(p, compact = false) {
    const totalStock = Object.values(p.sizes).reduce((s, v) => s + v, 0);
    const team = store.getTeamById(p.teamId);
    const hasDiscount = p.originalPrice && p.originalPrice > p.price;
    const discountPct = hasDiscount ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

    const sizesHtml = compact ? '' : Object.entries(p.sizes).map(([size, stock]) => {
      const available = stock > 0;
      return `<span class="inline-flex items-center justify-center w-9 h-9 rounded-lg text-xs font-semibold border
        ${available
          ? 'border-gray-300 bg-white text-gray-700 hover:border-emerald-400 cursor-pointer'
          : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50 line-through'
        }" title="${available ? `${stock} disponibles` : 'Sin stock'}">${size}</span>`;
    }).join('');

    return `
      <div class="product-card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${compact ? 'min-w-[200px] sm:min-w-[240px] snap-start' : ''}">
        <!-- Image -->
        <div class="relative ${compact ? 'aspect-[3/4]' : 'aspect-[4/5]'} bg-gray-100 overflow-hidden cursor-pointer group"
             onclick="openProductModal('${p.id}')">
          <img src="${p.images[0]}" alt="${p.title}"
               class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
               loading="lazy"
               onerror="this.src='https://placehold.co/400x500/e2e8f0/94a3b8?text=Sin+Imagen'">
          <!-- Badges top-left -->
          <div class="absolute top-2 left-2 flex flex-col gap-1">
            ${team ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow" style="background:${team.color}">${team.name}</span>` : ''}
            ${p.featured ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400 text-yellow-900 shadow">⭐ Destacado</span>` : ''}
            ${p.isNew ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white shadow">🆕 Nuevo</span>` : ''}
          </div>
          <!-- Badges top-right -->
          <div class="absolute top-2 right-2 flex flex-col gap-1 items-end">
            ${hasDiscount ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white shadow">-${discountPct}% OFF</span>` : ''}
            ${totalStock === 0
              ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">AGOTADO</span>`
              : totalStock <= 5
                ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">¡Últimas!</span>`
                : ''
            }
          </div>
          <!-- Hover overlay -->
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span class="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-800 px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              🔍 Ver detalle
            </span>
          </div>
        </div>

        <!-- Info -->
        <div class="p-3 sm:p-4 flex flex-col flex-1">
          <h3 class="font-bold text-gray-800 text-sm leading-tight line-clamp-2 mb-1 cursor-pointer hover:text-emerald-600 transition-colors"
              onclick="openProductModal('${p.id}')">${p.title}</h3>
          ${compact ? '' : `<p class="text-xs text-gray-500 line-clamp-2 mb-3">${p.description}</p>`}

          ${compact ? '' : `<div class="flex flex-wrap gap-1 mb-3">${sizesHtml}</div>`}

          <!-- Price -->
          <div class="mt-auto">
            ${hasDiscount
              ? `<p class="text-xs text-gray-400 line-through">${CONFIG.currency}${p.originalPrice.toLocaleString('es-AR')}</p>
                 <p class="text-xl font-extrabold text-red-600">${CONFIG.currency}${p.price.toLocaleString('es-AR')}</p>`
              : `<p class="text-xl font-extrabold text-gray-900">${CONFIG.currency}${p.price.toLocaleString('es-AR')}</p>`
            }
          </div>

          <!-- Actions -->
          <div class="flex gap-2 mt-2">
            <button onclick="openProductModal('${p.id}')"
              class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 ${totalStock === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
              ${totalStock === 0 ? 'disabled' : ''}>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
              </svg>
              Agregar
            </button>
            <button onclick="event.stopPropagation(); cart.sendSingleWhatsApp('${p.id}', '')"
              class="btn-whatsapp bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center"
              title="Consultar por WhatsApp">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Carousel section helper ────────────────────────────────────
  function sectionHTML(icon, title, subtitle, products, seeAllAction) {
    if (!products || products.length === 0) return '';
    return `
      <section class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span>${icon}</span> ${title}
            </h2>
            ${subtitle ? `<p class="text-xs text-gray-500 mt-0.5">${subtitle}</p>` : ''}
          </div>
          ${seeAllAction ? `<button onclick="${seeAllAction}" class="text-emerald-600 text-xs font-semibold hover:underline flex-shrink-0">Ver todos →</button>` : ''}
        </div>
        <div class="flex gap-3 sm:gap-4 overflow-x-auto pb-3 snap-x snap-mandatory mobile-league-bar">
          ${products.map(p => productCardHTML(p, true)).join('')}
        </div>
      </section>
    `;
  }

  // ══════════════════════════════════════════════════════════════
  //  Main View Router
  // ══════════════════════════════════════════════════════════════
  function renderView() {
    const isHome = !currentLeague && !currentTeam && !currentSearch;
    if (isHome) {
      renderHome();
    } else {
      renderProducts();
    }
    updateBreadcrumb();
  }

  // ══════════════════════════════════════════════════════════════
  //  HOME – Sections (Destacados, Nuevos, Ofertas)
  // ══════════════════════════════════════════════════════════════
  function renderHome() {
    const grid = $('#productsGrid');
    const empty = $('#emptyState');
    const count = $('#productCount');
    if (!grid) return;
    if (empty) empty.classList.add('hidden');

    const featured = store.getFeaturedProducts();
    const newArrivals = store.getNewProducts();
    const offers = store.getOfferProducts();
    const allProducts = store.getProducts();

    if (count) count.textContent = `${allProducts.length} productos`;

    // If no products at all
    if (allProducts.length === 0) {
      grid.innerHTML = '';
      grid.classList.add('hidden');
      if (empty) empty.classList.remove('hidden');
      return;
    }

    grid.classList.remove('hidden');
    // Switch to single column for home sections
    grid.className = 'space-y-2';

    let html = '';

    // Hero Banner
    html += `
      <section class="bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 rounded-2xl p-6 sm:p-8 text-white mb-6 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
        <div class="relative">
          <h1 class="text-2xl sm:text-3xl font-black mb-2">⚽ CasacasStore</h1>
          <p class="text-gray-300 text-sm sm:text-base max-w-lg">Las mejores camisetas de fútbol de todas las ligas del mundo. Calidad premium, envíos a todo el país.</p>
          <div class="flex flex-wrap gap-2 mt-4">
            <span class="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">🇦🇷 Liga Argentina</span>
            <span class="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">🏴 Premier League</span>
            <span class="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">🇪🇸 La Liga</span>
            <span class="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">🌍 Selecciones</span>
          </div>
        </div>
      </section>
    `;

    // Destacados
    if (featured.length > 0) {
      html += sectionHTML('⭐', 'Productos Destacados', 'Los más elegidos por nuestros clientes', featured);
    }

    // Ofertas
    if (offers.length > 0) {
      html += sectionHTML('🏷️', 'Ofertas y Descuentos', '¡Aprovechá los mejores precios!', offers);
    }

    // Nuevos ingresos
    if (newArrivals.length > 0) {
      html += sectionHTML('🆕', 'Nuevos Ingresos', 'Los últimos productos que llegaron', newArrivals);
    }

    // Todos los productos – grid normal
    html += `
      <section class="mt-4">
        <h2 class="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2 mb-4">
          <span>👕</span> Todos los Productos
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 stagger">
          ${allProducts.map(p => productCardHTML(p, false)).join('')}
        </div>
      </section>
    `;

    grid.innerHTML = html;
  }

  // ══════════════════════════════════════════════════════════════
  //  FILTERED VIEW – Product Grid
  // ══════════════════════════════════════════════════════════════
  function getFilteredProducts() {
    if (currentSearch) return store.searchProducts(currentSearch);
    if (currentTeam) return store.getProductsByTeam(currentTeam);
    if (currentLeague) return store.getProductsByLeague(currentLeague);
    return store.getProducts();
  }

  function renderProducts() {
    const grid = $('#productsGrid');
    const empty = $('#emptyState');
    const count = $('#productCount');
    if (!grid) return;

    const products = getFilteredProducts();
    if (count) count.textContent = `${products.length} producto${products.length !== 1 ? 's' : ''}`;

    if (products.length === 0) {
      grid.innerHTML = '';
      grid.classList.add('hidden');
      if (empty) empty.classList.remove('hidden');
      return;
    }

    if (empty) empty.classList.add('hidden');
    grid.classList.remove('hidden');
    // Restore grid classes for filtered view
    grid.className = 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 stagger';

    grid.innerHTML = products.map(p => productCardHTML(p, false)).join('');
  }

  // ══════════════════════════════════════════════════════════════
  //  League Navigation (Desktop Sidebar)
  // ══════════════════════════════════════════════════════════════
  function renderLeagueNav() {
    const nav = $('#leagueNav');
    if (!nav) return;
    const leagues = store.getLeagues();

    nav.innerHTML = `
      <button class="league-btn w-full text-left px-4 py-3 flex items-center gap-3 font-medium text-gray-700 ${!currentLeague ? 'active' : ''}"
              data-league="all">
        <span class="text-xl">🏠</span>
        <span>Inicio</span>
      </button>
      ${leagues.map(l => {
        const teams = store.getTeamsByLeague(l.id);
        return `
          <div>
            <button class="league-btn w-full text-left px-4 py-3 flex items-center gap-3 font-medium text-gray-700 ${currentLeague === l.id ? 'active' : ''}"
                    data-league="${l.id}">
              <span class="text-xl">${l.icon}</span>
              <span class="flex-1">${l.name}</span>
              <svg class="w-4 h-4 transition-transform ${currentLeague === l.id ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
            <div class="team-list ${currentLeague === l.id ? 'expanded' : ''}" data-teams-for="${l.id}">
              ${teams.map(t => `
                <button class="w-full text-left pl-12 pr-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-emerald-600 transition-colors flex items-center gap-2 ${currentTeam === t.id ? 'text-emerald-600 font-semibold bg-emerald-50' : ''}"
                        data-team="${t.id}" data-league-parent="${l.id}">
                  <span class="w-3 h-3 rounded-full flex-shrink-0" style="background:${t.color}"></span>
                  ${t.name}
                </button>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    `;

    nav.querySelectorAll('[data-league]').forEach(btn => {
      btn.addEventListener('click', () => {
        const leagueId = btn.dataset.league;
        if (leagueId === 'all') {
          currentLeague = null;
          currentTeam = null;
        } else {
          currentLeague = currentLeague === leagueId ? null : leagueId;
          currentTeam = null;
        }
        currentSearch = '';
        $$('#searchInput, #searchInputMobile').forEach(i => i.value = '');
        renderLeagueNav();
        renderMobileLeagueBar();
        renderTeamFilter();
        renderView();
      });
    });

    nav.querySelectorAll('[data-team]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentTeam = btn.dataset.team;
        currentLeague = btn.dataset.leagueParent;
        currentSearch = '';
        $$('#searchInput, #searchInputMobile').forEach(i => i.value = '');
        renderLeagueNav();
        renderMobileLeagueBar();
        renderTeamFilter();
        renderView();
      });
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  Mobile League Bar
  // ══════════════════════════════════════════════════════════════
  function renderMobileLeagueBar() {
    const bar = $('#mobileLeagueBar');
    if (!bar) return;
    const leagues = store.getLeagues();

    bar.innerHTML = `
      <button class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors
        ${!currentLeague ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-700'}"
        data-mleague="all">🏠 Inicio</button>
      ${leagues.map(l => `
        <button class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
          ${currentLeague === l.id ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-700'}"
          data-mleague="${l.id}">${l.icon} ${l.name}</button>
      `).join('')}
    `;

    bar.querySelectorAll('[data-mleague]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.mleague;
        currentLeague = id === 'all' ? null : id;
        currentTeam = null;
        currentSearch = '';
        $$('#searchInput, #searchInputMobile').forEach(i => i.value = '');
        renderAll();
      });
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  Team Filter Pills
  // ══════════════════════════════════════════════════════════════
  function renderTeamFilter() {
    const container = $('#teamFilter');
    if (!container) return;

    if (!currentLeague) {
      container.classList.add('hidden');
      container.innerHTML = '';
      return;
    }

    const teams = store.getTeamsByLeague(currentLeague);
    container.classList.remove('hidden');
    container.innerHTML = `
      <button class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
        ${!currentTeam ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'}"
        data-tfilter="all">Todos</button>
      ${teams.map(t => `
        <button class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5
          ${currentTeam === t.id ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'}"
          data-tfilter="${t.id}">
          <span class="w-2.5 h-2.5 rounded-full" style="background:${t.color}"></span>
          ${t.name}
        </button>
      `).join('')}
    `;

    container.querySelectorAll('[data-tfilter]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTeam = btn.dataset.tfilter === 'all' ? null : btn.dataset.tfilter;
        renderTeamFilter();
        renderView();
        renderLeagueNav();
      });
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  Breadcrumb
  // ══════════════════════════════════════════════════════════════
  function updateBreadcrumb() {
    const bc = $('#breadcrumb');
    if (!bc) return;

    let parts = [`<a href="#" class="hover:text-emerald-600 transition-colors" data-bc="home">Inicio</a>`];

    if (currentSearch) {
      parts.push(`<span class="text-gray-400 mx-1">›</span>`);
      parts.push(`<span class="text-gray-800 font-medium">Búsqueda: "${currentSearch}"</span>`);
    } else {
      if (currentLeague) {
        const league = store.getLeagues().find(l => l.id === currentLeague);
        parts.push(`<span class="text-gray-400 mx-1">›</span>`);
        parts.push(`<a href="#" class="hover:text-emerald-600 transition-colors" data-bc="league">${league?.icon} ${league?.name}</a>`);
      }
      if (currentTeam) {
        const team = store.getTeamById(currentTeam);
        parts.push(`<span class="text-gray-400 mx-1">›</span>`);
        parts.push(`<span class="text-gray-800 font-medium">${team?.name}</span>`);
      }
    }

    bc.innerHTML = parts.join('');

    bc.querySelector('[data-bc="home"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      currentLeague = null;
      currentTeam = null;
      currentSearch = '';
      $$('#searchInput, #searchInputMobile').forEach(i => i.value = '');
      renderAll();
    });

    bc.querySelector('[data-bc="league"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      currentTeam = null;
      renderAll();
    });
  }

  function renderAll() {
    renderLeagueNav();
    renderMobileLeagueBar();
    renderTeamFilter();
    renderView();
  }

  // ══════════════════════════════════════════════════════════════
  //  Product Detail Modal
  // ══════════════════════════════════════════════════════════════
  window.openProductModal = function (productId) {
    const product = store.getProductById(productId);
    if (!product) return;

    const modal = $('#productModal');
    const content = $('#productModalContent');
    if (!modal || !content) return;

    const team = store.getTeamById(product.teamId);
    const league = store.getLeagues().find(l => l.id === product.leagueId);
    const totalStock = Object.values(product.sizes).reduce((s, v) => s + v, 0);
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPct = hasDiscount ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

    content.innerHTML = `
      <div class="flex flex-col lg:flex-row">
        <!-- Image Section -->
        <div class="lg:w-1/2 relative">
          <div class="zoom-container aspect-[4/5] bg-gray-100" id="zoomContainer">
            <img id="modalMainImg" src="${product.images[0]}" alt="${product.title}"
                 class="w-full h-full object-cover"
                 onerror="this.src='https://placehold.co/400x500/e2e8f0/94a3b8?text=Sin+Imagen'">
            <div class="zoom-lens" id="zoomLens"></div>
          </div>
          ${product.images.length > 1 ? `
          <div class="flex gap-2 p-3 overflow-x-auto">
            ${product.images.map((img, i) => `
              <img src="${img}" alt="Foto ${i + 1}"
                   class="gallery-thumb w-16 h-20 object-cover rounded-lg ${i === 0 ? 'active' : ''}"
                   onclick="switchModalImage('${img}', this)"
                   onerror="this.style.display='none'">
            `).join('')}
          </div>` : ''}
          <button onclick="closeProductModal()"
            class="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors lg:hidden">✕</button>
        </div>

        <!-- Info Section -->
        <div class="lg:w-1/2 p-5 lg:p-8 flex flex-col">
          <button onclick="closeProductModal()"
            class="hidden lg:flex self-end w-8 h-8 text-gray-400 hover:text-gray-600 items-center justify-center rounded-full hover:bg-gray-100 transition-colors mb-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>

          <!-- Badges -->
          <div class="flex flex-wrap items-center gap-2 mb-3">
            ${team ? `<span class="px-2 py-1 rounded-full text-[11px] font-bold text-white" style="background:${team.color}">${team.name}</span>` : ''}
            ${league ? `<span class="text-xs text-gray-500">${league.icon} ${league.name}</span>` : ''}
            ${product.featured ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400 text-yellow-900">⭐ Destacado</span>` : ''}
            ${product.isNew ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white">🆕 Nuevo</span>` : ''}
            ${hasDiscount ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">-${discountPct}% OFF</span>` : ''}
          </div>

          <h2 class="text-xl lg:text-2xl font-extrabold text-gray-900 mb-3">${product.title}</h2>
          <p class="text-sm text-gray-600 leading-relaxed mb-5">${product.description}</p>

          <!-- Price -->
          <div class="mb-5">
            ${hasDiscount
              ? `<p class="text-sm text-gray-400 line-through">Antes: ${CONFIG.currency}${product.originalPrice.toLocaleString('es-AR')}</p>
                 <p class="text-3xl font-black text-red-600">${CONFIG.currency}${product.price.toLocaleString('es-AR')} <span class="text-sm font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-1">-${discountPct}%</span></p>`
              : `<p class="text-3xl font-black text-gray-900">${CONFIG.currency}${product.price.toLocaleString('es-AR')}</p>`
            }
          </div>

          <!-- Sizes -->
          <div class="mb-5">
            <p class="text-sm font-semibold text-gray-700 mb-2">Seleccionar talle:</p>
            <div class="flex flex-wrap gap-2" id="modalSizes">
              ${Object.entries(product.sizes).map(([size, stock]) => {
                const avail = stock > 0;
                return `
                  <button class="size-badge ${avail ? 'available' : 'out-of-stock'} w-14 h-12 rounded-xl border-2 flex flex-col items-center justify-center
                    ${avail ? 'border-gray-300 bg-white hover:border-emerald-400' : 'border-gray-200 bg-gray-50'}"
                    data-size="${size}" data-stock="${stock}" ${!avail ? 'disabled' : ''}
                    onclick="${avail ? `selectSize(this, '${size}')` : ''}">
                    <span class="text-sm font-bold">${size}</span>
                    <span class="text-[10px] ${avail ? (stock <= 3 ? 'text-amber-500' : 'text-emerald-500') : 'text-red-400'}">
                      ${avail ? (stock <= 3 ? `¡${stock}!` : stock) : 'N/D'}
                    </span>
                  </button>`;
              }).join('')}
            </div>
            <p id="modalSizeError" class="text-red-500 text-xs mt-1 hidden">Seleccioná un talle</p>
          </div>

          <!-- Quantity -->
          <div class="mb-6">
            <p class="text-sm font-semibold text-gray-700 mb-2">Cantidad:</p>
            <div class="flex items-center gap-3">
              <button onclick="adjustModalQty(-1)" class="w-10 h-10 rounded-xl border-2 border-gray-300 flex items-center justify-center text-lg font-bold text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors">−</button>
              <span id="modalQty" class="text-lg font-bold w-8 text-center">1</span>
              <button onclick="adjustModalQty(1)" class="w-10 h-10 rounded-xl border-2 border-gray-300 flex items-center justify-center text-lg font-bold text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors">+</button>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row gap-3 mt-auto">
            <button onclick="addFromModal('${product.id}')"
              class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm ${totalStock === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
              ${totalStock === 0 ? 'disabled' : ''}>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
              Agregar al Carrito
            </button>
            <button onclick="whatsappFromModal('${product.id}')"
              class="btn-whatsapp flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Consultar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    initZoom();
    window._modalSelectedSize = null;
    window._modalQty = 1;
  };

  window.closeProductModal = function () {
    const modal = $('#productModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
  };

  window.switchModalImage = function (src, thumbEl) {
    const img = $('#modalMainImg');
    if (img) img.src = src;
    $$('.gallery-thumb').forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
  };

  window.selectSize = function (el, size) {
    $$('#modalSizes .size-badge').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    window._modalSelectedSize = size;
    $('#modalSizeError')?.classList.add('hidden');
  };

  window.adjustModalQty = function (delta) {
    window._modalQty = Math.max(1, (window._modalQty || 1) + delta);
    const el = $('#modalQty');
    if (el) el.textContent = window._modalQty;
  };

  window.addFromModal = function (productId) {
    const size = window._modalSelectedSize;
    if (!size) { $('#modalSizeError')?.classList.remove('hidden'); return; }
    if (cart.addItem(productId, size, window._modalQty || 1)) closeProductModal();
  };

  window.whatsappFromModal = function (productId) {
    cart.sendSingleWhatsApp(productId, window._modalSelectedSize || '');
  };

  // ══════════════════════════════════════════════════════════════
  //  Image Zoom
  // ══════════════════════════════════════════════════════════════
  function initZoom() {
    const container = $('#zoomContainer');
    const lens = $('#zoomLens');
    const img = $('#modalMainImg');
    if (!container || !lens || !img) return;

    const ZOOM = 2.5;
    function moveLens(e) {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      let x, y;
      if (e.touches) { x = e.touches[0].clientX - rect.left; y = e.touches[0].clientY - rect.top; }
      else { x = e.clientX - rect.left; y = e.clientY - rect.top; }
      const lw = lens.offsetWidth / 2, lh = lens.offsetHeight / 2;
      x = Math.max(lw, Math.min(x, rect.width - lw));
      y = Math.max(lh, Math.min(y, rect.height - lh));
      lens.style.left = (x - lw) + 'px';
      lens.style.top = (y - lh) + 'px';
      lens.style.backgroundImage = `url('${img.src}')`;
      lens.style.backgroundSize = `${rect.width * ZOOM}px ${rect.height * ZOOM}px`;
      lens.style.backgroundPosition = `-${(x * ZOOM) - lw}px -${(y * ZOOM) - lh}px`;
    }
    container.addEventListener('mousemove', moveLens);
    container.addEventListener('touchmove', moveLens);
  }

  // ══════════════════════════════════════════════════════════════
  //  Cart Sidebar
  // ══════════════════════════════════════════════════════════════
  window.openCart = function () {
    $('#cartSidebar')?.classList.add('open');
    $('#cartOverlay')?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderCartSidebar();
  };

  window.closeCart = function () {
    $('#cartSidebar')?.classList.remove('open');
    $('#cartOverlay')?.classList.add('hidden');
    document.body.style.overflow = '';
  };

  window.renderCartSidebar = function () {
    const container = $('#cartItems');
    const totalEl = $('#cartTotal');
    const emptyEl = $('#cartEmpty');
    const contentEl = $('#cartContent');
    const countEl = $('#cartSidebarCount');
    if (!container) return;

    if (cart.isEmpty()) {
      if (emptyEl) emptyEl.classList.remove('hidden');
      if (contentEl) contentEl.classList.add('hidden');
      return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');
    if (contentEl) contentEl.classList.remove('hidden');
    if (countEl) countEl.textContent = `${cart.getTotalItems()} item${cart.getTotalItems() !== 1 ? 's' : ''}`;

    container.innerHTML = cart.items.map((item, idx) => `
      <div class="flex gap-3 p-3 bg-gray-50 rounded-xl">
        <img src="${item.image}" alt="${item.title}" class="w-16 h-20 object-cover rounded-lg flex-shrink-0"
             onerror="this.src='https://placehold.co/64x80/e2e8f0/94a3b8?text=?'">
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-semibold text-gray-800 line-clamp-2">${item.title}</h4>
          <p class="text-xs text-gray-500 mt-0.5">Talle: <span class="font-medium">${item.size}</span></p>
          <div class="flex items-center justify-between mt-2">
            <div class="flex items-center gap-2">
              <button onclick="cart.updateQuantity(${idx}, ${item.quantity - 1})"
                class="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-sm font-bold text-gray-600 hover:border-emerald-400">−</button>
              <span class="text-sm font-bold w-5 text-center">${item.quantity}</span>
              <button onclick="cart.updateQuantity(${idx}, ${item.quantity + 1})"
                class="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-sm font-bold text-gray-600 hover:border-emerald-400">+</button>
            </div>
            <span class="text-sm font-bold text-gray-900">${CONFIG.currency}${(item.price * item.quantity).toLocaleString('es-AR')}</span>
          </div>
        </div>
        <button onclick="cart.removeItem(${idx})"
          class="self-start text-gray-400 hover:text-red-500 transition-colors p-1" title="Eliminar">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `).join('');

    const subtotalEl = $('#cartSubtotal');
    if (subtotalEl) subtotalEl.textContent = `${CONFIG.currency}${cart.getTotal().toLocaleString('es-AR')}`;
    if (totalEl) totalEl.textContent = `${CONFIG.currency}${cart.getFinalTotal().toLocaleString('es-AR')}`;

    const res = $('#shippingResult');
    const lbl = $('#shippingLabel');
    const costDisp = $('#shippingCostDisplay');
    if (cart.shippingCost > 0) {
      if (res) res.classList.remove('hidden');
      if (lbl) lbl.textContent = `Envío (${cart.shippingCompany.toUpperCase()}):`;
      if (costDisp) costDisp.textContent = `${CONFIG.currency}${cart.shippingCost.toLocaleString('es-AR')}`;
    } else {
      if (res) res.classList.add('hidden');
    }
  };

  // ══════════════════════════════════════════════════════════════
  //  Event Bindings
  // ══════════════════════════════════════════════════════════════
  function bindEvents() {
    $('#cartBtn')?.addEventListener('click', openCart);
    $('#cartOverlay')?.addEventListener('click', closeCart);
    $('#closeCartBtn')?.addEventListener('click', closeCart);

    $('#clearCartBtn')?.addEventListener('click', () => {
      if (cart.isEmpty()) return;
      if (confirm('¿Vaciar todo el carrito?')) cart.clear();
    });

    $('#checkoutWhatsApp')?.addEventListener('click', () => {
      if (cart.isEmpty()) { showNotification('El carrito está vacío', 'error'); return; }
      openInvoiceModal();
    });

    $('#calcShippingBtn')?.addEventListener('click', () => {
      if (cart.isEmpty()) { showNotification('Agrega productos primero', 'info'); return; }
      const cp = $('#cartZipCode').value.trim();
      const comp = $('#cartShippingCompany').value;
      
      if (!cp || !comp) {
        showNotification('Ingresá el código postal y seleccioná una empresa', 'error');
        return;
      }
      
      let base = 5000;
      if (comp === 'andreani') base = 6500;
      if (comp === 'oca') base = 5500;

      // Incrementar un poco si el CP empieza con un número mayor a 3 (lógica simple para demostración)
      const firstDigit = parseInt(cp[0]);
      if (!isNaN(firstDigit) && firstDigit > 3) base += 2000;

      cart.setShipping(comp, cp, base);
      showNotification('Costo de envío calculado', 'success');
    });

    $('#productModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'productModal') closeProductModal();
    });

    // Search
    let searchTimeout;
    function handleSearch(value) {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentSearch = value.trim();
        if (currentSearch) { currentLeague = null; currentTeam = null; }
        renderAll();
      }, 300);
    }

    $('#searchInput')?.addEventListener('input', (e) => {
      handleSearch(e.target.value);
      const m = $('#searchInputMobile'); if (m) m.value = e.target.value;
    });
    $('#searchInputMobile')?.addEventListener('input', (e) => {
      handleSearch(e.target.value);
      const d = $('#searchInput'); if (d) d.value = e.target.value;
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeProductModal(); closeCart(); closeInvoiceModal(); }
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  Invoice Modal (Factura)
  // ══════════════════════════════════════════════════════════════
  window.openInvoiceModal = function() {
    if (cart.isEmpty()) return;
    const orderNum = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toLocaleString('es-AR');
    cart.currentOrderNumber = orderNum;
    cart.currentOrderDate = dateStr;

    let html = `
      <div class="text-center mb-6 border-b border-dashed border-gray-300 pb-4">
        <h2 class="text-xl font-black uppercase text-gray-900">${CONFIG.storeName}</h2>
        <p class="text-xs text-gray-500 mt-1">Comprobante de Pedido</p>
      </div>
      <div class="mb-4">
        <p><strong>Orden:</strong> #${orderNum}</p>
        <p><strong>Fecha:</strong> ${dateStr}</p>
      </div>
      <div class="border-b border-dashed border-gray-300 pb-2 mb-2">
        <div class="flex justify-between font-bold text-xs mb-2">
          <span class="w-1/2">PRODUCTO</span>
          <span class="w-1/4 text-center">CANT/TAL</span>
          <span class="w-1/4 text-right">PRECIO</span>
        </div>
    `;
    
    cart.items.forEach(item => {
      html += `
        <div class="flex justify-between text-xs mb-1 text-gray-600">
          <span class="w-1/2 truncate pr-2">${item.title}</span>
          <span class="w-1/4 text-center text-gray-800">${item.quantity} x ${item.size}</span>
          <span class="w-1/4 text-right text-gray-800">${CONFIG.currency}${(item.price * item.quantity).toLocaleString('es-AR')}</span>
        </div>
      `;
    });

    html += `</div>`;
    
    html += `<div class="flex justify-between text-xs mt-2 text-gray-600"><span>Subtotal:</span> <span>${CONFIG.currency}${cart.getTotal().toLocaleString('es-AR')}</span></div>`;
    if (cart.shippingCost > 0) {
       html += `<div class="flex justify-between text-xs mt-1 text-gray-600"><span>Envío (${cart.shippingCompany.toUpperCase()}):</span> <span>${CONFIG.currency}${cart.shippingCost.toLocaleString('es-AR')}</span></div>`;
    }
    html += `
      <div class="flex justify-between font-black text-lg mt-4 pt-3 border-t border-dashed border-gray-300 text-gray-900">
        <span>TOTAL FINAL:</span>
        <span>${CONFIG.currency}${cart.getFinalTotal().toLocaleString('es-AR')}</span>
      </div>
    `;

    $('#invoiceContent').innerHTML = html;
    $('#invoiceModal').classList.remove('hidden');
    closeCart();
  };

  window.closeInvoiceModal = function() {
    $('#invoiceModal').classList.add('hidden');
  };

  window.printInvoice = function() {
    const content = $('#invoiceContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Orden #${cart.currentOrderNumber}</title>
          <style>
            body { font-family: monospace; color: #000; max-width: 400px; margin: 0 auto; padding: 20px; }
            .text-center { text-align: center; }
            .mb-6 { margin-bottom: 24px; }
            .pb-4 { padding-bottom: 16px; }
            .mb-4 { margin-bottom: 16px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-1 { margin-bottom: 4px; }
            .mt-2 { margin-top: 8px; }
            .mt-1 { margin-top: 4px; }
            .mt-4 { margin-top: 16px; }
            .pt-3 { padding-top: 12px; }
            .font-bold { font-weight: bold; }
            .font-black { font-weight: 900; }
            .text-lg { font-size: 18px; }
            .text-xl { font-size: 20px; }
            .text-xs { font-size: 12px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .text-right { text-align: right; }
            .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .border-b { border-bottom: 1px dashed #ccc; }
            .border-t { border-top: 1px dashed #ccc; }
            .w-1\\/2 { width: 50%; }
            .w-1\\/4 { width: 25%; }
            .text-gray-500, .text-gray-600 { color: #555; }
            .text-gray-800, .text-gray-900 { color: #000; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${content}
          <script>
             window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  window.copyInvoice = function() {
    const text = cart.generateWhatsAppMessage();
    navigator.clipboard.writeText(text).then(() => {
      showNotification('Comprobante copiado al portapapeles', 'success');
    }).catch(err => {
      console.error('Error al copiar', err);
      showNotification('No se pudo copiar el comprobante', 'error');
    });
  };

  window.confirmAndSendWhatsApp = function() {
    cart.sendWhatsApp();
  };

})();
