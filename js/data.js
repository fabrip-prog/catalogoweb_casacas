/* ===================================================================
   CasacasStore – Data Layer (LocalStorage persistence + sample data)
   =================================================================== */

// ── Configuration ──────────────────────────────────────────────────
const CONFIG = {
  whatsappNumber: '5491112345678',        // Número WhatsApp del admin (cambiar)
  storeName: 'CasacasStore ⚽',
  currency: '$',
  adminUser: 'admin',
  adminPass: 'admin123',
  localStorageKeys: {
    products: 'cs_products',
    leagues: 'cs_leagues',
    teams: 'cs_teams',
    cart: 'cs_cart',
    auth: 'cs_auth',
    settings: 'cs_settings',
  },
};

// ── Sample Data ────────────────────────────────────────────────────
const DEFAULT_LEAGUES = [
  { id: 'liga-argentina', name: 'Liga Argentina', icon: '🇦🇷', order: 1 },
  { id: 'premier-league', name: 'Premier League', icon: '🏴', order: 2 },
  { id: 'la-liga', name: 'La Liga', icon: '🇪🇸', order: 3 },
  { id: 'serie-a', name: 'Serie A', icon: '🇮🇹', order: 4 },
  { id: 'selecciones', name: 'Selecciones', icon: '🌍', order: 5 },
];

const DEFAULT_TEAMS = [
  // Liga Argentina
  { id: 'river-plate', name: 'River Plate', leagueId: 'liga-argentina', color: '#DC2626' },
  { id: 'boca-juniors', name: 'Boca Juniors', leagueId: 'liga-argentina', color: '#1E3A8A' },
  { id: 'racing-club', name: 'Racing Club', leagueId: 'liga-argentina', color: '#0EA5E9' },
  { id: 'san-lorenzo', name: 'San Lorenzo', leagueId: 'liga-argentina', color: '#1D4ED8' },
  { id: 'independiente', name: 'Independiente', leagueId: 'liga-argentina', color: '#DC2626' },

  // Premier League
  { id: 'manchester-city', name: 'Manchester City', leagueId: 'premier-league', color: '#6CADDF' },
  { id: 'liverpool', name: 'Liverpool', leagueId: 'premier-league', color: '#C8102E' },
  { id: 'arsenal', name: 'Arsenal', leagueId: 'premier-league', color: '#EF0107' },
  { id: 'chelsea', name: 'Chelsea', leagueId: 'premier-league', color: '#034694' },

  // La Liga
  { id: 'real-madrid', name: 'Real Madrid', leagueId: 'la-liga', color: '#FEBE10' },
  { id: 'barcelona', name: 'Barcelona', leagueId: 'la-liga', color: '#A50044' },
  { id: 'atletico-madrid', name: 'Atlético Madrid', leagueId: 'la-liga', color: '#CE3524' },

  // Serie A
  { id: 'juventus', name: 'Juventus', leagueId: 'serie-a', color: '#000000' },
  { id: 'inter-milan', name: 'Inter de Milán', leagueId: 'serie-a', color: '#0068A8' },
  { id: 'ac-milan', name: 'AC Milan', leagueId: 'serie-a', color: '#FB090B' },

  // Selecciones
  { id: 'sel-argentina', name: 'Argentina', leagueId: 'selecciones', color: '#75AADB' },
  { id: 'sel-brasil', name: 'Brasil', leagueId: 'selecciones', color: '#CAAB09' },
  { id: 'sel-francia', name: 'Francia', leagueId: 'selecciones', color: '#002654' },
  { id: 'sel-alemania', name: 'Alemania', leagueId: 'selecciones', color: '#000000' },
];

function _img(hex, text) {
  const c = hex.replace('#', '');
  const encoded = encodeURIComponent(text);
  return `https://placehold.co/400x500/${c}/ffffff?text=${encoded}&font=montserrat`;
}

function _img2(hex, text) {
  const c = hex.replace('#', '');
  const encoded = encodeURIComponent(text);
  return `https://placehold.co/400x500/${c}/eeeeee?text=${encoded}&font=montserrat`;
}

let _pid = 0;
function pid() { return 'prod-' + String(++_pid).padStart(3, '0'); }

const DEFAULT_PRODUCTS = [
  // ─── River Plate ───
  {
    id: pid(), title: 'Camiseta Titular River Plate 2026',
    description: 'Camiseta oficial titular Adidas 2026. Tecnología Aeroready de absorción de humedad. Tela 100% poliéster reciclado con corte atlético. Banda roja diagonal característica sobre fondo blanco. Escudo bordado y logo Adidas termosellado.',
    price: 45000, leagueId: 'liga-argentina', teamId: 'river-plate',
    images: [_img('DC2626', 'River+Plate\\nTitular+2026'), _img2('ffffff', 'River+Plate\\nDetalle')],
    sizes: { S: 5, M: 12, L: 8, XL: 3, XXL: 0 },
  },
  {
    id: pid(), title: 'Camiseta Suplente River Plate 2026',
    description: 'Camiseta suplente Adidas 2026 en color negro con detalles rojos. Misma tecnología Aeroready premium. Tejido suave y transpirable ideal para actividad deportiva o uso casual.',
    price: 44000, leagueId: 'liga-argentina', teamId: 'river-plate',
    images: [_img('1a1a1a', 'River+Plate\\nSuplente+2026'), _img2('333333', 'River+Plate\\nSuplente+Det.')],
    sizes: { S: 3, M: 10, L: 6, XL: 4, XXL: 2 },
  },
  {
    id: pid(), title: 'Short Titular River Plate 2026',
    description: 'Short oficial titular River Plate temporada 2026. Color negro con franjas rojas laterales. Tela liviana y resistente con cintura elástica y cordón interno.',
    price: 28000, leagueId: 'liga-argentina', teamId: 'river-plate',
    images: [_img('1a1a1a', 'River+Plate\\nShort+2026')],
    sizes: { S: 8, M: 15, L: 10, XL: 5, XXL: 3 },
  },

  // ─── Boca Juniors ───
  {
    id: pid(), title: 'Camiseta Titular Boca Juniors 2026',
    description: 'Camiseta oficial titular Adidas Boca Juniors 2026. Icónica franja amarilla horizontal sobre azul profundo. Tecnología HEAT.RDY para máximo rendimiento. Tela premium con ventilación estratégica.',
    price: 46000, leagueId: 'liga-argentina', teamId: 'boca-juniors',
    images: [_img('1E3A8A', 'Boca+Juniors\\nTitular+2026'), _img2('CAAB09', 'Boca+Juniors\\nDetalle')],
    sizes: { S: 2, M: 8, L: 15, XL: 7, XXL: 4 },
  },
  {
    id: pid(), title: 'Camiseta Suplente Boca Juniors 2026',
    description: 'Camiseta suplente Adidas Boca Juniors 2026 en amarillo con detalles azules. Confección liviana y transpirable. Escudo termosellado de alta calidad.',
    price: 44000, leagueId: 'liga-argentina', teamId: 'boca-juniors',
    images: [_img('CAAB09', 'Boca+Juniors\\nSuplente+2026')],
    sizes: { S: 6, M: 11, L: 9, XL: 5, XXL: 1 },
  },

  // ─── Racing Club ───
  {
    id: pid(), title: 'Camiseta Titular Racing Club 2026',
    description: 'Camiseta titular Kappa Racing Club 2026. Rayas celestes y blancas clásicas. Tecnología Kombat con tejido ultraliviano y costuras ergonómicas para mayor comodidad.',
    price: 42000, leagueId: 'liga-argentina', teamId: 'racing-club',
    images: [_img('0EA5E9', 'Racing+Club\\nTitular+2026')],
    sizes: { S: 4, M: 9, L: 7, XL: 6, XXL: 3 },
  },

  // ─── San Lorenzo ───
  {
    id: pid(), title: 'Camiseta Titular San Lorenzo 2026',
    description: 'Camiseta titular Nike San Lorenzo 2026. Diseño clásico azulgrana con franja diagonal roja. Tecnología Dri-FIT ADV para control de humedad superior.',
    price: 43000, leagueId: 'liga-argentina', teamId: 'san-lorenzo',
    images: [_img('1D4ED8', 'San+Lorenzo\\nTitular+2026')],
    sizes: { S: 5, M: 7, L: 10, XL: 4, XXL: 2 },
  },

  // ─── Independiente ───
  {
    id: pid(), title: 'Camiseta Titular Independiente 2026',
    description: 'Camiseta titular Puma Independiente 2026. Rojo icónico del "Rojo de Avellaneda". Tecnología dryCELL para manejo óptimo de la transpiración.',
    price: 41000, leagueId: 'liga-argentina', teamId: 'independiente',
    images: [_img('DC2626', 'Independiente\\nTitular+2026')],
    sizes: { S: 3, M: 8, L: 6, XL: 5, XXL: 1 },
  },

  // ─── Manchester City ───
  {
    id: pid(), title: 'Camiseta Titular Manchester City 2026',
    description: 'Camiseta oficial Puma Manchester City 2025/26. Sky blue clásico con detalles en blanco. Tecnología dryCELL moisture-wicking. Tejido 100% poliéster reciclado.',
    price: 55000, leagueId: 'premier-league', teamId: 'manchester-city',
    images: [_img('6CADDF', 'Man+City\\nHome+2026'), _img2('93C5E8', 'Man+City\\nDetalle')],
    sizes: { S: 4, M: 10, L: 12, XL: 6, XXL: 3 },
  },
  {
    id: pid(), title: 'Short Titular Manchester City 2026',
    description: 'Short oficial Manchester City en blanco con detalles celestes. Cintura elástica con cordón interno. Tela ultraligera con ventilación.',
    price: 32000, leagueId: 'premier-league', teamId: 'manchester-city',
    images: [_img('ffffff', 'Man+City\\nShort+2026')],
    sizes: { S: 7, M: 12, L: 8, XL: 5, XXL: 2 },
  },

  // ─── Liverpool ───
  {
    id: pid(), title: 'Camiseta Titular Liverpool 2026',
    description: 'Camiseta oficial Nike Liverpool FC 2025/26. Rojo vibrante con cuello en V moderno. Tecnología Dri-FIT ADV premium. You\'ll Never Walk Alone grabado en el interior del cuello.',
    price: 56000, leagueId: 'premier-league', teamId: 'liverpool',
    images: [_img('C8102E', 'Liverpool\\nHome+2026'), _img2('e03040', 'Liverpool\\nDetalle')],
    sizes: { S: 6, M: 14, L: 10, XL: 8, XXL: 4 },
  },

  // ─── Arsenal ───
  {
    id: pid(), title: 'Camiseta Titular Arsenal 2026',
    description: 'Camiseta oficial Adidas Arsenal 2025/26. Rojo cannon clásico con mangas blancas. Tecnología AEROREADY moisture-absorbing. Diseño Heritage reinventado.',
    price: 54000, leagueId: 'premier-league', teamId: 'arsenal',
    images: [_img('EF0107', 'Arsenal\\nHome+2026')],
    sizes: { S: 5, M: 11, L: 9, XL: 4, XXL: 2 },
  },

  // ─── Chelsea ───
  {
    id: pid(), title: 'Camiseta Titular Chelsea 2026',
    description: 'Camiseta oficial Nike Chelsea FC 2025/26. Azul royal con detalles dorados. Tecnología Dri-FIT con tejido de alto rendimiento.',
    price: 53000, leagueId: 'premier-league', teamId: 'chelsea',
    images: [_img('034694', 'Chelsea\\nHome+2026')],
    sizes: { S: 4, M: 9, L: 11, XL: 6, XXL: 3 },
  },

  // ─── Real Madrid ───
  {
    id: pid(), title: 'Camiseta Titular Real Madrid 2026',
    description: 'Camiseta oficial Adidas Real Madrid 2025/26. Blanco impecable con detalles dorados. Tecnología AEROREADY. Escudo del Real Madrid bordado con hilo dorado. La camiseta más vendida del mundo.',
    price: 58000, leagueId: 'la-liga', teamId: 'real-madrid',
    images: [_img('FEBE10', 'Real+Madrid\\nHome+2026'), _img2('ffffff', 'Real+Madrid\\nDetalle')],
    sizes: { S: 3, M: 15, L: 12, XL: 8, XXL: 5 },
  },
  {
    id: pid(), title: 'Camiseta Suplente Real Madrid 2026',
    description: 'Camiseta suplente Adidas Real Madrid 2025/26 en negro con detalles turquesa. Diseño moderno y elegante. Misma calidad premium que la versión titular.',
    price: 56000, leagueId: 'la-liga', teamId: 'real-madrid',
    images: [_img('1a1a1a', 'Real+Madrid\\nAway+2026')],
    sizes: { S: 5, M: 10, L: 8, XL: 6, XXL: 2 },
  },

  // ─── Barcelona ───
  {
    id: pid(), title: 'Camiseta Titular Barcelona 2026',
    description: 'Camiseta oficial Nike FC Barcelona 2025/26. Rayas azulgrana clásicas reimaginadas con un diseño moderno. Tecnología Dri-FIT ADV. "Més que un club" en el interior.',
    price: 57000, leagueId: 'la-liga', teamId: 'barcelona',
    images: [_img('A50044', 'Barcelona\\nHome+2026'), _img2('004D98', 'Barcelona\\nDetalle')],
    sizes: { S: 4, M: 13, L: 11, XL: 7, XXL: 3 },
  },

  // ─── Atlético Madrid ───
  {
    id: pid(), title: 'Camiseta Titular Atlético Madrid 2026',
    description: 'Camiseta oficial Nike Atlético de Madrid 2025/26. Rayas rojiblancas verticales clásicas. Tecnología Dri-FIT para comodidad durante la actividad.',
    price: 52000, leagueId: 'la-liga', teamId: 'atletico-madrid',
    images: [_img('CE3524', 'Atletico\\nHome+2026')],
    sizes: { S: 3, M: 8, L: 7, XL: 5, XXL: 2 },
  },

  // ─── Juventus ───
  {
    id: pid(), title: 'Camiseta Titular Juventus 2026',
    description: 'Camiseta oficial Adidas Juventus 2025/26. Icónicas rayas bianconere en blanco y negro. Tecnología AEROREADY con ventilación de alto rendimiento.',
    price: 54000, leagueId: 'serie-a', teamId: 'juventus',
    images: [_img('000000', 'Juventus\\nHome+2026'), _img2('333333', 'Juventus\\nDetalle')],
    sizes: { S: 5, M: 10, L: 9, XL: 6, XXL: 4 },
  },

  // ─── Inter de Milán ───
  {
    id: pid(), title: 'Camiseta Titular Inter de Milán 2026',
    description: 'Camiseta oficial Nike Inter de Milán 2025/26. Rayas nerazzurre en negro y azul. Tecnología Dri-FIT ADV con costuras planas para comodidad.',
    price: 53000, leagueId: 'serie-a', teamId: 'inter-milan',
    images: [_img('0068A8', 'Inter+Milan\\nHome+2026')],
    sizes: { S: 4, M: 9, L: 8, XL: 5, XXL: 2 },
  },

  // ─── AC Milan ───
  {
    id: pid(), title: 'Camiseta Titular AC Milan 2026',
    description: 'Camiseta oficial Puma AC Milan 2025/26. Rayas rossonere en rojo y negro. Tecnología dryCELL para máximo confort.',
    price: 52000, leagueId: 'serie-a', teamId: 'ac-milan',
    images: [_img('FB090B', 'AC+Milan\\nHome+2026')],
    sizes: { S: 3, M: 7, L: 10, XL: 6, XXL: 3 },
  },

  // ─── Selección Argentina ───
  {
    id: pid(), title: 'Camiseta Titular Selección Argentina 2026',
    description: 'Camiseta oficial Adidas de la Selección Argentina 2026. Rayas albicelestes con 3 estrellas mundialistas. Tecnología HEAT.RDY. Edición especial campeón del mundo.',
    price: 62000, leagueId: 'selecciones', teamId: 'sel-argentina',
    images: [_img('75AADB', 'Argentina\\nTitular+2026'), _img2('abcde8', 'Argentina\\nDetalle')],
    sizes: { S: 2, M: 8, L: 14, XL: 10, XXL: 5 },
  },
  {
    id: pid(), title: 'Camiseta Suplente Selección Argentina 2026',
    description: 'Camiseta suplente Adidas Selección Argentina 2026. Violeta oscuro con detalles celestes. Diseño innovador que rinde homenaje a la pasión argentina.',
    price: 60000, leagueId: 'selecciones', teamId: 'sel-argentina',
    images: [_img('4a1a6b', 'Argentina\\nSuplente+2026')],
    sizes: { S: 4, M: 12, L: 10, XL: 7, XXL: 3 },
  },
  {
    id: pid(), title: 'Short Titular Selección Argentina 2026',
    description: 'Short oficial negro Selección Argentina 2026. Escudo AFA bordado. Cintura con elástico y cordón. Tecnología Aeroready.',
    price: 30000, leagueId: 'selecciones', teamId: 'sel-argentina',
    images: [_img('1a1a2e', 'Argentina\\nShort+2026')],
    sizes: { S: 6, M: 14, L: 12, XL: 8, XXL: 4 },
  },

  // ─── Brasil ───
  {
    id: pid(), title: 'Camiseta Titular Selección Brasil 2026',
    description: 'Camiseta oficial Nike de la Selección de Brasil 2026. Amarillo vibrante con detalles verdes. Tecnología Dri-FIT ADV. La "amarelinha" más icónica del fútbol mundial.',
    price: 58000, leagueId: 'selecciones', teamId: 'sel-brasil',
    images: [_img('CAAB09', 'Brasil\\nTitular+2026'), _img2('e8d44d', 'Brasil\\nDetalle')],
    sizes: { S: 5, M: 11, L: 9, XL: 6, XXL: 3 },
  },

  // ─── Francia ───
  {
    id: pid(), title: 'Camiseta Titular Selección Francia 2026',
    description: 'Camiseta oficial Nike de la Selección de Francia 2026. Azul marino elegante con detalles dorados. Tecnología Dri-FIT. Escudo de la FFF con las dos estrellas mundialistas.',
    price: 57000, leagueId: 'selecciones', teamId: 'sel-francia',
    images: [_img('002654', 'Francia\\nTitular+2026')],
    sizes: { S: 3, M: 9, L: 8, XL: 5, XXL: 2 },
  },

  // ─── Alemania ───
  {
    id: pid(), title: 'Camiseta Titular Selección Alemania 2026',
    description: 'Camiseta oficial Adidas de la Selección de Alemania 2026. Blanco clásico con detalles en negro y colores de la bandera. Tecnología AEROREADY.',
    price: 55000, leagueId: 'selecciones', teamId: 'sel-alemania',
    images: [_img('1a1a1a', 'Alemania\\nTitular+2026')],
    sizes: { S: 4, M: 10, L: 7, XL: 5, XXL: 2 },
  },
];

// ── Post-procesado: agregar flags a datos de ejemplo ─────────────
// featured = producto destacado, isNew = nuevo ingreso,
// originalPrice = precio original (si hay descuento), createdAt = fecha
(function () {
  const featured = ['prod-001','prod-004','prod-010','prod-012','prod-015','prod-017','prod-021'];
  const nuevo    = ['prod-002','prod-005','prod-016','prod-022','prod-025','prod-027'];
  const ofertas  = { 'prod-003': 35000, 'prod-006': 49000, 'prod-009': 48000, 'prod-011': 38000, 'prod-023': 36000, 'prod-019': 62000 };

  const now = Date.now();
  DEFAULT_PRODUCTS.forEach((p, i) => {
    p.featured      = featured.includes(p.id);
    p.isNew         = nuevo.includes(p.id);
    p.originalPrice = ofertas[p.id] || null;
    p.createdAt     = now - (DEFAULT_PRODUCTS.length - i) * 86400000; // simular fechas escalonadas
  });
})();


// ══════════════════════════════════════════════════════════════════
//  DataStore – CRUD con LocalStorage
// ══════════════════════════════════════════════════════════════════

class DataStore {
  constructor() {
    this._init();
  }

  /* ── Inicialización ─────────────────────────────────────────── */
  _init() {
    if (!localStorage.getItem(CONFIG.localStorageKeys.leagues)) {
      localStorage.setItem(CONFIG.localStorageKeys.leagues, JSON.stringify(DEFAULT_LEAGUES));
    }
    if (!localStorage.getItem(CONFIG.localStorageKeys.teams)) {
      localStorage.setItem(CONFIG.localStorageKeys.teams, JSON.stringify(DEFAULT_TEAMS));
    }
    if (!localStorage.getItem(CONFIG.localStorageKeys.products)) {
      localStorage.setItem(CONFIG.localStorageKeys.products, JSON.stringify(DEFAULT_PRODUCTS));
    }
  }

  /* Resetear todos los datos a valores por defecto */
  resetData() {
    localStorage.removeItem(CONFIG.localStorageKeys.leagues);
    localStorage.removeItem(CONFIG.localStorageKeys.teams);
    localStorage.removeItem(CONFIG.localStorageKeys.products);
    this._init();
  }

  /* ── Settings ───────────────────────────────────────────────── */
  getSettings() {
    return JSON.parse(localStorage.getItem(CONFIG.localStorageKeys.settings) || '{"instagram":"","facebook":"","mapsEmbed":""}');
  }
  updateSettings(settings) {
    localStorage.setItem(CONFIG.localStorageKeys.settings, JSON.stringify(settings));
  }

  /* ── Leagues ────────────────────────────────────────────────── */
  getLeagues() {
    return JSON.parse(localStorage.getItem(CONFIG.localStorageKeys.leagues) || '[]')
      .sort((a, b) => a.order - b.order);
  }

  /* ── Teams ──────────────────────────────────────────────────── */
  getTeams() {
    return JSON.parse(localStorage.getItem(CONFIG.localStorageKeys.teams) || '[]');
  }

  getTeamsByLeague(leagueId) {
    return this.getTeams().filter(t => t.leagueId === leagueId);
  }

  getTeamById(teamId) {
    return this.getTeams().find(t => t.id === teamId) || null;
  }

  /* ── Products ───────────────────────────────────────────────── */
  getProducts() {
    return JSON.parse(localStorage.getItem(CONFIG.localStorageKeys.products) || '[]');
  }

  getProductById(id) {
    return this.getProducts().find(p => p.id === id) || null;
  }

  getProductsByLeague(leagueId) {
    return this.getProducts().filter(p => p.leagueId === leagueId);
  }

  getProductsByTeam(teamId) {
    return this.getProducts().filter(p => p.teamId === teamId);
  }

  searchProducts(query) {
    const q = query.toLowerCase().trim();
    if (!q) return this.getProducts();
    return this.getProducts().filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.teamId.toLowerCase().includes(q)
    );
  }

  getFeaturedProducts() {
    return this.getProducts().filter(p => p.featured);
  }

  getNewProducts() {
    return this.getProducts()
      .filter(p => p.isNew)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  getOfferProducts() {
    return this.getProducts().filter(p => p.originalPrice && p.originalPrice > p.price);
  }

  addProduct(product) {
    const products = this.getProducts();
    product.id = 'prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    products.push(product);
    this._saveProducts(products);
    return product;
  }

  updateProduct(id, updates) {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...updates, id };
    this._saveProducts(products);
    return products[idx];
  }

  deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    this._saveProducts(products);
  }

  getTotalStock() {
    return this.getProducts().reduce((total, p) => {
      return total + Object.values(p.sizes).reduce((s, v) => s + v, 0);
    }, 0);
  }

  _saveProducts(products) {
    localStorage.setItem(CONFIG.localStorageKeys.products, JSON.stringify(products));
  }

  _saveLeagues(leagues) {
    localStorage.setItem(CONFIG.localStorageKeys.leagues, JSON.stringify(leagues));
  }

  _saveTeams(teams) {
    localStorage.setItem(CONFIG.localStorageKeys.teams, JSON.stringify(teams));
  }

  /* ── Leagues CRUD ───────────────────────────────────────────── */
  addLeague(league) {
    const leagues = this.getLeagues();
    league.id = league.id || 'league-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    league.order = leagues.length + 1;
    leagues.push(league);
    this._saveLeagues(leagues);
    return league;
  }

  updateLeague(id, updates) {
    const leagues = this.getLeagues();
    const idx = leagues.findIndex(l => l.id === id);
    if (idx === -1) return null;
    leagues[idx] = { ...leagues[idx], ...updates, id };
    this._saveLeagues(leagues);
    return leagues[idx];
  }

  deleteLeague(id) {
    // Cascade: eliminar equipos y productos de esta liga
    const teams = this.getTeams().filter(t => t.leagueId !== id);
    this._saveTeams(teams);
    const products = this.getProducts().filter(p => p.leagueId !== id);
    this._saveProducts(products);
    const leagues = this.getLeagues().filter(l => l.id !== id);
    this._saveLeagues(leagues);
  }

  reorderLeagues(orderedIds) {
    const leagues = this.getLeagues();
    orderedIds.forEach((id, i) => {
      const l = leagues.find(x => x.id === id);
      if (l) l.order = i + 1;
    });
    this._saveLeagues(leagues);
  }

  /* ── Teams CRUD ─────────────────────────────────────────────── */
  addTeam(team) {
    const teams = this.getTeams();
    team.id = team.id || 'team-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    teams.push(team);
    this._saveTeams(teams);
    return team;
  }

  updateTeam(id, updates) {
    const teams = this.getTeams();
    const idx = teams.findIndex(t => t.id === id);
    if (idx === -1) return null;
    teams[idx] = { ...teams[idx], ...updates, id };
    this._saveTeams(teams);
    return teams[idx];
  }

  deleteTeam(id) {
    // Cascade: eliminar productos de este equipo
    const products = this.getProducts().filter(p => p.teamId !== id);
    this._saveProducts(products);
    const teams = this.getTeams().filter(t => t.id !== id);
    this._saveTeams(teams);
  }

  getLeagueById(id) {
    return this.getLeagues().find(l => l.id === id) || null;
  }

  /* ── Auth (básica) ──────────────────────────────────────────── */
  login(user, pass) {
    if (user === CONFIG.adminUser && pass === CONFIG.adminPass) {
      sessionStorage.setItem(CONFIG.localStorageKeys.auth, 'true');
      return true;
    }
    return false;
  }

  logout() {
    sessionStorage.removeItem(CONFIG.localStorageKeys.auth);
  }

  isAuthenticated() {
    return sessionStorage.getItem(CONFIG.localStorageKeys.auth) === 'true';
  }
}

// Instancia global
const store = new DataStore();
