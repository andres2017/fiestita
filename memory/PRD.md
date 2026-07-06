# PRD — Fiestita 🎈 (Invitaciones de cumpleaños infantiles)

## Problema original
"créame una pagina para niños para poder crear invitaciones para cumpleaños de niños y que se puedan editar de acuerdo a la temática"

Usuario aportó ejemplo: invitación HTML estilo videojuego retro (cuenta regresiva, RSVP, Maps/Waze, WhatsApp) + Apps Script para guardar confirmaciones en Google Sheets.

## Decisiones del usuario
- 6 temáticas: Videojuegos, Princesas, Superhéroes, Dinosaurios, Espacio, Unicornios
- Invitación completa: cuenta regresiva, datos, cómo llegar (Maps/Waze), RSVP, WhatsApp
- Link público único por invitación
- RSVP → Google Sheets (Apps Script del usuario, opcional) + respaldo en Mongo
- Sin login: edición con link secreto (edit_token)

## Arquitectura
- Backend FastAPI + MongoDB (`server.py`): POST/GET/PUT `/api/invitations`, GET `/edit?token=`, POST `/rsvp` (guarda en Mongo y reenvía a Apps Script vía httpx si hay script_url)
- Frontend React: `/` landing, `/crear` builder con vista previa en vivo, `/editar/:id/:token`, `/i/:id` invitación pública
- Temas en `src/themes.js` (colores, fuentes Google Fonts, textos temáticos por tema); render único `InvitationView.jsx` con CSS variables

## Implementado (junio 2026)
- [x] Landing en español con 6 tarjetas de temática
- [x] Builder con vista previa en vivo y selector de tema
- [x] Pantalla de éxito con link secreto de edición (copiar)
- [x] Invitación pública temática: countdown, datos, calendario Google, Maps/Waze, RSVP, WhatsApp
- [x] Edición con token, validación 403
- [x] Reenvío de RSVP a Google Apps Script (opcional, campo avanzado)
- [x] Testeado E2E: backend 11/11, frontend 100% flujos críticos (iteration_1)
- [x] (Jul 2026) Badge "Made with Emergent" eliminado; título "Fiestita 🎈"
- [x] (Jul 2026) Fotos (hasta 5, 10MB) + 1 video (50MB) por invitación vía Emergent Object Storage; galería temática en la invitación
- [x] (Jul 2026) Paywall Wompi PRODUCCIÓN: $55.000 COP para publicar. Link público devuelve 402 hasta pagar. Checkout web de Wompi con firma de integridad, verificación server-side de transacción y webhook firmado (/api/wompi/webhook). Sin registro.
- [x] (Jul 2026) Placeholders de ejemplo "Gabriel" reemplazados por genéricos
- [x] Testeado E2E iteration_2: media upload, paywall, webhook simulado — 100%

## Config clave
- Llaves Wompi (producción) y precio en /app/backend/.env (PUBLISH_PRICE_CENTS=5500000)
- Webhook Wompi a configurar en panel Wompi: {dominio}/api/wompi/webhook (URL de eventos)

## Backlog priorizado
- P1: Configurar la URL de eventos (webhook) en el panel de Wompi del cliente
- P1: Panel de confirmaciones dentro del link de edición (ya se guardan en Mongo)
- P2: Endurecimiento: ventana anti-replay en webhook, media bloqueada hasta pago, refresco de storage_key
- P2: Música/animación de entrada por temática, confetti al confirmar
- P2: Más temáticas (sirenas, fútbol, safari)

## Credenciales
Sin login. No aplica.
