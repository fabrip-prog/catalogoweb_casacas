/**
 * NYA Fútbol – Scripts personalizados
 *
 * Funcionalidad JavaScript para el tema hijo:
 * - Checkout por WhatsApp (genera comprobante y envía)
 * - Header inteligente (ocultar/mostrar al scrollear)
 * - Animación de pulso en el badge del carrito
 *
 * @package NYA_Futbol_Child
 * @since   1.0.0
 */

(function ($) {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════
     1. CHECKOUT POR WHATSAPP
     ═══════════════════════════════════════════════════════════════════ */

  /**
   * Genera el mensaje de pedido completo y abre WhatsApp
   * Replica el formato del comprobante de la tienda estática
   */
  $(document).on('click', '#nya-whatsapp-checkout', function (e) {
    e.preventDefault();

    // Recoger los items del carrito desde las filas de la tabla
    var items = [];
    var $rows = $('.woocommerce-cart-form .cart_item');

    if ($rows.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    $rows.each(function () {
      var $row = $(this);
      var name = $row.find('.product-name a').text().trim();
      var qty  = $row.find('.product-quantity .qty').val() || '1';
      var price = $row.find('.product-price .woocommerce-Price-amount').text().trim();
      var subtotal = $row.find('.product-subtotal .woocommerce-Price-amount').text().trim();

      // Extraer variación (talle) si existe
      var variation = '';
      var $dl = $row.find('.variation');
      if ($dl.length) {
        $dl.find('dt').each(function (i) {
          var label = $(this).text().replace(':', '').trim();
          var value = $dl.find('dd').eq(i).text().trim();
          if (label.toLowerCase().includes('talle') || label.toLowerCase().includes('size')) {
            variation = value;
          }
        });
      }

      items.push({
        name: name,
        qty: qty,
        price: price,
        subtotal: subtotal,
        variation: variation,
      });
    });

    // Generar número de orden aleatorio
    var orderNumber = '#' + (1000 + Math.floor(Math.random() * 9000));

    // Fecha y hora actual
    var now = new Date();
    var dateStr = now.toLocaleString('es-AR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Total del carrito
    var total = $('.cart_totals .order-total .woocommerce-Price-amount').text().trim() || '—';

    // Construir el mensaje
    var msg = '🛒 *Comprobante de Pedido - ' + nyaData.shopName + ' ⚽*\n';
    msg += '🎫 *Orden:* ' + orderNumber + '\n';
    msg += '📅 *Fecha:* ' + dateStr + '\n';
    msg += '━━━━━━━━━━━━━━━━━━━━━━\n\n';

    var totalQty = 0;
    items.forEach(function (item, index) {
      totalQty += parseInt(item.qty, 10);
      msg += (index + 1) + '. *' + item.name + '*\n';
      if (item.variation) {
        msg += '   📏 Talle: ' + item.variation + '\n';
      }
      msg += '   📦 Cantidad: ' + item.qty + '\n';
      msg += '   💰 Precio: ' + item.price + '\n';
      msg += '   💵 Subtotal: ' + item.subtotal + '\n\n';
    });

    msg += '━━━━━━━━━━━━━━━━━━━━━━\n';
    msg += '💰 *TOTAL SIN ENVÍO: ' + total + '*\n';
    msg += '📦 *Productos: ' + totalQty + ' items*\n';
    msg += '🚚 *Envío:* a coordinar con el vendedor\n\n';
    msg += '_Enviado desde ' + nyaData.shopName + ' ⚽_';

    // Abrir WhatsApp
    var waUrl = 'https://wa.me/' + nyaData.whatsappNumber + '?text=' + encodeURIComponent(msg);
    window.open(waUrl, '_blank');
  });


  /* ═══════════════════════════════════════════════════════════════════
     2. HEADER INTELIGENTE (ocultar al bajar, mostrar al subir)
     ═══════════════════════════════════════════════════════════════════ */

  var lastScroll = 0;
  var $body = $('body');
  var scrollThreshold = 80; // px mínimos antes de ocultar

  $(window).on('scroll', function () {
    var currentScroll = window.pageYOffset;

    if (currentScroll <= scrollThreshold) {
      // Cerca del top: siempre mostrar
      $body.removeClass('header-hidden');
    } else if (currentScroll > lastScroll) {
      // Scrolleando hacia abajo: ocultar
      $body.addClass('header-hidden');
    } else {
      // Scrolleando hacia arriba: mostrar
      $body.removeClass('header-hidden');
    }

    lastScroll = currentScroll;
  });


  /* ═══════════════════════════════════════════════════════════════════
     3. ANIMACIÓN DEL BADGE DEL CARRITO
     ═══════════════════════════════════════════════════════════════════ */

  // Observar cambios en el mini-carrito para animar el contador
  $(document.body).on('added_to_cart', function () {
    var $count = $('.site-header-cart .count, .cart-contents .count');
    $count.addClass('nya-cart-pulse');
    setTimeout(function () {
      $count.removeClass('nya-cart-pulse');
    }, 400);
  });


  /* ═══════════════════════════════════════════════════════════════════
     4. ESTILOS DINÁMICOS PARA LA ANIMACIÓN DEL BADGE
     ═══════════════════════════════════════════════════════════════════ */

  // Inyectar keyframes si no existen
  if (!document.getElementById('nya-cart-pulse-style')) {
    var style = document.createElement('style');
    style.id = 'nya-cart-pulse-style';
    style.textContent =
      '@keyframes nyaBump { 40% { opacity: .2; } }' +
      '.nya-cart-pulse { animation: nyaBump .4s ease; }' +
      '.header-hidden .site-header { transform: translateY(-100%); transition: transform .3s cubic-bezier(.2,.7,.2,1); }' +
      '.site-header { transition: transform .3s cubic-bezier(.2,.7,.2,1); }';
    document.head.appendChild(style);
  }

})(jQuery);
