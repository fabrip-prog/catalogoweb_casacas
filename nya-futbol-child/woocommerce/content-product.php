<?php
/**
 * NYA Fútbol – Plantilla de Card de Producto (Loop)
 *
 * Sobrescribe: woocommerce/content-product.php
 * Replica la estructura de tarjeta "Casaca FC Estudio" con:
 * - Placa fotográfica con badges flotantes
 * - Equipo con dot de color
 * - Calidad de la camiseta
 * - Precios con descuento visual
 * - Talles disponibles inline
 * - Botones de agregar al carrito + WhatsApp
 *
 * @package NYA_Futbol_Child
 * @version 9.4.0
 */

defined( 'ABSPATH' ) || exit;

global $product;

// Verificar que el producto sea válido y visible
if ( empty( $product ) || ! $product->is_visible() ) {
	return;
}
?>
<li <?php wc_product_class( 'card', $product ); ?>>

	<?php
	/**
	 * Hook: woocommerce_before_shop_loop_item.
	 * Por defecto incluye: link de apertura del producto.
	 */
	?>
	<a href="<?php echo esc_url( $product->get_permalink() ); ?>" class="woocommerce-LoopProduct-link">

		<?php
		// ── Placa fotográfica ───────────────────────────────────────
		?>
		<div class="nya-photo-plate">
			<?php
			/**
			 * Hook: woocommerce_before_shop_loop_item_title.
			 *
			 * @hooked nya_product_badges - 5 (badges personalizados)
			 * @hooked woocommerce_show_product_loop_item_sale_flash - 10
			 * @hooked woocommerce_template_loop_product_thumbnail - 10
			 */
			do_action( 'woocommerce_before_shop_loop_item_title' );
			?>
		</div>

	</a>

	<?php
	// ── Información del producto ───────────────────────────────────
	?>
	<div class="nya-meta">

		<?php
		// Título
		?>
		<a href="<?php echo esc_url( $product->get_permalink() ); ?>" class="nya-card-title-link">
			<h2 class="woocommerce-loop-product__title card-title">
				<?php echo get_the_title(); // phpcs:ignore ?>
			</h2>
		</a>

		<?php
		/**
		 * Hook: woocommerce_shop_loop_item_title.
		 *
		 * @hooked nya_show_team_in_card - 15 (equipo con dot de color)
		 * @hooked nya_show_quality_in_card - 16 (calidad de la camiseta)
		 */
		do_action( 'woocommerce_shop_loop_item_title' );
		?>

		<?php
		// Descripción corta (2 líneas)
		$short_desc = $product->get_short_description();
		if ( $short_desc ) :
		?>
			<p class="nya-card-desc"><?php echo wp_trim_words( wp_strip_all_tags( $short_desc ), 15 ); ?></p>
		<?php endif; ?>

		<?php
		/**
		 * Hook: woocommerce_after_shop_loop_item_title.
		 *
		 * @hooked woocommerce_template_loop_rating - 5
		 * @hooked woocommerce_template_loop_price - 10
		 * @hooked nya_show_sizes_in_card - 15 (talles disponibles)
		 */
		do_action( 'woocommerce_after_shop_loop_item_title' );
		?>

		<?php
		// ── Acciones ───────────────────────────────────────────────
		?>
		<div class="nya-card-actions">
			<?php
			/**
			 * Hook: woocommerce_after_shop_loop_item.
			 *
			 * @hooked woocommerce_template_loop_add_to_cart - 10
			 */
			do_action( 'woocommerce_after_shop_loop_item' );
			?>

			<?php
			// Botón de WhatsApp en la card
			$wa_number  = get_option( 'nya_whatsapp_number', '5493329506445' );
			$wa_message = rawurlencode(
				"👋 ¡Hola! Estoy interesado en:\n\n" .
				"⚽ *" . $product->get_name() . "*\n" .
				"💰 Precio: " . strip_tags( wc_price( $product->get_price() ) ) . "\n\n" .
				"¿Está disponible? ¡Gracias!"
			);
			?>
			<a href="https://wa.me/<?php echo esc_attr( $wa_number ); ?>?text=<?php echo $wa_message; ?>"
			   class="button alt btn-sm btn-icon nya-wa-card-btn"
			   target="_blank"
			   rel="noopener"
			   title="<?php esc_attr_e( 'Consultar por WhatsApp', 'nya-futbol-child' ); ?>">
				<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
			</a>
		</div>

	</div>

</li>
