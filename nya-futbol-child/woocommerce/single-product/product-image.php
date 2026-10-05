<?php
/**
 * NYA Fútbol – Plantilla de Producto Individual (Single Product)
 *
 * Sobrescribe: woocommerce/single-product/product-image.php
 * Replica el layout de galería "Casaca FC Estudio":
 * - Imagen principal sobre placa gris con sombra
 * - Contenedor de zoom con lupa interactiva
 * - Tira de miniaturas horizontales
 *
 * @package NYA_Futbol_Child
 * @version 9.4.0
 */

defined( 'ABSPATH' ) || exit;

global $product;

$columns           = apply_filters( 'woocommerce_product_thumbnails_columns', 4 );
$post_thumbnail_id = $product->get_image_id();
$wrapper_classes   = apply_filters(
	'woocommerce_single_product_image_gallery_classes',
	array(
		'woocommerce-product-gallery',
		'woocommerce-product-gallery--' . ( $post_thumbnail_id ? 'with-images' : 'without-images' ),
		'woocommerce-product-gallery--columns-' . absint( $columns ),
		'images',
		'nya-pdp-media',
	)
);
?>

<div class="<?php echo esc_attr( implode( ' ', array_map( 'sanitize_html_class', $wrapper_classes ) ) ); ?>"
     data-columns="<?php echo esc_attr( $columns ); ?>"
     style="opacity: 0; transition: opacity .25s ease-in-out;">

	<?php
	// ── Imagen principal con zoom ─────────────────────────────────
	?>
	<div class="nya-pdp-main woocommerce-product-gallery__wrapper">
		<?php
		if ( $post_thumbnail_id ) {
			$full_size = wp_get_attachment_image_src( $post_thumbnail_id, 'full' );
			$html      = '<div class="nya-zoom-container woocommerce-product-gallery__image" data-zoom-image="' . esc_url( $full_size[0] ) . '">';
			$html     .= wp_get_attachment_image(
				$post_thumbnail_id,
				'woocommerce_single',
				false,
				array(
					'class'           => 'wp-post-image nya-main-image',
					'data-large_image' => esc_url( $full_size[0] ),
					'data-large_image_width' => esc_attr( $full_size[1] ),
					'data-large_image_height' => esc_attr( $full_size[2] ),
				)
			);
			// Lente de zoom (controlada por JS)
			$html .= '<div class="nya-zoom-lens"></div>';
			$html .= '</div>';
		} else {
			$html  = '<div class="nya-zoom-container woocommerce-product-gallery__image--placeholder">';
			$html .= sprintf( '<img src="%s" alt="%s" class="wp-post-image" />', esc_url( wc_placeholder_img_src( 'woocommerce_single' ) ), esc_html__( 'Awaiting product image', 'woocommerce' ) );
			$html .= '</div>';
		}

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo apply_filters( 'woocommerce_single_product_image_thumbnail_html', $html, $post_thumbnail_id );
		?>
	</div>

	<?php
	// ── Tira de miniaturas ────────────────────────────────────────
	$attachment_ids = $product->get_gallery_image_ids();
	if ( $attachment_ids || $post_thumbnail_id ) :
	?>
		<div class="nya-pdp-thumbs">
			<?php
			// Miniatura de la imagen principal
			if ( $post_thumbnail_id ) {
				$thumb_url = wp_get_attachment_image_url( $post_thumbnail_id, 'thumbnail' );
				$full_url  = wp_get_attachment_image_url( $post_thumbnail_id, 'woocommerce_single' );
				$full_src  = wp_get_attachment_image_src( $post_thumbnail_id, 'full' );
				echo '<img src="' . esc_url( $thumb_url ) . '" '
				   . 'class="nya-gallery-thumb active" '
				   . 'data-full="' . esc_url( $full_url ) . '" '
				   . 'data-zoom="' . esc_url( $full_src[0] ) . '" '
				   . 'alt="' . esc_attr( $product->get_name() ) . '" '
				   . 'width="64" height="80">';
			}

			// Miniaturas de la galería
			foreach ( $attachment_ids as $attachment_id ) {
				$thumb_url = wp_get_attachment_image_url( $attachment_id, 'thumbnail' );
				$full_url  = wp_get_attachment_image_url( $attachment_id, 'woocommerce_single' );
				$full_src  = wp_get_attachment_image_src( $attachment_id, 'full' );
				echo '<img src="' . esc_url( $thumb_url ) . '" '
				   . 'class="nya-gallery-thumb" '
				   . 'data-full="' . esc_url( $full_url ) . '" '
				   . 'data-zoom="' . esc_url( $full_src[0] ) . '" '
				   . 'alt="' . esc_attr( $product->get_name() ) . '" '
				   . 'width="64" height="80">';
			}
			?>
		</div>
	<?php endif; ?>

</div>

<?php
/**
 * Script inline para la galería y el zoom
 * Se ejecuta después de que el DOM esté listo
 */
?>
<script>
(function() {
	'use strict';

	document.addEventListener('DOMContentLoaded', function() {

		// ── Cambio de imagen al clicar thumbnail ───────────────────
		var thumbs = document.querySelectorAll('.nya-gallery-thumb');
		var mainImg = document.querySelector('.nya-main-image');
		var zoomContainer = document.querySelector('.nya-zoom-container');

		thumbs.forEach(function(thumb) {
			thumb.addEventListener('click', function() {
				// Actualizar imagen principal
				if (mainImg) {
					mainImg.src = this.dataset.full;
					mainImg.dataset.large_image = this.dataset.zoom;
				}

				// Actualizar zoom container
				if (zoomContainer) {
					zoomContainer.dataset.zoomImage = this.dataset.zoom;
				}

				// Marcar thumb activo
				thumbs.forEach(function(t) { t.classList.remove('active'); });
				this.classList.add('active');
			});
		});

		// ── Lupa de Zoom (2.5x) ────────────────────────────────────
		var lens = document.querySelector('.nya-zoom-lens');

		if (zoomContainer && lens && mainImg) {
			var ZOOM = 2.5;

			// No activar en pantallas táctiles
			if (window.matchMedia('(hover: none)').matches) {
				lens.style.display = 'none';
				return;
			}

			zoomContainer.addEventListener('mouseenter', function() {
				var zoomSrc = zoomContainer.dataset.zoomImage || mainImg.dataset.large_image || mainImg.src;
				lens.style.backgroundImage = 'url(' + zoomSrc + ')';

				var rect = zoomContainer.getBoundingClientRect();
				lens.style.backgroundSize = (rect.width * ZOOM) + 'px ' + (rect.height * ZOOM) + 'px';
			});

			zoomContainer.addEventListener('mousemove', function(e) {
				var rect = zoomContainer.getBoundingClientRect();
				var x = e.clientX - rect.left;
				var y = e.clientY - rect.top;

				// Posicionar la lente centrada en el cursor
				var lensW = lens.offsetWidth;
				var lensH = lens.offsetHeight;
				var lensX = x - lensW / 2;
				var lensY = y - lensH / 2;

				// Limitar dentro del contenedor
				lensX = Math.max(0, Math.min(lensX, rect.width - lensW));
				lensY = Math.max(0, Math.min(lensY, rect.height - lensH));

				lens.style.left = lensX + 'px';
				lens.style.top = lensY + 'px';

				// Mover el fondo de la lente
				var bgX = -(lensX * ZOOM);
				var bgY = -(lensY * ZOOM);
				lens.style.backgroundPosition = bgX + 'px ' + bgY + 'px';
			});
		}
	});
})();
</script>

<style>
	/* ── Estilos de la galería NYA ─────────────────────────── */
	.nya-pdp-media {
		display: grid;
		gap: 12px;
		max-width: 640px;
	}
	.nya-pdp-main {
		background: var(--nya-tile);
		padding: clamp(24px, 8%, 56px);
	}
	.nya-zoom-container {
		position: relative;
		aspect-ratio: 4 / 5;
		overflow: hidden;
		cursor: crosshair;
		box-shadow: 0 26px 40px -26px var(--nya-shadow);
	}
	.nya-zoom-container img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		transition: transform .3s ease;
	}
	.nya-zoom-lens {
		position: absolute;
		z-index: 10;
		display: none;
		width: 140px;
		height: 140px;
		border: 1px solid var(--nya-ink);
		background-color: var(--nya-surface);
		background-repeat: no-repeat;
		box-shadow: 0 14px 30px -10px var(--nya-shadow);
		pointer-events: none;
	}
	.nya-zoom-container:hover .nya-zoom-lens {
		display: block;
	}
	@media (hover: none) {
		.nya-zoom-lens { display: none !important; }
		.nya-zoom-container { cursor: pointer; }
	}

	/* ── Thumbnails ────────────────────────────────────── */
	.nya-pdp-thumbs {
		display: flex;
		gap: 8px;
		overflow-x: auto;
	}
	.nya-gallery-thumb {
		flex: none;
		width: 64px;
		height: 80px;
		object-fit: contain;
		background: var(--nya-tile);
		border: 1px solid transparent;
		opacity: .6;
		cursor: pointer;
		transition: border-color .2s, opacity .2s;
	}
	.nya-gallery-thumb.active,
	.nya-gallery-thumb:hover {
		border-color: var(--nya-ink);
		opacity: 1;
	}

	/* ── Responsive ───────────────────────────────────── */
	@media (max-width: 860px) {
		.nya-pdp-media {
			max-width: none;
			margin-inline: calc(var(--nya-gutter) * -1);
		}
		.nya-pdp-thumbs {
			padding-inline: var(--nya-gutter);
		}
	}
</style>
