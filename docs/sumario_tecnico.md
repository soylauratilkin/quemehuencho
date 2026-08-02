📋 RESUMEN TÉCNICO - QUEMEHUENCHO
Fecha: Agosto 2026 (Actualizado)
Proyecto: E-commerce de churros con pedidos por mesa y delivery
Stack: Next.js 14+ (App Router) + TypeScript + Tailwind CSS + Zustand + Google Sheets + Google Apps Script
🎯 OBJETIVO DEL PROYECTO
Sistema de pedidos online para una churrería que permite:
Pedidos por mesa (vía QR con parámetro ?mesa=X)
Delivery (con cálculo de distancia, validación de zona y geolocalación automática)
Retiro en local
Panel de administración optimizado en tiempo real con notificaciones sonoras persistentes y Telegram.
🏗️ ARQUITECTURA
Frontend: Next.js 14+ (App Router)
UI: Tailwind CSS + Lucide React (iconos) + Animaciones CSS custom (globals.css)
Estado: Zustand (store.tsx) + useMemo para renderizado optimizado
Datos: Google Sheets como "base de datos"
Backend:
API Routes: Next.js (/api/order, /api/admin/pedidos, /api/distance)
Google Apps Script: Webhook robusto para guardar/leer pedidos y manejar lógica de teléfonos.
Telegram Bot API: Notificaciones al local.
🚀 FEATURES IMPLEMENTADAS (Actualizado)
1. CATÁLOGO DE PRODUCTOS (home-screen.tsx)
Categorías: Combos, Docenas, Unidades, "Para Tomar" (local).
Filtrado: Tabs por categoría.
Imágenes: Soporta URLs completas o rutas relativas.
Bloqueo "Para Tomar": Solo disponible si viene de QR de mesa (?mesa=X).
2. CARRITO INTELIGENTE (cart-screen.tsx)
Si es mesa: Oculta subtotal/envío, botón "Confirmar Pedido", salta checkout, no pide teléfono/dirección.
Si NO es mesa (Delivery/Retiro): Muestra subtotal/envío, botón "Continuar" → va a checkout-screen.
Manejo robusto de imágenes sin URL (fallback a placeholder).
3. CHECKOUT MEJORADO (checkout-screen.tsx)
Geolocalización Automática: Botón "Usar mi ubicación" que usa la API del navegador + Nominatim (OpenStreetMap) para rellenar la dirección. Resetea el cálculo de envío si la dirección cambia.
Validación de Teléfono Blindada: El frontend solo acepta 10-11 dígitos locales. Si el usuario pega un número con "54" o "549", el frontend lo limpia automáticamente para evitar falsos positivos en la validación. El backend (Apps Script) se encarga de agregar el "549" final para WhatsApp.
UX Guiada Secuencial: Animaciones CSS (input-glow, button-glow) que resaltan visualmente el siguiente paso que el usuario debe completar (Dirección → Calcular Envío → Teléfono → Confirmar).
Botón Confirmar: Efecto de "latido" (pulse-glow) cuando todos los campos son válidos, invitando a la acción.
4. ENVÍO DE PEDIDOS (/api/order/route.ts + Google Apps Script)
Proxy Robusto: La API Route lee la respuesta de Apps Script como texto primero (response.text()) y luego intenta parsear a JSON. Esto evita errores falsos en el frontend cuando GAS devuelve respuestas no estrictamente JSON pero el pedido sí se guardó.
Payload: Envía items, total, ubicación, origen y datos de contacto limpios.
5. PANTALLA DE ÉXITO (success-screen.tsx)
Mesa: Mensaje verde, botón "Hacer otro pedido", sin botón de WhatsApp.
Delivery/Retiro: Mensaje rojo de "pendiente de confirmación", botón naranja para contactar por WhatsApp con el ID del pedido.
6. PANEL DE ADMINISTRACIÓN (app/admin/pedidos/page.tsx)
Optimización de Rendimiento: Uso intensivo de useMemo para pedidosHoy, pedidosFiltrados, contadores y acumuladoMostrar, eliminando el "lag" o congelamiento al interactuar con la UI.
Sonido Persistente: Alerta sonora en bucle (loop) cuando llega un pedido nuevo. Solo se detiene cuando el admin hace clic en las pestañas de filtro ("Mesas", "Envíos", etc.). Usa useRef para la instancia de Audio y requiere una primera interacción del usuario para desbloquearse (política de navegadores).
Flujo de Carga Manual: Al agregar un pedido desde el admin, el formulario se limpia y permanece en pantalla (sin redirecciones) para permitir cargas consecutivas rápidas.
UI Mobile: Botones de filtro compactos y optimizados para evitar desbordes en pantallas pequeñas.
Acciones rápidas: Marcar Entregado/Pagado, Confirmar al cliente, Reenviar al delivery, Listo para Retiro, Editar pedido, Borrar pedido.
7. GOOGLE APPS SCRIPT (Code.gs)
limpiarTelefono(tel): Lógica unificada e inteligente en el backend. Recibe el número local y le agrega automáticamente el prefijo 549 para formato WhatsApp Argentina.
doPost(e): Guarda pedido, calcula detalle desde items, determina ubicación y llama a enviarTelegram().
enviarTelegram(): Construye mensaje, genera links de WhatsApp acortados y envía con botones de acción rápida.
getPedidosActivos(): Lee hoja "Pedidos" y devuelve JSON. (Opcional: Implementar CacheService aquí para reducir la carga en Sheets).
🎨 DISEÑO Y COLORES
🟠 Naranja: #ff751f (botones, acentos, bordes, animaciones de atención)
⚫ Negro fondo: #0a0a0a, #111, #1a1a1a
⚪ Blanco texto: #fff, text-white
🔴 Rojo error: text-red-400, bg-red-900/20 (usado en teléfono inválido)
🟢 Verde éxito: text-green-400, bg-green-900/20
🟣 Violeta mesas: #a855f7 (pedidos de mesa en admin)
✨ Animaciones Custom: .btn-ready, .input-needs-attention, .button-needs-attention (definidas en globals.css).
🔑 ENDPOINTS IMPORTANTES
POST /api/order - Crear pedido (Proxy robusto a GAS)
GET /api/admin/pedidos - Leer pedidos activos (con caché de Next.js)
GET /api/distance?destino=... - Calcular distancia y validar zona
GET https://nominatim.openstreetmap.org/reverse - Reverse geocoding para geolocalización del cliente.
POST https://script.google.com/.../exec - Google Apps Script webhook.
🐛 BUGS RESUELTOS (HISTÓRICO + RECIENTES)
Error #130 (React): Productos de "Para Tomar" sin imagen → undefined. (Solución: Forzar image: "" y placeholder).
Teléfonos duplicados (54549...): (Solución: Unificar limpieza en Apps Script).
Detalle vacío en Sheets: (Solución: Calcular detalle automáticamente desde items en Apps Script).
Ubicación = "Web" en mesas: (Solución: Condición else if en Apps Script).
🆕 Sonido de notificación no persistente o bloqueado: (Solución: Uso de useRef, audio.loop = true y desbloqueo por primera interacción del usuario).
🆕 Falso positivo en validación de teléfono: Al borrar un dígito, el prefijo "54" agregado por el frontend hacía que la longitud pareciera válida. (Solución: Frontend ahora solo acepta y valida dígitos locales (10-11). Apps Script agrega el "549").
🆕 Error "Hubo un error al enviar" aunque el pedido se guardaba: (Solución: /api/order ahora lee la respuesta de GAS como texto primero para evitar fallos de parseo de JSON).
🆕 Lentitud/Lag en el Panel de Admin: (Solución: Implementación de useMemo en todos los cálculos de filtros y totales).
📱 FLUJO DE PEDIDO POR MESA (COMPLETO)
Cliente escanea QR (?mesa=4).
Agrega productos "Para Tomar" o generales al carrito.
Va al carrito → Botón "Confirmar Pedido" (sin pedir dirección/teléfono).
Se envía pedido → Pantalla de éxito verde ("Un mozo se acercará").
Admin recibe notificación sonora en bucle.
Admin toca pestaña "🟣 Mesas" → El sonido se detiene.
Admin prepara y marca como "Entregado/Pagado".
🔮 MEJORAS FUTURAS SUGERIDAS (Actualizado)
Geolocalización automática ✅ IMPLEMENTADO
PWA: Agregar manifest.json + service worker para instalar como app.
WebSockets: Reemplazar polling del admin (10s) por conexión en tiempo real (Socket.io o Pusher) para menor latencia.
Historial de pedidos: Que el cliente pueda ver sus pedidos anteriores (localStorage o Firebase).
Sistema de fidelidad: Puntos por compra (ya hay loyaltyPoints en store.tsx pero no implementado).
Múltiples idiomas: i18n (español/inglés/portugués para turistas).
Autenticación: Agregar NextAuth o middleware de auth al panel de administración (actualmente es público).
✅ CHECKLIST DE PRODUCCIÓN
Pedidos por mesa funcionando
Detección de QR (?mesa=X)
Imágenes cargando correctamente
Teléfonos limpios (sin duplicar 54, validación estricta)
Admin panel con estilo violeta para mesas y optimizado (sin lag)
Sonido de notificación en bucle hasta atender
Success-screen simplificado (sin WhatsApp para mesas)
Google Sheets guardando "Detalle" y "Ubicacion" correctos
Botón "Usar mi ubicación" en checkout funcionando
Flujo guiado con animaciones de atención implementado
Agregar autenticación en admin (pendiente)
Configurar dominio personalizado en Vercel (pendiente)