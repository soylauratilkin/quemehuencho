📋 RESUMEN TÉCNICO - QUEMEHUENCHO
Fecha: Agosto 2026
Proyecto: E-commerce de churros con pedidos por mesa y delivery
Stack: Next.js + TypeScript + Tailwind CSS + Google Sheets + Google Apps Script
OBJETIVO DEL PROYECTO
Sistema de pedidos online para una churrería que permite:
Pedidos por mesa (vía QR con parámetro ?mesa=X)
Delivery (con cálculo de distancia y validación de zona)
Retiro en local
Panel de administración en tiempo real con notificaciones Telegram
🏗️ ARQUITECTURA
Frontend: Next.js 14+ (App Router)
UI: Tailwind CSS + Lucide React (iconos)
Estado: Zustand (store.tsx)
Datos: Google Sheets como "base de datos"
Backend:
API Routes: Next.js (/api/order, /api/admin/pedidos)
Google Apps Script: Webhook para guardar/leer pedidos desde Sheets
Telegram Bot API: Notificaciones al local
📁 ESTRUCTURA DE ARCHIVOS CLAVE
123456789101112131415161718192021222324
🚀 FEATURES IMPLEMENTADAS
1. CATÁLOGO DE PRODUCTOS (home-screen.tsx)
Categorías: Combos, Docenas, Unidades, "Para Tomar" (local)
Filtrado: Tabs por categoría
Imágenes: Soporta URLs completas (http...) o rutas relativas (/images/...)
Bloqueo "Para Tomar": Solo disponible si viene de QR de mesa (?mesa=X)
Lógica clave:
typescript
123456789
2. CARRITO INTELIGENTE (cart-screen.tsx)
Detección de Mesa:
typescript
12
Comportamiento condicional:
Si es mesa:
✅ Oculta cuadro de subtotal/envío (naranja)
✅ Botón dice "Confirmar Pedido"
✅ Salta checkout → va directo al modal/envío
✅ No pide teléfono/dirección
Si NO es mesa (Delivery/Retiro):
✅ Muestra subtotal/envío
✅ Botón dice "Continuar" → va a checkout-screen
Manejo de imágenes sin URL:
typescript
123456
3. CHECKOUT (checkout-screen.tsx)
Validación de distancia: Llama a /api/distance (Google Maps API)
Cálculo de envío:
0-3 km: $2000
3-6 km: $3000
6-10 km: $4000
10 km: Fuera de zona (error)
Formulario: Teléfono, dirección, notas, método de pago
4. ENVÍO DE PEDIDOS (/api/order/route.ts + Google Apps Script)
Flujo completo:
123456789
Payload enviado:
json
123456789101112
Columnas en Google Sheets:
123
5. PANTALLA DE ÉXITO (success-screen.tsx)
Comportamiento condicional:
Si es mesa (orderDetails.address.includes("Mesa")):
✅ Mensaje verde: "¡Todo en orden! Un mozo se acercará..."
✅ Botón: "Hacer otro pedido" (limpia localStorage y recarga)
❌ NO muestra botón de WhatsApp
Si es delivery/retiro:
✅ Mensaje rojo: "Tu pedido NO es efectivo hasta recibir confirmación"
✅ Botón naranja: "Contactar a Quemehuencho" (WhatsApp con ID del pedido)
6. PANEL DE ADMINISTRACIÓN (app/admin/pedidos/page.tsx)
Features:
Polling: Refresca cada 10 segundos (useEffect + setInterval)
Sonido: Alerta sonora cuando llega pedido nuevo (solo si origen === "web")
Clasificación:
🟠 Para preparar: Pedidos pendientes
Envíos: Delivery activos
Retiro: Pedidos para retirar
Estilos condicionales por origen:
typescript
12345
Acciones rápidas:
✅ Marcar como Entregado/Pagado
✅ Confirmar al cliente (WhatsApp)
✅ Reenviar al delivery (WhatsApp con mapa)
✅ Marcar como "Listo para Retiro"
✅ Editar pedido (cambiar items, ubicación)
✅ Borrar pedido
7. GOOGLE APPS SCRIPT (Code.gs)
Funciones principales:
limpiarTelefono(tel) - UNIFICADA
javascript
12345678910111213141516
doPost(e) - Guardar pedido
Detecta tipo: Delivery/Retiro/Mesa
Calcula detalle automáticamente desde items
Usa ubicacion: "Envio" / "Retiro" / "Mesa X" / "Web"
Llama a enviarTelegram()
enviarTelegram(data, mapLink)
Construye mensaje con items, total, dirección
Genera links de WhatsApp acortados (TinyURL/is.gd)
Envía a Telegram con botones de acción rápida
handleAdminAction(data) - Marcar entregado/pagado
Usa limpiarTelefono() para generar link de WhatsApp
Importante: NO agrega "54" manualmente (ya lo hace limpiarTelefono)
getPedidosActivos()
Lee hoja "Pedidos"
Devuelve JSON con todos los pedidos activos
Usado por el admin panel para polling
🔧 CONFIGURACIÓN
Variables de entorno (.env.local):
bash
1234567891011
Google Apps Script - Config (hoja "Config"):
1234
🎨 DISEÑO Y COLORES
Paleta principal:
🟠 Naranja: #ff751f (botones, acentos, bordes)
⚫ Negro fondo: #0a0a0a, #111, #1a1a1a
⚪ Blanco texto: #fff, text-white
🔴 Rojo error: text-red-400, bg-red-900/20
🟢 Verde éxito: text-green-400, bg-green-900/20
🟣 Violeta mesas: #a855f7 (pedidos de mesa en admin)
Tipografía:
font-heading: Títulos (probablemente una fuente custom)
font-bold, font-extrabold: Énfasis
tabular-nums: Números monoespaciados (precios)
🔑 ENDPOINTS IMPORTANTES
Frontend → Backend:
POST /api/order - Crear pedido
GET /api/admin/pedidos - Leer pedidos activos
GET /api/distance?destino=... - Calcular distancia y validar zona
Backend → Externo:
POST https://script.google.com/.../exec - Google Apps Script webhook
GET https://nominatim.openstreetmap.org/reverse - Reverse geocoding (opcional)
POST https://api.telegram.org/bot{TOKEN}/sendMessage - Notificaciones
🐛 BUGS RESUELTOS (HISTÓRICO)
Error #130 (React): Productos de "Para Tomar" sin imagen → undefined.
Solución: Forzar image: "" en menu-data.ts y manejar placeholder en UI.
Teléfonos duplicados (54549...):
Solución: Unificar TODA la limpieza en limpiarTelefono() y eliminar .replace() manuales.
Detalle vacío en Sheets:
Solución: Calcular detalle automáticamente desde items en Apps Script (no confiar en data.detalle).
Ubicación = "Web" en mesas:
Solución: Agregar condición else if (data.type === "Mesa" || data.origen === "mesa") en Apps Script.
📱 FLUJO DE PEDIDO POR MESA (COMPLETO)
1234567891011121314151617181920212223
MEJORAS FUTURAS SUGERIDAS
Geolocalización automática: Botón "Usar mi ubicación actual" en checkout (API Geolocation + Nominatim).
PWA: Agregar manifest.json + service worker para instalar como app.
WebSockets: Reemplazar polling del admin por conexión en tiempo real (Socket.io o Pusher).
Historial de pedidos: Que el cliente pueda ver sus pedidos anteriores (localStorage o Firebase).
Sistema de fidelidad: Puntos por compra (ya hay loyaltyPoints en store.tsx pero no implementado).
Múltiples idiomas: i18n (español/inglés/portugués para turistas).
Impresión de comprobante: Generar PDF o enviar por WhatsApp automáticamente.
📚 COMANDOS ÚTILES
bash
1234567891011121314
SEGURIDAD
API Route como proxy: El frontend NUNCA llama directo a Google Apps Script (evita CORS y expone la URL).
Validación en backend: Apps Script valida que data.items sea array, total sea número, etc.
Limpieza de inputs: limpiarTelefono() sanitiza antes de guardar.
Sin autenticación: Actualmente el admin panel es público (agregar NextAuth o middleware de auth).
📞 CONTACTOS Y RECURSOS
Dueño del proyecto: María Laura Tilkin
Teléfono delivery: 5492804007296 (WhatsApp Business)
Dirección local: Roque Sáenz Peña 212, Puerto Madryn, Argentina
Alias MP: quemehuencho.mp
✅ CHECKLIST DE PRODUCCIÓN
Pedidos por mesa funcionando
Detección de QR (?mesa=X)
Imágenes cargando correctamente
Teléfonos limpios (sin duplicar 54)
Admin panel con estilo violeta para mesas
Success-screen simplificado (sin WhatsApp para mesas)
Google Sheets guardando "Detalle" y "Ubicacion" correctos
Agregar botón "Usar mi ubicación" en checkout (pendiente)
Agregar autenticación en admin (pendiente)
Configurar dominio personalizado en Vercel