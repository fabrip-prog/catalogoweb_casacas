/* ===================================================================
   CasacasStore – Firebase DataStore (Reemplazo de LocalStorage)
   =================================================================== */

// 1. Configuración de Firebase (DEBES REEMPLAZAR ESTOS VALORES)
const firebaseConfig = {
  apiKey: "AIzaSyC3_uUJGxZ9AHjj9g_YbEKeBozaLctz7Y8",
  authDomain: "catalogoweb-fe44d.firebaseapp.com",
  projectId: "catalogoweb-fe44d",
  storageBucket: "catalogoweb-fe44d.firebasestorage.app",
  messagingSenderId: "1067884332174",
  appId: "1:1067884332174:web:312a4bd253b8142bc7b5df",
  measurementId: "G-LE8XWP32TL"
};

// 2. Inicializar Firebase
let db = null;
let storage = null;
let useFirebase = firebaseConfig.apiKey !== "TU_API_KEY_AQUI";

if (useFirebase) {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
  storage = firebase.storage();
  window.storage = storage; // Para acceso desde admin.js
} else {
  console.warn("⚠️ Firebase no está configurado. Usando la base de datos LocalStorage como respaldo.");
}

class DataStore {
  constructor() {
    this.leagues = [];
    this.teams = [];
    this.products = [];
    this.settings = { instagram:'', facebook:'', mapsEmbed:'' };
    this.dataLoaded = false;
    
    // Escuchar cambios en tiempo real
    this._initListeners();
  }

  _initListeners() {
    let collectionsLoaded = 0;
    const checkReady = () => {
      collectionsLoaded++;
      // Esperamos 4 colecciones (leagues, teams, products, settings)
      if (collectionsLoaded === 4) {
        this.dataLoaded = true;
        // Avisar a la app que los datos están listos
        document.dispatchEvent(new Event('storeReady'));
        this._checkInitialData();
      } else if (this.dataLoaded) {
        // Si hay actualizaciones después de la carga inicial
        document.dispatchEvent(new Event('storeUpdate'));
      }
    };

    db.collection('leagues').onSnapshot(snap => {
      this.leagues = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      checkReady();
    }, err => console.error("Error cargando ligas (¿Configuraste Firebase?)", err));
    
    db.collection('teams').onSnapshot(snap => {
      this.teams = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      checkReady();
    });
    
    db.collection('products').onSnapshot(snap => {
      this.products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      checkReady();
    });

    db.collection('settings').doc('general').onSnapshot(snap => {
      if (snap.exists) this.settings = snap.data();
      checkReady();
    });
  }

  async _checkInitialData() {
    if (this.leagues.length === 0 && this.teams.length === 0 && this.products.length === 0) {
      console.log("DB vacía. Sembrando datos...");
      try {
        const batch = db.batch();
        // Asume que DEFAULT_LEAGUES, TEAMS y PRODUCTS están definidos en data.js
        DEFAULT_LEAGUES.forEach(l => batch.set(db.collection('leagues').doc(l.id), l));
        DEFAULT_TEAMS.forEach(t => batch.set(db.collection('teams').doc(t.id), t));
        DEFAULT_PRODUCTS.forEach(p => batch.set(db.collection('products').doc(p.id), p));
        await batch.commit();
      } catch (e) {
        console.warn("Error al sembrar datos. Probablemente faltan permisos en Firestore Rules.", e);
      }
    }
  }

  /* ── Lectura (Caché local sincronizado) ───────────────── */
  getSettings() { return this.settings; }
  async updateSettings(settings) {
    await db.collection('settings').doc('general').set(settings, { merge: true });
  }

  getLeagues() { return [...this.leagues].sort((a, b) => (a.order || 0) - (b.order || 0)); }
  getTeams() { return this.teams; }
  getTeamsByLeague(leagueId) { return this.teams.filter(t => t.leagueId === leagueId); }
  getTeamById(teamId) { return this.teams.find(t => t.id === teamId) || null; }
  
  getProducts() { return this.products; }
  getProductById(id) { return this.products.find(p => p.id === id) || null; }
  getProductsByLeague(leagueId) { return this.products.filter(p => p.leagueId === leagueId); }
  getProductsByTeam(teamId) { return this.products.filter(p => p.teamId === teamId); }
  
  searchProducts(query) {
    const q = query.toLowerCase().trim();
    if (!q) return this.products;
    return this.products.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      p.teamId.toLowerCase().includes(q)
    );
  }
  
  getFeaturedProducts() { return this.products.filter(p => p.featured); }
  getNewProducts() { return [...this.products].filter(p => p.isNew).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); }
  getOfferProducts() { return this.products.filter(p => p.originalPrice && p.originalPrice > p.price); }
  getTotalStock() {
    return this.products.reduce((total, p) => total + Object.values(p.sizes || {}).reduce((s, v) => s + v, 0), 0);
  }
  getLeagueById(id) { return this.leagues.find(l => l.id === id) || null; }

  /* ── Escritura (Asincrónica a Firestore) ────────────────────── */
  async addProduct(product) {
    product.id = product.id || 'prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    await db.collection('products').doc(product.id).set(product);
    return product;
  }
  async updateProduct(id, updates) {
    await db.collection('products').doc(id).update(updates);
  }
  async deleteProduct(id) {
    await db.collection('products').doc(id).delete();
  }

  async addLeague(league) {
    league.id = league.id || 'league-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    league.order = league.order || this.leagues.length + 1;
    await db.collection('leagues').doc(league.id).set(league);
    return league;
  }
  async updateLeague(id, updates) {
    await db.collection('leagues').doc(id).update(updates);
  }
  async deleteLeague(id) {
    const batch = db.batch();
    batch.delete(db.collection('leagues').doc(id));
    this.getTeamsByLeague(id).forEach(t => batch.delete(db.collection('teams').doc(t.id)));
    this.getProductsByLeague(id).forEach(p => batch.delete(db.collection('products').doc(p.id)));
    await batch.commit();
  }

  async addTeam(team) {
    team.id = team.id || 'team-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    await db.collection('teams').doc(team.id).set(team);
    return team;
  }
  async updateTeam(id, updates) {
    await db.collection('teams').doc(id).update(updates);
  }
  async deleteTeam(id) {
    const batch = db.batch();
    batch.delete(db.collection('teams').doc(id));
    this.getProductsByTeam(id).forEach(p => batch.delete(db.collection('products').doc(p.id)));
    await batch.commit();
  }

  /* ── Auth ──────────────────────────────────────────── */
  login(user, pass) {
    // Por simplicidad, mantiene el auth local. Lo ideal sería usar Firebase Auth.
    if (user === CONFIG.adminUser && pass === CONFIG.adminPass) {
      sessionStorage.setItem(CONFIG.localStorageKeys.auth, 'true');
      return true;
    }
    return false;
  }
  logout() { sessionStorage.removeItem(CONFIG.localStorageKeys.auth); }
  isAuthenticated() { return sessionStorage.getItem(CONFIG.localStorageKeys.auth) === 'true'; }
  resetData() { alert("Para resetear, borrá los documentos en la consola de Firebase."); }
}

// Reemplazamos la instancia global solo si configuró Firebase
if (useFirebase) {
  window.store = new DataStore();
}
