# ⚽ NYA Fútbol – Child Theme para WooCommerce

Tema hijo de **Storefront** que replica la estética de la tienda estática NYA Fútbol:
fondo gris cálido de estudio, fotos sobre placas, tipografía Instrument Sans + DM Mono,
filetes de 1px, esquinas rectas e integración completa con WhatsApp.

## 📋 Requisitos

- **WordPress** 6.0+
- **WooCommerce** 8.0+
- **Tema padre Storefront** instalado y activo (o al menos instalado)

## 🚀 Instalación

1. **Instalar Storefront** (si no lo tenés):
   - Ir a `Apariencia → Temas → Añadir nuevo`
   - Buscar "Storefront" e instalarlo (no hace falta activarlo)

2. **Subir el tema hijo**:
   - Comprimir la carpeta `nya-futbol-child/` como `.zip`
   - Ir a `Apariencia → Temas → Añadir nuevo → Subir tema`
   - Seleccionar el `.zip` e instalar

3. **Activar** el tema "NYA Fútbol – Child Theme"

4. **Configurar WooCommerce**:
   - Ir a `WooCommerce → Ajustes → General`
   - Moneda: **Peso argentino ($)**
   - Formato de precio: **$XX.XXX** (separador de miles: punto)

## ⚙️ Configuración del Tema

### Personalizador (Apariencia → Personalizar)

En la sección **"NYA Fútbol – Ajustes"** podés configurar:

| Opción | Descripción |
|--------|-------------|
| **Número de WhatsApp** | Número en formato internacional sin `+` (ej: `5493329506445`) |
| **URL de Instagram** | URL completa del perfil de Instagram |
| **URL de Facebook** | URL completa de la página de Facebook |

### Taxonomía "Equipo"

El tema registra automáticamente una taxonomía personalizada **"Equipo"** para los productos.
En `Productos → Equipos` podés:

- Crear equipos con **nombre**, **color** (selector de color) y **logo** (URL de imagen)
- Asignar equipos a los productos

### Categorías como Ligas

Usá las **Categorías de producto** estándar de WooCommerce como las "Ligas":
- Liga Argentina
- Premier League
- La Liga
- Serie A
- etc.

### Atributos de Producto

1. **Talle** (`pa_talle`): Crear atributo global con términos: S, M, L, XL, XXL
2. **Calidad** (`pa_calidad`): Crear atributo global con términos: W 15, W 18, W 26, W 30, Premium, Set deportivo

Para cada producto:
- Tipo: **Producto Variable**
- Atributos: Talle + Calidad
- Variaciones: Una por cada talle, con stock individual

## 📁 Estructura del Tema

```
nya-futbol-child/
├── style.css                          ← Declaración + todos los estilos custom
├── functions.php                      ← Lógica del tema (WC, WhatsApp, taxonomías)
├── README.md                          ← Este archivo
├── assets/
│   ├── css/                           ← (reservado para CSS adicional)
│   ├── js/
│   │   └── nya-scripts.js             ← JS: checkout WA, header inteligente
│   └── img/
│       ├── logo-nya.png               ← Logo completo
│       ├── logo-nya-mark.png          ← Isotipo
│       ├── favicon-32.png             ← Favicon
│       └── apple-touch-icon.png       ← Touch icon
└── woocommerce/                       ← Plantillas WC sobrescritas
    ├── content-product.php            ← Card de producto (grid/loop)
    └── single-product/
        └── product-image.php          ← Galería con zoom de lupa
```

## 🎨 Sistema de Diseño

### Paleta de Colores

| Variable | Color | Uso |
|----------|-------|-----|
| `--nya-bg` | `#F4F4F2` | Fondo general |
| `--nya-surface` | `#FAFAF8` | Paneles, carrito, formularios |
| `--nya-tile` | `#E7E7E3` | Placa detrás de fotos |
| `--nya-ink` | `#121212` | Texto principal, botones |
| `--nya-ink-2` | `#3A3A37` | Texto secundario |
| `--nya-muted` | `#6B6B66` | Subtítulos, labels |
| `--nya-low` | `#9B3D2F` | Descuentos, stock bajo, errores |

### Tipografía

- **Sans:** Instrument Sans (títulos, cuerpo)
- **Mono:** DM Mono (labels, precios, badges, contadores)

### Principios

- ✅ Esquinas rectas en todo (border-radius: 0)
- ✅ Bordes de 1px sutiles
- ✅ Fotos sobre placa gris con sombra drop-shadow
- ✅ Animaciones escalonadas (stagger fade-in)

## 🟢 Funcionalidades Incluidas

- [x] Badge de descuento con porcentaje (`-20% OFF`)
- [x] Badges de "Destacado", "Nuevo", "¡Últimas!", "Agotado"
- [x] Equipo con dot de color o logo en las cards
- [x] Calidad de la camiseta visible en las cards
- [x] Talles disponibles inline con tachado si sin stock
- [x] Botón WhatsApp en la card y en la ficha de producto
- [x] Botón flotante de WhatsApp en toda la tienda
- [x] Checkout por WhatsApp con comprobante estilo factura
- [x] Galería de producto con lupa de zoom 2.5x
- [x] Header inteligente (ocultar al bajar, mostrar al subir)
- [x] Animación de pulso en el badge del carrito
- [x] Footer con redes sociales configurables
- [x] Ajustes en el Personalizador de WordPress

## 📝 Licencia

GNU General Public License v2 or later
