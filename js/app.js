/* ===================================================================
   NYA Fútbol – Main Catalog Application
   =================================================================== */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────
  let currentLeague = null;
  let currentTeam = null;
  let currentSearch = '';
  let showingAll = false;   // vista "Todos los productos" del menú
  let currentQuality = '';  // filtro de calidad (W 15, Premium…); se combina con liga, equipo y búsqueda
  let homeAllShown = 0;     // productos desplegados en la portada (0 = sección cerrada)
  const HOME_BATCH = 8;     // cuántos se suman con cada "Ver más"

  // ── DOM refs ───────────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ── Init ───────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    cart.init();
    renderLeagueNav();
    renderMobileLeagueBar();
    renderQualityFilter();
    renderView();
    bindEvents();
    renderFooter();
  });

  document.addEventListener('storeUpdate', () => {
    renderLeagueNav();
    renderMobileLeagueBar();
    renderQualityFilter();
    renderView();
    renderFooter();
  });

  // Si los Ajustes se guardan con la tienda abierta en otra pestaña, el footer se actualiza solo
  window.addEventListener('storage', (e) => {
    if (e.key === CONFIG.localStorageKeys.settings) renderFooter();
  });

  // ══════════════════════════════════════════════════════════════
  //  Footer (Settings) – redes y ubicación cargadas en Ajustes del panel
  // ══════════════════════════════════════════════════════════════
  const escAttr = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  // Solo direcciones web completas (http/https); cualquier otra cosa se ignora
  function safeUrl(value) {
    try {
      const url = new URL(String(value || '').trim());
      return /^https?:$/.test(url.protocol) ? url.href : '';
    } catch (e) {
      return '';
    }
  }

  // "@usuario" a partir de la URL del perfil, si se puede leer
  function handleFrom(url) {
    const first = new URL(url).pathname.split('/').filter(Boolean)[0] || '';
    return /^[\w.-]+$/.test(first) && !/\.php$/i.test(first) ? first : '';
  }

  // Ubicación cargada en Ajustes → { embed, link }: el mapa a mostrar y un link para abrirlo en Google Maps.
  // Acepta el código "Insertar un mapa" (se usa solo su src), un link de Google Maps o la dirección escrita.
  function mapFrom(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const isEmbed = (url) => /^https:\/\/(www\.|maps\.)?google\.[a-z.]+\/maps\/embed/i.test(url);
    // Mapa de Google sin clave de API a partir de una búsqueda (dirección, lugar o coordenadas)
    const embedFor = (query) => `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;

    const src = raw.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
    if (src) {
      const url = safeUrl(src[1].replace(/&amp;/g, '&'));
      return isEmbed(url) ? { embed: url } : null;
    }

    const link = safeUrl(raw);
    if (!link) {
      // Dirección escrita a mano (cualquier otra cosa con "algo:" adelante se ignora)
      if (raw.length < 4 || /^[a-z]+:/i.test(raw)) return null;
      return { embed: embedFor(raw), link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(raw)}` };
    }
    if (isEmbed(link)) return { embed: link };

    // Link de Google Maps: se busca qué lugar muestra (búsqueda, coordenadas exactas, nombre o centro del mapa)
    const url = new URL(link);
    if (/(^|\.)google\.[a-z.]+$/i.test(url.hostname) && url.pathname.startsWith('/maps')) {
      const pin = link.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
      const place = url.pathname.match(/\/maps\/(?:place|search)\/([^/@]+)/);
      const center = link.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
      const query = url.searchParams.get('q') || url.searchParams.get('query')
        || (pin && `${pin[1]},${pin[2]}`)
        || (place && decodeURIComponent(place[1].replace(/\+/g, ' ')))
        || (center && `${center[1]},${center[2]}`);
      if (query) return { embed: embedFor(query), link };
    }
    // Links cortos (maps.app.goo.gl) u otros: la página no puede leer adónde apuntan, queda solo el enlace
    return { link };
  }

  // Íconos de las apps, dibujados acá para no depender de archivos ni de otra librería
  const APP_ICONS = {
    Instagram: `<svg class="app-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.15" fill="currentColor" stroke="none"/></svg>`,
    Facebook: `<svg class="app-icon" viewBox="0 0 24 24" aria-hidden="true"><mask id="fb-f"><rect width="24" height="24" fill="#fff"/><path fill="#000" d="M13.2 23V13.7h2.3l.35-2.7H13.2V9.4c0-.78.22-1.3 1.33-1.3h1.42V5.7a19 19 0 0 0-2.07-.1c-2.05 0-3.45 1.25-3.45 3.55V11H8.1v2.7h2.33V23Z"/></mask><circle cx="12" cy="12" r="10" fill="currentColor" mask="url(#fb-f)"/></svg>`,
    Maps: `<svg class="app-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M12 2.5c-3.87 0-7 3.06-7 6.9C5 14.5 12 21.5 12 21.5s7-7 7-12.1c0-3.84-3.13-6.9-7-6.9Zm0 9.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z"/></svg>`,
  };

  function renderFooter() {
    const s = typeof store.getSettings === 'function' ? store.getSettings() : { instagram:'', facebook:'', mapsEmbed:'' };

    // Redes: solo las cargadas; si no hay ninguna, la columna no aparece
    const socials = [['Instagram', safeUrl(s.instagram)], ['Facebook', safeUrl(s.facebook)]].filter(([, url]) => url);
    const socialsBox = $('#footerSocials');
    if (socialsBox) {
      socialsBox.querySelector('.footer-links').innerHTML = socials.map(([name, url]) => {
        const handle = handleFrom(url);
        return `<a href="${escAttr(url)}" target="_blank" rel="noopener" class="footer-social" aria-label="${name}" title="${name}">
            ${APP_ICONS[name]}${handle ? `<span class="count">@${escAttr(handle)}</span>` : ''}
          </a>`;
      }).join('');
      socialsBox.classList.toggle('hidden', socials.length === 0);
    }

    // Ubicación: una parte del mapa y, si hay link, "Cómo llegar" para abrirlo en Google Maps
    const location = mapFrom(s.mapsEmbed);
    const locationBox = $('#footerLocation');
    const mapContainer = $('#mapContainer');
    if (locationBox && mapContainer) {
      mapContainer.innerHTML = !location ? '' : `
        ${location.embed ? `<div class="footer-map"><iframe src="${escAttr(location.embed)}" title="Ubicación de la tienda en Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>` : ''}
        ${location.link ? `<a href="${escAttr(location.link)}" target="_blank" rel="noopener" class="footer-social" aria-label="Abrir la ubicación en Google Maps" title="Google Maps">${APP_ICONS.Maps}<span class="footer-social-name">${location.embed ? 'Cómo llegar' : 'Ver ubicación'}</span></a>` : ''}`;
      locationBox.classList.toggle('hidden', !location);
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
      return `<i class="${available ? '' : 'off'}" title="${available ? `${stock} disponibles` : 'Sin stock'}">${size}</i>`;
    }).join('');

    return `
      <div class="card">
        <!-- Image -->
        <div class="ph" onclick="openProductModal('${p.id}')">
          <img src="${p.images[0]}" alt="${p.title}"
               loading="lazy"
               onerror="this.src='https://placehold.co/400x500/e7e7e3/6b6b66?text=Sin+Imagen'">
          <!-- Badges -->
          <div class="ph-badges">
            ${p.featured ? `<span class="badge">Destacado</span>` : ''}
            ${p.isNew ? `<span class="badge">Nuevo</span>` : ''}
            ${hasDiscount ? `<span class="badge low">-${discountPct}% OFF</span>` : ''}
            ${totalStock === 0
              ? `<span class="badge low">Agotado</span>`
              : totalStock <= 5
                ? `<span class="badge low">¡Últimas!</span>`
                : ''
            }
          </div>
        </div>

        <!-- Info -->
        <div class="meta">
          <h3 class="card-title" onclick="openProductModal('${p.id}')">${p.title}</h3>
          ${team ? `<p class="card-team">${teamMark(team)}${team.name}</p>` : ''}
          ${p.quality ? `<p class="card-quality">${qualityLabel(p.quality)}</p>` : ''}
          ${compact ? '' : `<p class="card-desc">${p.description}</p>`}

          <!-- Price -->
          <p class="card-price">
            ${hasDiscount
              ? `<span class="price low">${CONFIG.currency}${p.price.toLocaleString('es-AR')}</span>
                 <s class="price">${CONFIG.currency}${p.originalPrice.toLocaleString('es-AR')}</s>`
              : `<span class="price">${CONFIG.currency}${p.price.toLocaleString('es-AR')}</span>`
            }
          </p>

          ${compact ? '' : `<div class="avail">${sizesHtml}</div>`}

          <!-- Actions -->
          <div class="card-actions">
            <button onclick="openProductModal('${p.id}')"
              class="btn btn-sm flex-1"
              ${totalStock === 0 ? 'disabled' : ''}>
              Agregar
            </button>
            <button onclick="event.stopPropagation(); cart.sendSingleWhatsApp('${p.id}', '')"
              class="btn btn-outline btn-sm btn-icon"
              title="Consultar por WhatsApp" aria-label="Consultar por WhatsApp">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Carousel section helper ────────────────────────────────────
  function sectionHTML(title, subtitle, products, seeAllAction) {
    if (!products || products.length === 0) return '';
    return `
      <section>
        <div class="section-head">
          <div>
            <h2 class="section-title">${title}</h2>
            ${subtitle ? `<p class="section-sub">${subtitle}</p>` : ''}
          </div>
          ${seeAllAction
            ? `<button onclick="${seeAllAction}" class="text-btn">Ver todos</button>`
            : `<span class="count">${products.length} ${products.length === 1 ? 'producto' : 'productos'}</span>`}
        </div>
        <div class="rail">
          ${products.map(p => productCardHTML(p, true)).join('')}
        </div>
      </section>
    `;
  }

  // ══════════════════════════════════════════════════════════════
  //  Main View Router
  // ══════════════════════════════════════════════════════════════
  function renderView() {
    const isHome = !currentLeague && !currentTeam && !currentSearch && !showingAll && !currentQuality;
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
    grid.className = 'home-sections';

    let html = '';

    // Hero: la tienda a la izquierda y dos destacados en placas a la derecha
    const heroPicks = (featured.length ? featured : allProducts).slice(0, 2);
    html += `
      <section class="hero">
        <div>
          <p class="label">Camisetas de fútbol</p>
          <h1 class="hero-title">NYA Fútbol</h1>
          <p class="hero-lead">Las mejores camisetas de fútbol de todas las ligas del mundo. Calidad premium, envíos a todo el país.</p>
          <ul class="hero-leagues">
            <li>Liga Argentina</li>
            <li>Premier League</li>
            <li>La Liga</li>
            <li>Selecciones</li>
          </ul>
        </div>
        <div class="hero-tiles">
          ${heroPicks.map(p => `
            <button class="htile" onclick="openProductModal('${p.id}')">
              <span class="ph">
                <img src="${p.images[0]}" alt="${p.title}"
                     onerror="this.src='https://placehold.co/400x500/e7e7e3/6b6b66?text=Sin+Imagen'">
              </span>
              <span class="hc">${p.title}</span>
            </button>
          `).join('')}
        </div>
      </section>
    `;

    // Destacados
    if (featured.length > 0) {
      html += sectionHTML('Productos destacados', 'Los más elegidos por nuestros clientes', featured);
    }

    // Ofertas
    if (offers.length > 0) {
      html += sectionHTML('Ofertas y descuentos', '¡Aprovechá los mejores precios!', offers);
    }

    // Nuevos ingresos
    if (newArrivals.length > 0) {
      html += sectionHTML('Nuevos ingresos', 'Los últimos productos que llegaron', newArrivals);
    }

    // Todos los productos – se despliegan de a tandas para que la portada no se haga interminable
    html += `
      <section>
        <div class="section-head">
          <h2 class="section-title">Todos los productos</h2>
          <span class="count">${allProducts.length} productos</span>
        </div>
        <div id="homeAllGrid" class="product-grid stagger hidden"></div>
        <div id="homeAllMore" class="more"></div>
      </section>
    `;

    grid.innerHTML = html;
    renderHomeAll();
  }

  function renderHomeAll() {
    const gridEl = $('#homeAllGrid');
    if (!gridEl) return;
    const all = store.getProducts();
    const shown = Math.min(homeAllShown, all.length);
    gridEl.innerHTML = all.slice(0, shown).map(p => productCardHTML(p, false)).join('');
    gridEl.classList.toggle('hidden', shown === 0);
    updateHomeAllMore(shown, all.length);
  }

  function updateHomeAllMore(shown, total) {
    const more = $('#homeAllMore');
    if (!more) return;
    more.innerHTML = shown === 0
      ? `<button class="btn btn-outline" onclick="showMoreHomeProducts()">Ver los ${total} productos</button>`
      : shown < total
        ? `<button class="btn btn-outline" onclick="showMoreHomeProducts()">Ver más</button>
           <span class="count">${shown} de ${total}</span>`
        : '';
  }

  window.showMoreHomeProducts = function () {
    const gridEl = $('#homeAllGrid');
    if (!gridEl) return;
    const all = store.getProducts();
    const from = Math.min(homeAllShown, all.length);
    homeAllShown = from + HOME_BATCH;
    // Se agregan solo las tarjetas nuevas, así las que ya estaban no repiten la animación
    const batch = document.createElement('div');
    batch.innerHTML = all.slice(from, homeAllShown).map(p => productCardHTML(p, false)).join('');
    gridEl.append(...batch.children);
    gridEl.classList.remove('hidden');
    updateHomeAllMore(Math.min(homeAllShown, all.length), all.length);
  };

  // "Todos los productos" del menú: la grilla completa, sin filtros
  function showAllProducts() {
    showingAll = true;
    currentQuality = '';
    currentLeague = null;
    currentTeam = null;
    currentSearch = '';
    $$('#searchInput, #searchInputMobile').forEach(i => i.value = '');
    renderAll();
    // En mobile el menú es un cajón: se cierra para que se vea la grilla
    const sidebar = $('#mobileSidebar');
    if (sidebar && sidebar.style.transform === 'translateX(0px)') {
      sidebar.style.transform = 'translateX(-100%)';
      $('#mobileSidebarOverlay')?.classList.add('hidden');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ══════════════════════════════════════════════════════════════
  //  FILTERED VIEW – Product Grid
  // ══════════════════════════════════════════════════════════════
  function getFilteredProducts() {
    let products;
    if (currentSearch) products = store.searchProducts(currentSearch);
    else if (currentTeam) products = store.getProductsByTeam(currentTeam);
    else if (currentLeague) products = store.getProductsByLeague(currentLeague);
    else products = store.getProducts();
    return currentQuality ? products.filter(p => p.quality === currentQuality) : products;
  }

  // ══════════════════════════════════════════════════════════════
  //  Filtro de calidad (fila de chips arriba de la grilla)
  // ══════════════════════════════════════════════════════════════
  function renderQualityFilter() {
    const box = $('#qualityFilter');
    if (!box) return;
    box.innerHTML = `
      <span class="label chips-label">Calidad</span>
      <button class="chip ${!currentQuality ? 'is-active' : ''}" data-quality="">Todas</button>
      ${QUALITIES.map(q => `
        <button class="chip ${currentQuality === q.id ? 'is-active' : ''}" data-quality="${q.id}">${q.label}</button>
      `).join('')}
    `;
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
    grid.className = 'product-grid stagger';

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
      <button class="league-btn ${!currentLeague && !showingAll ? 'active' : ''}"
              data-league="all">
        <span class="league-icon" aria-hidden="true"></span>
        <span class="league-name">Inicio</span>
      </button>
      <button class="league-btn ${showingAll && !currentLeague ? 'active' : ''}"
              data-nav="todos">
        <span class="league-icon" aria-hidden="true"></span>
        <span class="league-name">Todos los productos</span>
      </button>
      ${leagues.map(l => {
        const teams = store.getTeamsByLeague(l.id);
        return `
          <div>
            <button class="league-btn ${currentLeague === l.id ? 'active' : ''}"
                    data-league="${l.id}">
              <span class="league-icon">${leagueMark(l)}</span>
              <span class="league-name">${l.name}</span>
              <span class="league-toggle" aria-hidden="true">${currentLeague === l.id ? '−' : '+'}</span>
            </button>
            <div class="team-list ${currentLeague === l.id ? 'expanded' : ''}" data-teams-for="${l.id}">
              ${teams.map(t => `
                <button class="team-btn ${currentTeam === t.id ? 'is-active' : ''}"
                        data-team="${t.id}" data-league-parent="${l.id}">
                  ${teamMark(t)}
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
        showingAll = false;
        if (leagueId === 'all') {
          currentQuality = '';
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
        showingAll = false;
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

    nav.querySelector('[data-nav="todos"]')?.addEventListener('click', showAllProducts);
  }

  // ══════════════════════════════════════════════════════════════
  //  Mobile League Bar
  // ══════════════════════════════════════════════════════════════
  function renderMobileLeagueBar() {
    const bar = $('#mobileLeagueBar');
    if (!bar) return;
    const leagues = store.getLeagues();

    bar.innerHTML = `
      <button class="tab ${!currentLeague && !showingAll ? 'is-active' : ''}"
        data-mleague="all">Inicio</button>
      <button class="tab ${showingAll && !currentLeague ? 'is-active' : ''}"
        data-mleague="todos">Todos los productos</button>
      ${leagues.map(l => `
        <button class="tab ${currentLeague === l.id ? 'is-active' : ''}"
          data-mleague="${l.id}">${leagueMark(l)} ${l.name}</button>
      `).join('')}
    `;

    bar.querySelectorAll('[data-mleague]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.mleague;
        if (id === 'todos') { showAllProducts(); return; }
        showingAll = false;
        if (id === 'all') currentQuality = '';
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
      <button class="chip ${!currentTeam ? 'is-active' : ''}"
        data-tfilter="all">Todos</button>
      ${teams.map(t => `
        <button class="chip ${currentTeam === t.id ? 'is-active' : ''}"
          data-tfilter="${t.id}">
          ${teamMark(t)}
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

    let parts = [`<a href="#" class="crumb-link" data-bc="home">Inicio</a>`];

    if (currentSearch) {
      parts.push(`<span class="crumb-sep">/</span>`);
      parts.push(`<span class="crumb-current">Búsqueda: "${currentSearch}"</span>`);
    } else if (showingAll && !currentLeague) {
      parts.push(`<span class="crumb-sep">/</span>`);
      parts.push(`<span class="crumb-current">Todos los productos</span>`);
    } else {
      if (currentLeague) {
        const league = store.getLeagues().find(l => l.id === currentLeague);
        parts.push(`<span class="crumb-sep">/</span>`);
        parts.push(`<a href="#" class="crumb-link" data-bc="league">${leagueMark(league)} ${league?.name}</a>`);
      }
      if (currentTeam) {
        const team = store.getTeamById(currentTeam);
        parts.push(`<span class="crumb-sep">/</span>`);
        parts.push(`<span class="crumb-current">${team?.name}</span>`);
      }
    }
    if (currentQuality) {
      parts.push(`<span class="crumb-sep">/</span>`);
      parts.push(`<span class="crumb-current">Calidad ${qualityLabel(currentQuality)}</span>`);
    }

    bc.innerHTML = parts.join('');

    bc.querySelector('[data-bc="home"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      showingAll = false;
      currentQuality = '';
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
    renderQualityFilter();
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
      <div class="pdp-bar">
        <button onclick="closeProductModal()" class="pdp-back">← Volver al catálogo</button>
      </div>
      <div class="pdp-grid">
        <!-- Image Section -->
        <div class="pdp-media">
          <div class="pdp-main">
            <div class="zoom-container" id="zoomContainer">
              <img id="modalMainImg" src="${product.images[0]}" alt="${product.title}"
                   onerror="this.src='https://placehold.co/400x500/e7e7e3/6b6b66?text=Sin+Imagen'">
              <div class="zoom-lens" id="zoomLens"></div>
            </div>
          </div>
          ${product.images.length > 1 ? `
          <div class="pdp-thumbs">
            ${product.images.map((img, i) => `
              <img src="${img}" alt="Foto ${i + 1}"
                   class="gallery-thumb ${i === 0 ? 'active' : ''}"
                   onclick="switchModalImage(this.src, this)"
                   onerror="this.style.display='none'">
            `).join('')}
          </div>` : ''}
        </div>

        <!-- Info Section -->
        <div class="pinfo">
          <div>
            ${league ? `<p class="label">${leagueMark(league)} ${league.name}</p>` : ''}
            <h2 class="pdp-title">${product.title}</h2>

            <!-- Badges -->
            <div class="pdp-tags">
              ${team ? `<span class="card-team">${teamMark(team)}${team.name}</span>` : ''}
              ${product.quality ? `<span class="tag">Calidad ${qualityLabel(product.quality)}</span>` : ''}
              ${product.featured ? `<span class="tag">Destacado</span>` : ''}
              ${product.isNew ? `<span class="tag">Nuevo</span>` : ''}
              ${hasDiscount ? `<span class="tag low">-${discountPct}% OFF</span>` : ''}
            </div>

            <p class="pdp-desc">${product.description}</p>
          </div>

          <!-- Price -->
          <div class="pprice">
            ${hasDiscount
              ? `<b class="price low">${CONFIG.currency}${product.price.toLocaleString('es-AR')}</b>
                 <span>Antes: <s class="price">${CONFIG.currency}${product.originalPrice.toLocaleString('es-AR')}</s></span>`
              : `<b class="price">${CONFIG.currency}${product.price.toLocaleString('es-AR')}</b>`
            }
          </div>

          <!-- Sizes -->
          <div>
            <p class="label mb-2.5">Seleccionar talle</p>
            <div class="szs" id="modalSizes">
              ${Object.entries(product.sizes).map(([size, stock]) => {
                const avail = stock > 0;
                return `
                  <button class="size-badge ${avail ? 'available' : 'out-of-stock'}"
                    data-size="${size}" data-stock="${stock}" ${!avail ? 'disabled' : ''}
                    onclick="${avail ? `selectSize(this, '${size}')` : ''}">
                    <span>${size}</span>
                    <span class="sz-stock ${avail && stock <= 3 ? 'low' : ''}">
                      ${avail ? (stock <= 3 ? `¡${stock}!` : stock) : 'N/D'}
                    </span>
                  </button>`;
              }).join('')}
            </div>
            <p id="modalSizeError" class="err hidden">Seleccioná un talle</p>
          </div>

          <!-- Quantity + Actions -->
          <div class="flex flex-col gap-2.5">
            <div class="pact">
              <div class="qty" aria-label="Cantidad">
                <button onclick="adjustModalQty(-1)" aria-label="Restar una">−</button>
                <span id="modalQty">1</span>
                <button onclick="adjustModalQty(1)" aria-label="Sumar una">+</button>
              </div>
              <button onclick="addFromModal('${product.id}')"
                class="btn"
                ${totalStock === 0 ? 'disabled' : ''}>
                Agregar al carrito
              </button>
            </div>
            <button onclick="whatsappFromModal('${product.id}')"
              class="btn btn-outline w-full">
              <svg fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
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
      <div class="line">
        <div class="th">
          <img src="${item.image}" alt="${item.title}"
               onerror="this.src='https://placehold.co/64x80/e7e7e3/6b6b66?text=?'">
        </div>
        <div>
          <h4 class="t">${item.title}</h4>
          <p class="d">Talle: ${item.size}</p>
          <div class="qty qty-sm">
            <button onclick="cart.updateQuantity(${idx}, ${item.quantity - 1})" aria-label="Restar una">−</button>
            <span>${item.quantity}</span>
            <button onclick="cart.updateQuantity(${idx}, ${item.quantity + 1})" aria-label="Sumar una">+</button>
          </div>
        </div>
        <div class="r">
          <span class="price">${CONFIG.currency}${(item.price * item.quantity).toLocaleString('es-AR')}</span>
          <button onclick="cart.removeItem(${idx})" class="link-btn" title="Eliminar">Quitar</button>
        </div>
      </div>
    `).join('');

    if (totalEl) totalEl.textContent = `${CONFIG.currency}${cart.getTotal().toLocaleString('es-AR')}`;
  };

  // ══════════════════════════════════════════════════════════════
  //  Header que se esconde al bajar y vuelve al subir
  // ══════════════════════════════════════════════════════════════
  function bindHeaderAutoHide() {
    const header = $('.site-header');
    if (!header) return;
    const THRESHOLD = 8;   // px de movimiento antes de cambiar, para que no parpadee
    let lastY = window.scrollY;
    const setHidden = (hidden) => document.body.classList.toggle('header-hidden', hidden);

    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      // Arriba de todo, o escribiendo en el buscador, el header siempre se ve
      if (y <= header.offsetHeight || header.contains(document.activeElement)) {
        setHidden(false);
        lastY = y;
      } else if (y > lastY + THRESHOLD) {
        setHidden(true);
        lastY = y;
      } else if (y < lastY - THRESHOLD) {
        setHidden(false);
        lastY = y;
      }
    }, { passive: true });

    // Si se llega con el teclado a algo del header, vuelve a aparecer
    header.addEventListener('focusin', () => setHidden(false));
  }

  // ══════════════════════════════════════════════════════════════
  //  Event Bindings
  // ══════════════════════════════════════════════════════════════
  function bindEvents() {
    $('#cartBtn')?.addEventListener('click', openCart);
    $('#cartOverlay')?.addEventListener('click', closeCart);
    $('#closeCartBtn')?.addEventListener('click', closeCart);

    bindHeaderAutoHide();

    // Filtro de calidad: desde la portada lleva a la grilla filtrada; "Todas" lo quita
    $('#qualityFilter')?.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-quality]');
      if (!chip) return;
      currentQuality = chip.dataset.quality;
      renderQualityFilter();
      renderView();
    });

    // La marca lleva a la portada y arriba de todo, sin recargar la página
    $('.site-header .brand')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentLeague || currentTeam || currentSearch || showingAll || currentQuality) {
        showingAll = false;
        currentQuality = '';
        currentLeague = null;
        currentTeam = null;
        currentSearch = '';
        $$('#searchInput, #searchInputMobile').forEach(i => i.value = '');
        renderAll();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    $('#clearCartBtn')?.addEventListener('click', async () => {
      if (cart.isEmpty()) return;
      const units = cart.getTotalItems();
      const total = `${CONFIG.currency}${cart.getTotal().toLocaleString('es-AR')}`;
      const ok = await confirmDialog({
        kicker: 'Vaciar carrito',
        title: '¿Vaciar el carrito?',
        message: units === 1
          ? `Se quita el producto que agregaste, por ${total}. Lo podés volver a agregar desde el catálogo.`
          : `Se quitan los ${units} productos que agregaste, por ${total}. Los podés volver a agregar desde el catálogo.`,
        media: $('#cartBtn .cart-icon')?.outerHTML || '',
        confirmLabel: 'Vaciar carrito',
        cancelLabel: 'Volver al carrito',
        note: '',
      });
      if (ok) cart.clear();
    });

    $('#checkoutWhatsApp')?.addEventListener('click', () => {
      if (cart.isEmpty()) { showNotification('El carrito está vacío', 'error'); return; }
      openInvoiceModal();
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
      const quality = qualityLabel(store.getProductById(item.productId)?.quality);
      html += `
        <div class="flex justify-between text-xs mb-1 text-gray-600">
          <span class="w-1/2 truncate pr-2">${item.title}${quality ? ` (${quality})` : ''}</span>
          <span class="w-1/4 text-center text-gray-800">${item.quantity} x ${item.size}</span>
          <span class="w-1/4 text-right text-gray-800">${CONFIG.currency}${(item.price * item.quantity).toLocaleString('es-AR')}</span>
        </div>
      `;
    });

    html += `</div>`;
    
    html += `<div class="flex justify-between text-xs mt-2 text-gray-600"><span>Envío:</span> <span>A coordinar con el vendedor</span></div>`;
    html += `
      <div class="flex justify-between font-black text-lg mt-4 pt-3 border-t border-dashed border-gray-300 text-gray-900">
        <span>TOTAL SIN ENVÍO:</span>
        <span>${CONFIG.currency}${cart.getTotal().toLocaleString('es-AR')}</span>
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
    // Con el pedido ya en WhatsApp se cierra todo y la tienda queda lista para seguir mirando
    closeInvoiceModal();
    closeCart();
    showNotification('Abrimos WhatsApp con tu pedido', 'success');
  };

})();
