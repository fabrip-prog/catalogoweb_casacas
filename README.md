# ⚽ CasacasStore - Catálogo y Tienda Online

Este proyecto es una completa aplicación web de e-commerce y catálogo orientada a la venta de indumentaria deportiva (camisetas, shorts, etc.). Está construida de manera moderna, responsiva, sin dependencias pesadas y utilizando LocalStorage para la persistencia de los datos.

## 🌟 Funcionalidades

### 🛍️ Vista de Cliente (Tienda)
- **Navegación Intuitiva**: Menú lateral (en PC) y barra horizontal (en móviles) organizando los productos por Ligas.
- **Filtros Adicionales**: Al seleccionar una Liga, se despliegan "pills" para filtrar rápidamente por Equipos de esa liga.
- **Secciones Destacadas (Home)**: Banner hero, Carrusel de Productos Destacados, Ofertas (con cálculo de descuento visual) y Nuevos Ingresos.
- **Visualización de Producto Avanzada**:
  - Grid de productos adaptable (2-4 columnas).
  - Modal de detalle con galería de imágenes intercambiables.
  - Efecto "Lupa / Zoom" en la foto de producto.
  - Selección de Talles interactiva que bloquea las opciones sin stock.
  - Selector de cantidades de acuerdo al stock real disponible.
- **Carrito de Compras Mejorado**:
  - Sidebar deslizable para armar el pedido acumulativo.
  - **Envío a coordinar**: El costo de envío no se calcula en la tienda; se acuerda con el vendedor por WhatsApp al enviar el pedido.
- **Integración con WhatsApp**:
  - Envío individual: Consultas rápidas por un producto y un talle específicos (desde la Card o el Modal).
  - Check-out del carrito: Genera un resumen completo del pedido, incluyendo total sin envío, talles y unidades, con el envío marcado como "a coordinar", enviándolo directo al número configurado del administrador.

### ⚙️ Panel de Administración
- Acceso oculto mediante un pequeño enlace **⚙ Panel** ubicado en el pie de página (footer) de la tienda.
- **Autenticación (Login)** simple con `sessionStorage`.
- **Dashboard Estadístico**: Contadores en tiempo real de Ligas, Equipos, Productos, Stock y alertas de inventario (productos agotados o próximos a agotarse).
- **CRUD Completo de Entidades**:
  - **Productos**: Crear, editar y borrar. Manejo de precio actual y original (para mostrar ofertas), flags de Marketing (Destacado, Nuevo) y matriz de Stock por talle (S, M, L, XL, XXL).
  - **Ligas**: Gestión y ordenamiento. (Nota: su borrado afecta a equipos y productos en cascada).
  - **Equipos**: Gestión e identificación visual de color. (Nota: su borrado afecta a productos en cascada).
- **Botón de Reset**: Restaura la base de datos a sus valores iniciales de prueba (con más de 25 productos pre-cargados).

## 🛠️ Tecnologías y Estructura
- **Estructura limpia**: `HTML5`, `CSS3` puro y `JavaScript (Vanilla)`. No requiere compilación (Webpack, Vite, etc.).
- **Estilos**: Tailwind CSS implementado por CDN para prototipado ultrarrápido y custom CSS para animaciones complejas, scrollbars y el efecto Zoom (Lupa).
- **Base de Datos Local**: Todo se guarda de forma estructurada en `LocalStorage`, incluyendo las configuraciones y los arrays de entidades (`store` / `data.js`).

## 🚀 Instalación y Uso

1. **Clonar/Descargar** el repositorio.
2. Abrir `index.html` en el navegador (se recomienda usar *Live Server* o un servidor HTTP local para evitar bloqueos CORS con el efecto Zoom, aunque funciona localmente).
3. **Credenciales del Panel Admin** (por defecto):
   - Usuario: `admin`
   - Contraseña: `admin123`
4. **Configuración Inicial**: Para cambiar el número de WhatsApp, edite las primeras líneas del archivo `js/data.js` (objeto `CONFIG`).

---
_Desarrollado para brindar una base robusta, moderna y funcional de tienda online adaptable a cualquier negocio rápido por WhatsApp._
# catalogoweb_casacas
