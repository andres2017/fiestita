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
- [x] Pantalla de éxito con link público + link secreto de edición (copiar)
- [x] Invitación pública temática: countdown, datos, calendario Google, Maps/Waze, RSVP, WhatsApp
- [x] Edición con token, validación 403
- [x] Reenvío de RSVP a Google Apps Script (opcional, campo avanzado)
- [x] Testeado E2E: backend 11/11, frontend 100% flujos críticos (iteration_1)
- [x] Subir 1 video a la invitación (julio 2026): `POST /api/uploads/video` guarda el archivo en disco (`backend/uploads/videos/`, servido vía `/uploads`), valida tipo MIME (mp4/webm/mov/ogg) y tamaño (máx. 50MB); `video_url` en la invitación solo acepta rutas propias (regex), no URLs externas, para evitar SSRF/XSS. Sección de video en Builder (subir/quitar/preview) e InvitationView (reproductor).

## Backlog priorizado
- P1: Panel de confirmaciones dentro del link de edición (ya se guardan en Mongo)
- P1: Subir foto del peque a la invitación (object storage)
- P2: Música/animación de entrada por temática, confetti al confirmar
- P2: Compartir directo por WhatsApp desde pantalla de éxito
- P2: Más temáticas (sirenas, fútbol, safari)

## Credenciales
Sin login. No aplica.
