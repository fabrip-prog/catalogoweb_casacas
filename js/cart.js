/* ===================================================================
   NYA Fútbol – Cart Module
   =================================================================== */

class Cart {
  constructor() {
    this.items = JSON.parse(localStorage.getItem(CONFIG.localStorageKeys.cart) || '[]');
  }

  /* ── Operaciones ────────────────────────────────────────────── */
  addItem(productId, size, quantity = 1) {
    const product = store.getProductById(productId);
    if (!product) return false;

    // Verificar stock
    const available = product.sizes[size] || 0;
    const existing = this.items.find(i => i.productId === productId && i.size === size);
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty + quantity > available) {
      this._notify('Sin stock suficiente para ese talle', 'error');
      return false;
    }

    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({
        productId,
        title: product.title,
        price: product.price,
        size,
        quantity,
        image: product.images[0] || '',
      });
    }
    this._save();
    this._notify(`${product.title} (${size}) agregado al carrito`, 'success');
    return true;
  }

  removeItem(index) {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
      this._save();
    }
  }

  updateQuantity(index, newQty) {
    if (index < 0 || index >= this.items.length) return;
    const item = this.items[index];
    const product = store.getProductById(item.productId);
    if (!product) return;

    const available = product.sizes[item.size] || 0;
    if (newQty > available) {
      this._notify(`Solo hay ${available} unidades disponibles`, 'error');
      return;
    }
    if (newQty <= 0) {
      this.removeItem(index);
      return;
    }
    item.quantity = newQty;
    this._save();
  }

  clear() {
    this.items = [];
    this._save();
  }

  // Total de los productos: el envío no se cobra en la tienda, se coordina con el vendedor
  getTotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getTotalItems() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  isEmpty() {
    return this.items.length === 0;
  }

  _save() {
    localStorage.setItem(CONFIG.localStorageKeys.cart, JSON.stringify(this.items));
    this._updateBadge();
    if (typeof renderCartSidebar === 'function') renderCartSidebar();
  }

  _updateBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    const count = this.getTotalItems();
    badge.textContent = count;
    if (count > 0) {
      badge.classList.remove('hidden');
      badge.classList.add('cart-badge-pulse');
      setTimeout(() => badge.classList.remove('cart-badge-pulse'), 400);
    } else {
      badge.classList.add('hidden');
    }
  }

  _notify(message, type = 'success') {
    showNotification(message, type);
  }

  /* ── WhatsApp Message Generation ────────────────────────────── */
  generateWhatsAppMessage() {
    if (this.isEmpty()) return '';

    const orderNum = this.currentOrderNumber || Math.floor(1000 + Math.random() * 9000);
    const date = this.currentOrderDate || new Date().toLocaleString('es-AR');

    let msg = `🛒 *Comprobante de Pedido - ${CONFIG.storeName}*\n`;
    msg += `🎫 *Orden:* #${orderNum}\n`;
    msg += `📅 *Fecha:* ${date}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    this.items.forEach((item, i) => {
      const quality = qualityLabel(store.getProductById(item.productId)?.quality);
      msg += `${i + 1}. *${item.title}*\n`;
      if (quality) msg += `   🏷️ Calidad: ${quality}\n`;
      msg += `   📏 Talle: ${item.size}\n`;
      msg += `   📦 Cantidad: ${item.quantity}\n`;
      msg += `   💰 Precio: ${CONFIG.currency}${item.price.toLocaleString('es-AR')}\n`;
      msg += `   💵 Subtotal: ${CONFIG.currency}${(item.price * item.quantity).toLocaleString('es-AR')}\n\n`;
    });

    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *TOTAL SIN ENVÍO: ${CONFIG.currency}${this.getTotal().toLocaleString('es-AR')}*\n`;
    msg += `📦 *Productos: ${this.getTotalItems()} items*\n`;
    msg += `🚚 *Envío:* a coordinar con el vendedor\n\n`;
    msg += `_Enviado desde ${CONFIG.storeName}_`;

    return msg;
  }

  generateSingleProductMessage(productId, size) {
    const product = store.getProductById(productId);
    if (!product) return '';

    let msg = `👋 ¡Hola! Estoy interesado en:\n\n`;
    msg += `⚽ *${product.title}*\n`;
    if (product.quality) msg += `🏷️ Calidad: ${qualityLabel(product.quality)}\n`;
    if (size) msg += `📏 Talle: ${size}\n`;
    msg += `💰 Precio: ${CONFIG.currency}${product.price.toLocaleString('es-AR')}\n\n`;
    msg += `¿Está disponible? ¡Gracias!`;

    return msg;
  }

  sendWhatsApp() {
    const msg = this.generateWhatsAppMessage();
    if (!msg) return;
    const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  sendSingleWhatsApp(productId, size) {
    const msg = this.generateSingleProductMessage(productId, size);
    if (!msg) return;
    const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  init() {
    this._updateBadge();
  }
}

// ── Notification helper ──────────────────────────────────────────
function showNotification(message, type = 'success') {
  const container = document.getElementById('notifications');
  if (!container) return;

  const variants = {
    success: 'toast',
    error: 'toast toast-error',
    info: 'toast',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  const el = document.createElement('div');
  el.className = `notif-enter ${variants[type]}`;
  el.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="flex-1">${message}</span>
  `;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.remove('notif-enter');
    el.classList.add('notif-exit');
    setTimeout(() => el.remove(), 350);
  }, 2500);
}

// Instancia global
const cart = new Cart();
