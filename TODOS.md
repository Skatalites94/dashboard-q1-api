# TODOS — Vision 2026 Dashboard

Generado por CEO Review (HOLD SCOPE) — 2026-04-30
Branch: main · Mode: HOLD SCOPE

---

## P1 — antes de sumar usuarios al equipo

### T1. RBAC mínimo (roles viewer/editor/admin)
**Por qué:** Hoy con Basic Auth, cualquiera con el password puede borrar la BD. Para operadora, contadora, asesores, los roles deben restringir mutaciones de la sección que no es suya.
**Cómo:** Agregar tabla `users (id, email, role, password_hash)` + endpoint `/api/auth/login` que devuelve JWT. Middleware verifica `role` contra el endpoint accedido.
**Esfuerzo:** L (humano: ~1 día / CC: ~1 hr)
**Bloqueado por:** A1 (auth Basic) ✓ ya hecho

### T2. Tests backend mínimos para canvas/flows
**Por qué:** Sin un test, el próximo bug como TP_W-undefined puede tardar otra sesión completa en debuggearse. 6 tests cubren 80% del riesgo backend nuevo.
**Cómo:** Crear `tests/test_comercial_canvas.py` con pytest + fixtures de SQLite in-memory.
- `test_create_flow_dedup` (POST mismo from→to dos veces → mismo id)
- `test_create_flow_self_loop_rejected` (from==to → 422)
- `test_delete_touchpoint_cleans_layout` (delete tp → layout row borrado)
- `test_reorder_validates_phase` (phase_id="ghost" → 404)
- `test_reorder_validates_ids` (id no existente → 404)
- `test_bulk_layout_upsert_idempotent` (mismo POST 2x → state idéntico)

**Esfuerzo:** M (humano: ~3 hrs / CC: ~30 min)

### T3. Audit log completo (multi-user accountability)
**Por qué:** Hoy `comercial_activity_log` solo registra fricciones. Si alguien borra 50 flows, no hay rastro. Multi-user sin audit = imposible debuggear "quién hizo qué".
**Cómo:** Extender `comercial_activity_log` con entries para canvas mutations (flow create/delete, layout bulk, phase rename, etc.). Añadir middleware que registra `user_id` (de JWT) + entity + action.
**Esfuerzo:** M (humano: ~4 hrs / CC: ~1 hr)
**Bloqueado por:** T1 (necesita user_id)

### T4. Logging estructurado + request_id
**Por qué:** Cero logs hoy. Si un usuario reporta "no me carga", no hay forma de saber si fue 500, timeout, o corrupción. Logging es ojos en producción.
**Cómo:** Middleware FastAPI con `request_id`, `duration_ms`, `status`, `user`. Salida JSON a stdout (Railway captura). Frontend sentry-lite con `console.error` capturados a `/api/log-client-error`.
**Esfuerzo:** S (humano: ~2 hrs / CC: ~20 min)

---

## P2 — siguiente sprint

### T5. Multi-tab concurrency: version stamps + 412 Precondition Failed
**Por qué:** Si dos pestañas editan el mismo nodo, last-write-wins silencioso. Un equipo mediano lo va a manifestar pronto.
**Cómo:** Añadir `version` (integer) en `comercial_canvas_layout`. Cliente envía version en bulk save. Si server ve mismatch → 412. Cliente recarga + reintenta.
**Esfuerzo:** M (humano: ~3 hrs / CC: ~30 min)

### T6. Smoke test script post-deploy
**Por qué:** Después de `railway up`, no sabes si los endpoints clave responden hasta que un usuario te avise.
**Cómo:** `scripts/smoke_test.sh <url> <password>` que cura `/health`, `/api/comercial/bootstrap`, `/api/comercial/touchpoint-flows/`, `/api/gastos/bootstrap`.
**Esfuerzo:** S (humano: ~30 min / CC: ~10 min)

### T7. Bootstrap con retry + UX de "no se pudo cargar"
**Por qué:** Si la primera carga del módulo comercial falla, el usuario ve canvas vacío sin pista de qué hacer. (Section 4 D1)
**Cómo:** Wrapper en `loadBootstrap` con 1 retry + fallback UI con botón "Reintentar".
**Esfuerzo:** S (humano: ~1 hr / CC: ~15 min)

### T8. Edge widget refresh tras 404
**Por qué:** Si otro user borró el flow, tu UI sigue mostrándolo. (Section 4 D2)
**Cómo:** En `_bindEdgeWidgetEvents` catch DELETE 404, refrescar bootstrap automáticamente.
**Esfuerzo:** S (humano: ~30 min / CC: ~10 min)

### T9. Input length validation en schemas
**Por qué:** Hoy `label`, `name`, `text` no tienen `max_length`. Un user puede meter strings de 1MB y llenar BD. (Section 3 S1)
**Cómo:** Añadir `Field(max_length=200)` en Pydantic schemas relevantes.
**Esfuerzo:** S (humano: ~30 min / CC: ~5 min)

---

## P3 — cuando duela

### T10. Refactor `static/comercial.js` (~7000 LOC en un archivo)
**Por qué:** Crecimiento sostenible. Hoy es manejable, en 6 meses con un colaborador es deuda dura. (Section 10)
**Cómo:** Extraer canvas (~3000 LOC) a `static/comercial-canvas.js` con interfaz pública `init(state, callbacks)`. Mantiene IIFE por compatibilidad.
**Esfuerzo:** L (humano: ~1 día / CC: ~2 hrs)

### T11. Métricas Prometheus + dashboard
**Por qué:** Sin métricas no se sabe qué endpoint es lento, ni cuántas requests hay. (Section 8 O2)
**Cómo:** Añadir `prometheus-fastapi-instrumentator`, exponer `/metrics`, conectar a Grafana Cloud free tier.
**Esfuerzo:** M (humano: ~3 hrs / CC: ~1 hr)

### T12. Frontend Sentry para errores de JS en producción
**Por qué:** Errores del navegador del usuario hoy mueren en su consola. (Section 8 O5)
**Cómo:** Sentry SDK CDN + DSN en variable env. Proyecto free tier.
**Esfuerzo:** S (humano: ~1 hr / CC: ~15 min)

### T13. Rate limiting en endpoints bulk
**Por qué:** `canvas-layout/bulk` acepta payloads ilimitados. (Section 1 A5)
**Cómo:** `slowapi` con `@limiter.limit("60/minute")` en bulk endpoints + `max_items=1000` en schema.
**Esfuerzo:** S (humano: ~1 hr / CC: ~15 min)

### T14. Touch events (iPad/tablet support)
**Por qué:** Mouse drag no funciona en touch. iPad es escenario realista para CEO/gerentes revisando. (Section 11 D6)
**Cómo:** Reemplazar `mousedown/move/up` por `pointerdown/move/up` (cubren mouse + touch + pen).
**Esfuerzo:** M (humano: ~2 hrs / CC: ~30 min)

### T15. Bootstrap split (canvas vs meta) para resilencia
**Por qué:** Si una entidad falla, todo el módulo se cae. (Section 1 A4)
**Cómo:** `/api/comercial/bootstrap-canvas` y `/bootstrap-meta` separados. Frontend carga ambos en paralelo, fallo de uno no bloquea el otro.
**Esfuerzo:** S (humano: ~1.5 hrs / CC: ~30 min)
