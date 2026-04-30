# Diseño y plan: Drawer Touchpoint + Catálogo Global

**Fecha:** 2026-04-30
**Branch:** main
**Autor:** CEO Review (Jerónimo Celis) + Claude
**Estado:** APROBADO — listo para implementar

---

## 0. Origen del documento

Durante el CEO Review post Mapa Visual v3 se detectó que el modal "Editar Touchpoint" desde la tabla **Mapa de Procesos** no permite ver ni crear iniciativas, aunque las tablas backend `comercial_initiative_touchpoint` e `comercial_initiative_friction` existen desde las migraciones v5–v7. El loop conceptual que el usuario quiere operar es:

```
Touchpoint  ──┐
              ├──► Fricción ──► Iniciativa ──► Responsable + KPI ──► Resultado ──► Re-ajuste
Iniciativa ──┘
```

Hoy ese loop existe en BD pero está partido en la UI: la pestaña Iniciativas vive aparte del touchpoint, el modal de edición no lo refleja, y los datos nunca convergen visualmente.

Tras tres iteraciones de replanteo, el diseño correcto es **dos modos en una herramienta**, materializados en tres piezas: canvas (espacial), drawer-ficha (profundidad), catálogo global (sistema).

---

## 1. Filosofía: dos modos, una herramienta

### Modo Arquitecto (construir la arquitectura ideal)

Quién: CEO, líderes de área. Cuándo: setup inicial + revisiones mensuales/trimestrales.

Qué hace:
- Mapea el journey: fases, touchpoints, conexiones, dependencias.
- Identifica fricciones existentes o sospechadas en cada touchpoint.
- Diseña iniciativas para atender fricciones (qué hacer, contra qué, qué KPI mueve, quién, cuándo).
- Detecta huecos: ¿touchpoints sin KPIs?, ¿fricciones sin iniciativa?, ¿áreas sin owner?

### Modo Operador (seguimiento y avance)

Quién: responsables de iniciativas, owners de touchpoints, contadora, asesores. Cuándo: día a día / semanal.

Qué hace:
- Registra valores nuevos de KPIs.
- Actualiza progreso de iniciativas y agrega comentarios.
- Reacciona a caídas de KPI revisando fricciones y ajustando iniciativas.
- Cierra iniciativas con resultado documentado.

**Regla de oro:** el sistema NO tiene un toggle "modo arquitecto / modo operador". El mismo UI sirve para ambos porque cada item evoluciona naturalmente por estados (definido → planeado → en progreso → cerrado). El drawer renderiza distinto según el estado de cada cosa, no según un modo manual.

---

## 2. Las tres piezas del sistema

```
┌────────────────────────────┬─────────────────────────────┐
│   CANVAS (Mapa Visual)     │   DRAWER (ficha del nodo)   │
│   — vista espacial         │   — vista profunda          │
│   YA EXISTE                │   PARCIAL — extender        │
│   Sirve: arquitecto        │   Sirve: ambos modos        │
└────────────────────────────┴─────────────────────────────┘
                       ↕ comparten datos ↕
┌──────────────────────────────────────────────────────────┐
│   CATÁLOGO GLOBAL (pestaña Iniciativas)                  │
│   — vista de sistema, filtrable y ordenable              │
│   YA EXISTE — polish + click→drawer                      │
│   Sirve: arquitecto (cobertura) + operador (mi backlog)  │
└──────────────────────────────────────────────────────────┘
```

Cada pieza responde a UNA pregunta:
- Canvas: "¿cómo se conecta el journey?"
- Drawer: "¿qué pasa con este touchpoint en particular?"
- Catálogo: "¿qué pasa en TODO el sistema?"

---

## 3. El drawer-ficha en detalle

El drawer ya existe (`_showCanvasDrawerTouchpoint` en `static/comercial.js:4171`). Hoy es read-only y solo se abre desde el canvas. Esta es la versión objetivo:

```
┌─ TP-1 · Primera Llamada ──────────────────────┐
│ [editable] · Fase: Atracción · Owner: [Juan▾] │
│                                       [Cerrar] │
├───────────────────────────────────────────────┤
│ KPIs                                          │
│   ▼ Conversión                                │
│     Meta: 30%  Frecuencia: mensual            │
│     Estado: 24% (-6pp) · medido 17-abr        │
│     Histórico: 28 → 26 → 24                   │
│     [+ Registrar valor]                       │
│   ▼ Duración promedio                         │
│     Meta: <10min  Frec: semanal               │
│     [Sin medición — Registrar valor]          │  ← arquitecto definió, operador aún no mide
│   [+ Definir nuevo KPI]                       │
├───────────────────────────────────────────────┤
│ Fricciones (3)                                │
│   ▼ "Cliente no contesta primer intento"      │
│      Severidad: [Alta▾] Estado: [análisis▾]  │
│      Atacada por: 2 iniciativas               │
│      [+ Iniciativa para esta fricción]        │
│   ▶ "Script desactualizado" — sin iniciativa  │  ← arquitecto la ve, sabe que falta cura
│   ▶ "Falta CRM al colgar"                     │
│   [+ Nueva fricción]                          │
├───────────────────────────────────────────────┤
│ Iniciativas (3)                               │
│   ▼ Auto-dial 3 reintentos                    │
│     Resp: [María▾] · 60% · entrega 15-mayo    │  ← operador actualiza progreso
│     Ataca: "no contesta primer intento"       │
│     Impacto esperado: +5pp conversión         │
│     [Editar] [Ver detalle completo]           │
│   ▶ Script v2 — Estado: planeada              │  ← arquitecto la diseñó, sin arrancar
│   ▶ CRM auto-log — Done · resultado: -2min    │  ← cerrada, queda el registro
│   [+ Nueva iniciativa]                        │
├───────────────────────────────────────────────┤
│ Comentarios (4)                               │
│   18-abr · María: "Probamos día completo"     │
│   17-abr · Juan: "KPI medido en 24%"          │
│   [+ Comentar]                                │
├───────────────────────────────────────────────┤
│ Historial · Datos del touchpoint              │
│   Canal: [Llamada▾]   Tipo: [Primera▾]        │
│   Order: 1   Notas: [...]                     │
└───────────────────────────────────────────────┘
```

### Por qué esta forma cierra el loop

1. **Orden = causalidad.** KPI (síntoma) → Fricciones (causa) → Iniciativas (cura) → Comentarios (evidencia). El cerebro humano lee historias, no índices.
2. **Trazabilidad visible.** Cada iniciativa muestra qué fricción ataca y qué KPI mueve. Hoy esa relación existe en BD pero el usuario no la ve.
3. **Cero cambio de contexto.** El canvas o la tabla siguen visibles detrás del drawer. El operador no pierde dónde está cuando trabaja un touchpoint.
4. **Edición in-place.** Crear iniciativa o registrar KPI = un click + form inline, no abrir submodal aparte.
5. **Las secciones colapsan.** Touchpoint sano se ve compacto, touchpoint problemático se expande naturalmente donde duele.

### Estados visuales por item

| Item | Definido (sin actividad) | En progreso | Cerrado |
|---|---|---|---|
| KPI | "Sin medición — Registrar valor" gris | Valor + meta + tendencia | (KPIs no se cierran) |
| Fricción | Severidad chip + "sin iniciativa" rojo | Estado chip + N iniciativas | Tachado + fecha cierre |
| Iniciativa | Chip "planeada" gris | Progress bar + due date | Chip "done" + resultado |

---

## 4. El catálogo global en detalle

La pestaña **Iniciativas** ya existe (`renderIniciativas` en `static/comercial.js:1487`). Hoy muestra una tabla con filtros por status, responsable, prioridad, área, tipo. Cambios mínimos:

- **Click en una fila → abre drawer del touchpoint relacionado**, expandido en la sección Iniciativas con la fila destacada.
- **Vista alterna "agrupada"**: agrupar por touchpoint, por fase, o por responsable. Útil para arquitecto que busca cobertura.
- **Badge de cobertura**: "X fricciones sin iniciativa" en encabezado.
- **Catálogo de fricciones huérfanas**: filtro especial "fricciones sin iniciativa que las ataque" — pregunta clave del arquitecto.

---

## 5. Reorganización de pestañas (DEFERRED)

La opción de reducir 8 → 5 pestañas se difiere. Razón: cambiar la nav rompe el modelo mental que el equipo ya tiene. Primero entregamos drawer + catálogo, después evaluamos si las pestañas duplican.

Pestañas actuales (sin cambio en este sprint):

1. Dashboard
2. Mapa de Procesos
3. Mapa Visual
4. Fricciones & Tareas
5. Linea de Tiempo
6. Equipo
7. Iniciativas
8. KPIs Seguimiento

---

## 6. Modelo de datos (lo que ya existe)

Cero migraciones nuevas. Todo está disponible.

| Tabla | Uso | Origen |
|---|---|---|
| `comercial_touchpoints` | Nodo central | Inicial |
| `comercial_frictions` | Fricciones (con FK touchpoint_id) | Inicial |
| `comercial_iniciativas` | Iniciativas con priority, area, tipo, motor, description | v5–v7 |
| `comercial_initiative_touchpoint` | M:N iniciativa ↔ touchpoint | v7 |
| `comercial_initiative_friction` | M:N iniciativa ↔ fricción | v7 |
| `comercial_initiative_pillar` | M:N iniciativa ↔ pilar de confianza | v7 |
| `comercial_kpis` + `comercial_kpi_touchpoint` | KPIs + criticidad por touchpoint | v4 |
| `comercial_tp_kpi_history` | Histórico de mediciones por touchpoint | v4 |
| `comercial_comments` | Comentarios | Inicial |
| `comercial_activity_log` | Audit log existente | Inicial |

---

## 7. Endpoints (lo que ya existe)

Todo el CRUD está en `app/routers/comercial.py`. Verificado:

```
GET    /api/comercial/iniciativas/           — list con filtros status/responsable
POST   /api/comercial/iniciativas/           — create (acepta touchpoint_ids, friction_ids)
PATCH  /api/comercial/iniciativas/{id}       — update parcial
DELETE /api/comercial/iniciativas/{id}       — delete

GET    /api/comercial/touchpoints/{id}/kpis  — KPIs vinculados
PUT    /api/comercial/touchpoints/{id}/kpis  — link/unlink batch
POST   /api/comercial/tp-kpi-history/        — registrar valor de KPI por touchpoint
GET    /api/comercial/tp-kpi-history/        — histórico

POST   /api/comercial/comments/              — agregar comentario
GET    /api/comercial/comments/?entity=...   — leer comentarios

GET    /api/comercial/bootstrap              — todo en una llamada (incluye iniciativas)
```

Sin endpoints nuevos. Sin migraciones.

---

## 8. Plan de implementación por fases

Cada fase es independiente y commiteable. El orden importa: 1A→1B→1C antes de 1D.

### Fase 1A — Drawer con KPIs detallados

**Qué:** Reemplazar la sección KPIs del drawer (hoy solo health dot) por:
- Cada KPI vinculado al touchpoint, con meta, valor actual, tendencia, fecha última medición.
- Histórico inline (últimos 3 valores como sparkline o lista).
- Botón "+ Registrar valor" → modal o inline form que POST a `/tp-kpi-history/`.
- Estado "Sin medición — Registrar valor" cuando no hay histórico.

**Archivos:** `static/comercial.js` (función `_showCanvasDrawerTouchpoint` + helpers).

**Esfuerzo:** S (~30 min CC).

### Fase 1B — Edición inline en drawer

**Qué:** Convertir nombre, canal, responsable, fase, order, notas en campos editables con auto-save al blur. Pattern: input siempre visible, change → PATCH al backend, revert si error.

**Archivos:** `static/comercial.js`.

**Esfuerzo:** M (~45 min CC).

### Fase 1C — Crear iniciativas inline desde drawer

**Qué:** Botón "+ Nueva iniciativa" en sección Iniciativas del drawer abre un mini-form (o reutiliza `showInitiativeModal`) con `touchpoint_ids: [tp.id]` precargado. También botón por fricción que precargue `friction_ids: [f.id]`.

**Archivos:** `static/comercial.js`.

**Esfuerzo:** S (~20 min CC).

### Fase 1D — Tabla "Mapa de Procesos" usa el drawer

**Qué:** Cambiar `showEditTouchpointRow` (modal) por una llamada que abra el drawer unificado. El modal antiguo se elimina. El drawer pasa a ser EL ÚNICO punto de entrada para editar/operar un touchpoint.

**Archivos:** `static/comercial.js` (línea 5072 reemplaza llamada por `_showCanvasDrawerTouchpoint(tpId)` desde la tabla).

**Esfuerzo:** S (~15 min CC).

### Fase 1E — Comentarios + Historial en drawer

**Qué:** Sección comentarios al final del drawer con últimos N + textarea para nuevo. Sección historial muestra últimos eventos del activity_log filtrados por entity_type=touchpoint y entity_id=tp.id.

**Archivos:** `static/comercial.js`.

**Esfuerzo:** M (~30 min CC).

### Fase 2 — Catálogo global mejorado

**Qué:** Polish a `renderIniciativas`:
- Click en fila → abre drawer del touchpoint asociado.
- Toggle "Vista plana / Por touchpoint / Por responsable".
- Filtro especial "fricciones sin iniciativa".
- Badge de cobertura en encabezado.

**Archivos:** `static/comercial.js`.

**Esfuerzo:** M (~45 min CC).

### Fase 3 — Deploy + smoke test

**Qué:** Commit por fase (5 commits limpios), push, `railway up --detach`, correr `scripts/smoke_test.sh` contra prod.

**Esfuerzo:** S (~10 min).

---

## 9. Verificación end-to-end

Después de Fase 1 completa, este flujo debe funcionar sin recargar página:

1. **Modo arquitecto:** Abre tabla Mapa de Procesos → click en TP-1 → drawer abre con todos los datos. Define KPI "Conversión" meta 30%. Agrega fricción "no contesta primer intento". Crea iniciativa "Auto-dial 3 reintentos" desde la fricción → asigna a María, due 15-mayo. Cierra drawer.

2. **Modo operador (3 días después):** Abre canvas → click en TP-1 → drawer abre. Click "+ Registrar valor" en KPI Conversión → ingresa 24%. Ve que la iniciativa Auto-dial está al 60%. Agrega comentario "Probamos día completo". Cierra drawer.

3. **Modo arquitecto (revisión semanal):** Abre pestaña Iniciativas → filtra "fricciones sin iniciativa" → ve "Script desactualizado" sin cura → click → abre drawer del touchpoint → crea iniciativa "Script v2".

Si esos tres flujos pasan, el loop está cerrado.

---

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Drawer queda demasiado denso, asusta al operador | Secciones colapsables; lo no-relevante (Datos del touchpoint, Historial) inicia colapsado. Test con usuario real antes de deploy. |
| Edición inline + multi-tab = race conditions | T5 del backlog cubre version stamps. En este sprint, last-write-wins consciente; documentado. |
| Canvas + tabla apuntan al mismo drawer pero con id distinto en DOM | Reutilizar `#cm-canvas-drawer` desde la tabla. Si es necesario, mover el drawer a un layer global del módulo, no del canvas. |
| Modal "Editar Touchpoint" tiene chips de KPIs/fricciones que no están en drawer | Migrar `kpiChipInputHtml` y `frictionChipInputHtml` al drawer en Fase 1D, antes de eliminar el modal. |
| Fase 1D rompe la tabla Mapa de Procesos para usuarios que no entienden el drawer | Mantener el drawer SIEMPRE accesible vía teclado (Esc cierra), bottom-sheet en mobile. Toast onboarding la primera vez. |

---

## 11. Lo que NO hacemos en este sprint

- Reorganización 8 → 5 pestañas. Después de validar drawer.
- RBAC, audit log multi-user, tests backend (TODOS T1–T4).
- Touch events (T14), Sentry frontend (T12).
- Refactor del archivo de 7000 LOC (T10).
- Vista cronológica unificada (sigue habiendo Linea de Tiempo aparte).

---

## 12. Definición de "hecho"

- [ ] Doc commiteado.
- [ ] Fase 1A–1E commiteadas con verificación manual.
- [ ] Fase 2 commiteada.
- [ ] Push a `main` y deploy a Railway.
- [ ] Smoke test 6/6 ✓ contra producción.
- [ ] Captura del drawer pegada en Slack/email para que el equipo lo vea.
