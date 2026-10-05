<?php
/**
 * NYA Fútbol – Child Theme functions
 *
 * Tema hijo de Storefront que replica la estética de la tienda estática
 * "NYA Fútbol": fondo gris cálido de estudio, Instrument Sans + DM Mono,
 * esquinas rectas, fotos sobre placas, badges de stock y descuento,
 * integración con WhatsApp y selector de talles visual.
 *
 * @package NYA_Futbol_Child
 * @since   1.0.0
 */

defined( 'ABSPATH' ) || exit;

/**
 * ──────────────────────────────────────────────────────────────────────
 * 1. ENQUEUE: Estilos y Scripts
 * ──────────────────────────────────────────────────────────────────────
 */
add_action( 'wp_enqueue_scripts', 'nya_child_enqueue', 20 );
function nya_child_enqueue() {

	// ── Google Fonts: Instrument Sans + DM Mono ────────────────────
	wp_enqueue_style(
		'nya-google-fonts',
		'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap',
		array(),
		null
	);

	// ── Estilos del tema padre (Storefront) ─────────────────────────
	wp_enqueue_style(
		'storefront-style',
		get_template_directory_uri() . '/style.css',
		array(),
		wp_get_theme( 'storefront' )->get( 'Version' )
	);

	// ── Estilos del tema hijo (style.css con la cabecera) ──────────
	wp_enqueue_style(
		'nya-child-style',
		get_stylesheet_uri(),
		array( 'storefront-style', 'nya-google-fonts' ),
		wp_get_theme()->get( 'Version' )
	);

	// ── JavaScript personalizado ───────────────────────────────────
	wp_enqueue_script(
		'nya-child-scripts',
		get_stylesheet_directory_uri() . '/assets/js/nya-scripts.js',
		array( 'jquery' ),
		wp_get_theme()->get( 'Version' ),
		true
	);

	// Pasar datos de configuración al JS
	wp_localize_script( 'nya-child-scripts', 'nyaData', array(
		'whatsappNumber' => get_option( 'nya_whatsapp_number', '5493329506445' ),
		'shopName'       => get_bloginfo( 'name' ),
		'currencySymbol' => get_woocommerce_currency_symbol(),
		'ajaxUrl'        => admin_url( 'admin-ajax.php' ),
		'nonce'          => wp_create_nonce( 'nya_nonce' ),
	) );
}


/**
 * ──────────────────────────────────────────────────────────────────────
 * 2. SOPORTE DE WOOCOMMERCE
 * ──────────────────────────────────────────────────────────────────────
 */
add_action( 'after_setup_theme', 'nya_child_setup' );
function nya_child_setup() {

	// Declarar soporte de WooCommerce
	add_theme_support( 'woocommerce', array(
		'thumbnail_image_width' => 600,
		'single_image_width'    => 900,
		'product_grid'          => array(
			'default_rows'    => 4,
			'default_columns' => 4,
			'min_columns'     => 2,
			'max_columns'     => 5,
		),
	) );

	// Galería de WooCommerce: zoom, lightbox y slider
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );
}


/**
 * ──────────────────────────────────────────────────────────────────────
 * 3. PERSONALIZAR LA CARD DE PRODUCTO (Archive / Shop)
 * ──────────────────────────────────────────────────────────────────────
 */

// ── 3a. Badge personalizado de descuento ───────────────────────────
add_filter( 'woocommerce_sale_flash', 'nya_custom_sale_badge', 10, 3 );
function nya_custom_sale_badge( $html, $post, $product ) {
	$percentage = '';
	if ( $product->is_on_sale() ) {
		if ( $product->is_type( 'variable' ) ) {
			$regular = $product->get_variation_regular_price( 'max' );
			$sale    = $product->get_variation_sale_price( 'min' );
		} else {
			$regular = $product->get_regular_price();
			$sale    = $product->get_sale_price();
		}
		if ( $regular && $sale ) {
			$percentage = round( ( ( $regular - $sale ) / $regular ) * 100 );
		}
	}

	if ( $percentage ) {
		return '<span class="onsale">-' . $percentage . '% OFF</span>';
	}
	return '<span class="onsale">' . esc_html__( '¡Oferta!', 'nya-futbol-child' ) . '</span>';
}

// ── 3b. Badges adicionales (Destacado, Nuevo, Stock bajo) ──────────
add_action( 'woocommerce_before_shop_loop_item_title', 'nya_product_badges', 5 );
function nya_product_badges() {
	global $product;

	echo '<div class="nya-badges">';

	// Badge "Destacado"
	if ( $product->is_featured() ) {
		echo '<span class="nya-badge">Destacado</span>';
	}

	// Badge "Nuevo" — productos publicados hace menos de 30 días
	$days_since = ( time() - strtotime( $product->get_date_created() ) ) / DAY_IN_SECONDS;
	if ( $days_since < 30 ) {
		echo '<span class="nya-badge">Nuevo</span>';
	}

	// Badge de stock
	if ( $product->managing_stock() ) {
		$stock = $product->get_stock_quantity();
		if ( $stock <= 0 ) {
			echo '<span class="nya-badge nya-badge--low">Agotado</span>';
		} elseif ( $stock <= 5 ) {
			echo '<span class="nya-badge nya-badge--low">¡Últimas!</span>';
		}
	}

	echo '</div>';
}

// ── 3c. Mostrar equipo debajo del título de la card ────────────────
add_action( 'woocommerce_shop_loop_item_title', 'nya_show_team_in_card', 15 );
function nya_show_team_in_card() {
	global $product;

	$teams = wp_get_post_terms( $product->get_id(), 'equipo' );
	if ( ! empty( $teams ) && ! is_wp_error( $teams ) ) {
		$team  = $teams[0];
		$color = get_term_meta( $team->term_id, 'nya_team_color', true );
		$logo  = get_term_meta( $team->term_id, 'nya_team_logo', true );

		echo '<p class="nya-card-team">';
		if ( $logo ) {
			echo '<img class="nya-mark-img" src="' . esc_url( $logo ) . '" alt="" width="16" height="16">';
		} elseif ( $color ) {
			echo '<span class="nya-team-dot" style="background:' . esc_attr( $color ) . '"></span>';
		}
		echo esc_html( $team->name );
		echo '</p>';
	}
}

// ── 3d. Mostrar calidad debajo del equipo ──────────────────────────
add_action( 'woocommerce_shop_loop_item_title', 'nya_show_quality_in_card', 16 );
function nya_show_quality_in_card() {
	global $product;
	$quality = $product->get_attribute( 'pa_calidad' );
	if ( $quality ) {
		echo '<p class="nya-card-quality">' . esc_html( $quality ) . '</p>';
	}
}

// ── 3e. Mostrar talles disponibles en la card ──────────────────────
add_action( 'woocommerce_after_shop_loop_item_title', 'nya_show_sizes_in_card', 15 );
function nya_show_sizes_in_card() {
	global $product;

	if ( ! $product->is_type( 'variable' ) ) {
		return;
	}

	$sizes_order = array( 'S', 'M', 'L', 'XL', 'XXL' );
	$variations  = $product->get_available_variations();

	// Construir mapa de stock por talle
	$stock_map = array();
	foreach ( $variations as $v ) {
		$attr_talle = isset( $v['attributes']['attribute_pa_talle'] )
			? strtoupper( $v['attributes']['attribute_pa_talle'] )
			: '';
		if ( $attr_talle ) {
			$variation_obj = wc_get_product( $v['variation_id'] );
			$stock_map[ $attr_talle ] = $variation_obj ? $variation_obj->get_stock_quantity() : 0;
		}
	}

	if ( empty( $stock_map ) ) {
		return;
	}

	echo '<div class="nya-avail">';
	foreach ( $sizes_order as $size ) {
		if ( ! isset( $stock_map[ $size ] ) ) {
			continue;
		}
		$qty   = (int) $stock_map[ $size ];
		$class = '';
		if ( $qty <= 0 ) {
			$class = 'off';
		} elseif ( $qty <= 3 ) {
			$class = 'low';
		}
		echo '<i class="' . esc_attr( $class ) . '">' . esc_html( $size ) . '</i>';
	}
	echo '</div>';
}


/**
 * ──────────────────────────────────────────────────────────────────────
 * 4. WHATSAPP: Botón en la ficha de producto y checkout
 * ──────────────────────────────────────────────────────────────────────
 */

// ── 4a. Botón "Consultar por WhatsApp" en la ficha del producto ────
add_action( 'woocommerce_single_product_summary', 'nya_whatsapp_single_button', 35 );
function nya_whatsapp_single_button() {
	global $product;
	$number = get_option( 'nya_whatsapp_number', '5493329506445' );
	$name   = $product->get_name();
	$price  = strip_tags( wc_price( $product->get_price() ) );

	$message = "👋 ¡Hola! Estoy interesado en:\n\n";
	$message .= "⚽ *{$name}*\n";
	$message .= "💰 Precio: {$price}\n\n";
	$message .= "¿Está disponible? ¡Gracias!";

	$url = 'https://wa.me/' . $number . '?text=' . rawurlencode( $message );

	echo '<a href="' . esc_url( $url ) . '" class="button alt nya-btn-whatsapp" target="_blank" rel="noopener">';
	echo '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
	echo ' Consultar por WhatsApp';
	echo '</a>';
}

// ── 4b. Botón flotante de WhatsApp en toda la tienda ───────────────
add_action( 'wp_footer', 'nya_whatsapp_float' );
function nya_whatsapp_float() {
	if ( ! is_woocommerce() && ! is_cart() && ! is_checkout() ) {
		return;
	}

	$number = get_option( 'nya_whatsapp_number', '5493329506445' );
	$url    = 'https://wa.me/' . $number;

	echo '<a href="' . esc_url( $url ) . '" class="nya-whatsapp-float" target="_blank" rel="noopener" aria-label="' . esc_attr__( 'Contactar por WhatsApp', 'nya-futbol-child' ) . '">';
	echo '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
	echo '<span>WhatsApp</span>';
	echo '</a>';
}


/**
 * ──────────────────────────────────────────────────────────────────────
 * 5. TAXONOMÍA PERSONALIZADA: Equipo
 * ──────────────────────────────────────────────────────────────────────
 */
add_action( 'init', 'nya_register_team_taxonomy' );
function nya_register_team_taxonomy() {
	register_taxonomy( 'equipo', 'product', array(
		'labels' => array(
			'name'              => __( 'Equipos', 'nya-futbol-child' ),
			'singular_name'     => __( 'Equipo', 'nya-futbol-child' ),
			'search_items'      => __( 'Buscar equipos', 'nya-futbol-child' ),
			'all_items'         => __( 'Todos los equipos', 'nya-futbol-child' ),
			'parent_item'       => __( 'Liga padre', 'nya-futbol-child' ),
			'parent_item_colon' => __( 'Liga padre:', 'nya-futbol-child' ),
			'edit_item'         => __( 'Editar equipo', 'nya-futbol-child' ),
			'update_item'       => __( 'Actualizar equipo', 'nya-futbol-child' ),
			'add_new_item'      => __( 'Agregar nuevo equipo', 'nya-futbol-child' ),
			'new_item_name'     => __( 'Nombre del nuevo equipo', 'nya-futbol-child' ),
			'menu_name'         => __( 'Equipos', 'nya-futbol-child' ),
		),
		'hierarchical'      => true,
		'show_ui'           => true,
		'show_in_menu'      => true,
		'show_admin_column' => true,
		'query_var'         => true,
		'rewrite'           => array( 'slug' => 'equipo' ),
		'show_in_rest'      => true,
	) );
}

// ── Campos personalizados para la taxonomía Equipo ─────────────────
add_action( 'equipo_add_form_fields', 'nya_team_add_fields' );
function nya_team_add_fields() {
	?>
	<div class="form-field">
		<label for="nya_team_color"><?php esc_html_e( 'Color del equipo', 'nya-futbol-child' ); ?></label>
		<input type="color" name="nya_team_color" id="nya_team_color" value="#DC2626">
		<p class="description"><?php esc_html_e( 'Color representativo del club.', 'nya-futbol-child' ); ?></p>
	</div>
	<div class="form-field">
		<label for="nya_team_logo"><?php esc_html_e( 'URL del logo', 'nya-futbol-child' ); ?></label>
		<input type="url" name="nya_team_logo" id="nya_team_logo" value="">
		<p class="description"><?php esc_html_e( 'URL de la imagen del escudo del club.', 'nya-futbol-child' ); ?></p>
	</div>
	<?php
}

add_action( 'equipo_edit_form_fields', 'nya_team_edit_fields', 10, 2 );
function nya_team_edit_fields( $term ) {
	$color = get_term_meta( $term->term_id, 'nya_team_color', true );
	$logo  = get_term_meta( $term->term_id, 'nya_team_logo', true );
	?>
	<tr class="form-field">
		<th><label for="nya_team_color"><?php esc_html_e( 'Color del equipo', 'nya-futbol-child' ); ?></label></th>
		<td>
			<input type="color" name="nya_team_color" id="nya_team_color" value="<?php echo esc_attr( $color ); ?>">
			<p class="description"><?php esc_html_e( 'Color representativo del club.', 'nya-futbol-child' ); ?></p>
		</td>
	</tr>
	<tr class="form-field">
		<th><label for="nya_team_logo"><?php esc_html_e( 'URL del logo', 'nya-futbol-child' ); ?></label></th>
		<td>
			<input type="url" name="nya_team_logo" id="nya_team_logo" value="<?php echo esc_url( $logo ); ?>">
			<p class="description"><?php esc_html_e( 'URL de la imagen del escudo del club.', 'nya-futbol-child' ); ?></p>
		</td>
	</tr>
	<?php
}

add_action( 'created_equipo', 'nya_save_team_fields' );
add_action( 'edited_equipo', 'nya_save_team_fields' );
function nya_save_team_fields( $term_id ) {
	if ( isset( $_POST['nya_team_color'] ) ) {
		update_term_meta( $term_id, 'nya_team_color', sanitize_hex_color( $_POST['nya_team_color'] ) );
	}
	if ( isset( $_POST['nya_team_logo'] ) ) {
		update_term_meta( $term_id, 'nya_team_logo', esc_url_raw( $_POST['nya_team_logo'] ) );
	}
}


/**
 * ──────────────────────────────────────────────────────────────────────
 * 6. AJUSTES DEL TEMA EN EL CUSTOMIZER
 * ──────────────────────────────────────────────────────────────────────
 */
add_action( 'customize_register', 'nya_customizer_settings' );
function nya_customizer_settings( $wp_customize ) {

	// Sección NYA Fútbol
	$wp_customize->add_section( 'nya_settings', array(
		'title'    => __( 'NYA Fútbol – Ajustes', 'nya-futbol-child' ),
		'priority' => 30,
	) );

	// Número de WhatsApp
	$wp_customize->add_setting( 'nya_whatsapp_number', array(
		'default'           => '5493329506445',
		'sanitize_callback' => 'sanitize_text_field',
	) );
	$wp_customize->add_control( 'nya_whatsapp_number', array(
		'label'       => __( 'Número de WhatsApp', 'nya-futbol-child' ),
		'description' => __( 'Número en formato internacional sin + ni espacios (ej: 5491123456789).', 'nya-futbol-child' ),
		'section'     => 'nya_settings',
		'type'        => 'text',
	) );

	// Instagram
	$wp_customize->add_setting( 'nya_instagram_url', array(
		'default'           => '',
		'sanitize_callback' => 'esc_url_raw',
	) );
	$wp_customize->add_control( 'nya_instagram_url', array(
		'label'   => __( 'URL de Instagram', 'nya-futbol-child' ),
		'section' => 'nya_settings',
		'type'    => 'url',
	) );

	// Facebook
	$wp_customize->add_setting( 'nya_facebook_url', array(
		'default'           => '',
		'sanitize_callback' => 'esc_url_raw',
	) );
	$wp_customize->add_control( 'nya_facebook_url', array(
		'label'   => __( 'URL de Facebook', 'nya-futbol-child' ),
		'section' => 'nya_settings',
		'type'    => 'url',
	) );
}

// Sincronizar el setting del Customizer con las opciones de WP
add_action( 'customize_save_after', 'nya_sync_customizer_to_options' );
function nya_sync_customizer_to_options() {
	update_option( 'nya_whatsapp_number', get_theme_mod( 'nya_whatsapp_number', '5493329506445' ) );
}


/**
 * ──────────────────────────────────────────────────────────────────────
 * 7. ESTILOS INLINE PARA BADGES Y COMPONENTES CUSTOM
 * ──────────────────────────────────────────────────────────────────────
 */
add_action( 'wp_head', 'nya_inline_badge_styles' );
function nya_inline_badge_styles() {
	?>
	<style>
		/* ── Badges en las cards ─────────────────────────── */
		.nya-badges {
			position: absolute;
			z-index: 1;
			top: 10px;
			left: 10px;
			right: 10px;
			display: flex;
			flex-wrap: wrap;
			gap: 4px;
			pointer-events: none;
		}
		.nya-badge {
			padding: 3px 6px 2px;
			background: var(--nya-surface);
			color: var(--nya-ink-2);
			font-family: var(--nya-f-mono);
			font-size: 10.5px;
			line-height: 1.3;
			letter-spacing: .03em;
			text-transform: uppercase;
		}
		.nya-badge--low { color: var(--nya-low); }

		/* ── Equipo y calidad en la card ─────────────────── */
		.nya-card-team {
			display: flex;
			align-items: center;
			gap: 7px;
			margin: 2px 0 0;
			font-size: 14px;
			color: var(--nya-muted);
		}
		.nya-team-dot {
			display: inline-block;
			flex: none;
			width: 8px;
			height: 8px;
			border-radius: 50% !important; /* excepción a esquinas rectas */
			box-shadow: inset 0 0 0 1px rgba(18,18,18,.14);
		}
		.nya-mark-img {
			display: inline-block;
			flex: none;
			width: 1.25em;
			height: 1.25em;
			object-fit: contain;
			vertical-align: -0.28em;
		}
		.nya-card-quality {
			margin: 0;
			font-family: var(--nya-f-mono);
			font-size: 11.5px;
			letter-spacing: .03em;
			text-transform: uppercase;
			color: var(--nya-ink-2);
		}

		/* ── Talles disponibles ──────────────────────────── */
		.nya-avail {
			display: flex;
			flex-wrap: wrap;
			gap: 4px 9px;
			margin-top: 6px;
			font-family: var(--nya-f-mono);
			font-size: 11.5px;
			color: var(--nya-ink-2);
		}
		.nya-avail i { font-style: normal; }
		.nya-avail i.off { color: var(--nya-faint); text-decoration: line-through; }
		.nya-avail i.low { color: var(--nya-low); }

		/* ── Botón WhatsApp en la ficha ──────────────────── */
		.nya-btn-whatsapp {
			width: 100%;
			background: transparent !important;
			color: var(--nya-ink) !important;
			border: 1px solid var(--nya-ink) !important;
			margin-top: 10px;
		}
		.nya-btn-whatsapp:hover {
			background: #25D366 !important;
			border-color: #25D366 !important;
			color: #fff !important;
		}
		.nya-btn-whatsapp svg {
			width: 16px;
			height: 16px;
			flex: none;
			fill: currentColor;
		}

		/* ── Contenedor de imagen con posición relative para badges ─ */
		.woocommerce ul.products li.product {
			position: relative;
		}
		.woocommerce ul.products li.product > a {
			position: relative;
			display: block;
		}
	</style>
	<?php
}


/**
 * ──────────────────────────────────────────────────────────────────────
 * 8. CHECKOUT POR WHATSAPP (reemplaza el checkout estándar)
 * ──────────────────────────────────────────────────────────────────────
 */

// Agregar botón de WhatsApp en el carrito
add_action( 'woocommerce_proceed_to_checkout', 'nya_whatsapp_checkout_button', 25 );
function nya_whatsapp_checkout_button() {
	?>
	<button type="button" id="nya-whatsapp-checkout" class="button nya-btn-whatsapp" style="width:100%; margin-top:10px;">
		<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
		<?php esc_html_e( 'Enviar pedido por WhatsApp', 'nya-futbol-child' ); ?>
	</button>
	<?php
}


/**
 * ──────────────────────────────────────────────────────────────────────
 * 9. PERSONALIZAR EL FOOTER
 * ──────────────────────────────────────────────────────────────────────
 */

// Reemplazar el texto del copyright de Storefront
add_filter( 'storefront_copyright_text', 'nya_custom_copyright' );
function nya_custom_copyright() {
	return '© ' . date( 'Y' ) . ' NYA Fútbol – Todos los derechos reservados';
}

// Agregar redes sociales al footer
add_action( 'storefront_footer', 'nya_footer_socials', 5 );
function nya_footer_socials() {
	$instagram = get_theme_mod( 'nya_instagram_url', '' );
	$facebook  = get_theme_mod( 'nya_facebook_url', '' );

	if ( ! $instagram && ! $facebook ) {
		return;
	}

	echo '<div class="nya-footer-socials">';
	echo '<p class="nya-label">' . esc_html__( 'Seguinos', 'nya-futbol-child' ) . '</p>';
	echo '<div class="nya-footer-links">';

	if ( $instagram ) {
		// Extraer handle del URL
		$handle = '@' . basename( rtrim( $instagram, '/' ) );
		echo '<a href="' . esc_url( $instagram ) . '" class="nya-footer-social" target="_blank" rel="noopener">';
		echo '<svg class="nya-app-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>';
		echo '<span class="nya-footer-social-name">' . esc_html( $handle ) . '</span>';
		echo '</a>';
	}

	if ( $facebook ) {
		$handle = basename( rtrim( $facebook, '/' ) );
		echo '<a href="' . esc_url( $facebook ) . '" class="nya-footer-social" target="_blank" rel="noopener">';
		echo '<svg class="nya-app-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>';
		echo '<span class="nya-footer-social-name">' . esc_html( $handle ) . '</span>';
		echo '</a>';
	}

	echo '</div>';
	echo '</div>';
}
