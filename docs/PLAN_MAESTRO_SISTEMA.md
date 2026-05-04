# Plan Maestro — Sistema de Arquitectura Comercial Promoselect

**Versión:** 1.0
**Fecha:** 2026-05-01
**Autor:** Jerónimo Celis (CEO Promoselect / Stencil Group) + Claude
**Estado:** Aprobado para ejecución
**Reemplaza a:** propuestas anteriores de plan-ceo-review y plan-devex-review

---

## 1. Norte

> Construir el **sistema operable** que digitaliza la metodología de Arquitectura Comercial de Cris Urzúa, para que Promoselect deje de operar por intensidad personal y empiece a operar por sistema.

Lo que la herramienta debe lograr en 6 meses:

1. Que cada persona del equipo comercial sepa **qué touchpoint le toca, con qué calidad lo tiene que ejecutar, y cómo se mide**.
2. Que el CEO pueda contestar en **5 segundos** las 4 preguntas del Manifiesto §44: ¿subió o bajó utilidad, CAC, LTV, conversión?
3. Que cada **fricción detectada** tenga dueño, fecha de cierre y métrica de impacto.
4. Que el **motor de confianza** se construya con cadencia visible, no como "lo haremos cuando tengamos tiempo".
5. Que el **mapa del proceso** refleje la realidad operativa actual, no el ideal.

**Anti-objetivo:** no estamos construyendo un CRM, ni un task manager genérico, ni una herramienta multi-empresa. Esto es un solo workspace para un solo equipo.

---

## 2. Principios rectores

| # | Principio | Implicación práctica |
|---|---|---|
| 1 | **Single-tenant Promoselect** | No auth, no roles técnicos, no permisos. Todos ven lo mismo. |
| 2 | **El sistema es la metodología** | Cada concepto del workbook tiene un lugar concreto en la app. Nada inventado. |
| 3 | **8 atributos por TP son contrato** | Si falta uno, el TP está marcado como "incompleto" visualmente. |
| 4 | **Realidad sobre ideal** | El mapa documenta lo que pasa hoy, con sus fricciones. Optimizar viene después. |
| 5 | **Menos es más** | 8 TP que se cumplen > 47 TP perfectos que nadie ejecuta. |
| 6 | **Lo que no se mide, no mejora** | Cada KPI tiene cadencia. Cada iniciativa cae en ciclo 30-60-90. |
| 7 | **Boil the lake** | AI hace que el costo marginal de completitud tienda a cero. Hacer la cosa completa, no la versión "mínima viable". |

---

## 3. Estructura del sistema

### 3.1 Tres pestañas

```
┌─────────────────────────────────────────────────────────────┐
│  MAPA           |   TRABAJO         |   MEDICIONES          │
│  (operación)    |   (mejora)        |   (gobernanza)        │
└─────────────────────────────────────────────────────────────┘
```

#### Pestaña 1 — **Mapa** (home, lo que se ve al entrar)

Es la radiografía visual del proceso. Cuenta la historia de cómo un desconocido se vuelve cliente recurrente.

**Layout:**
```
  ┌─ Motor de Confianza (wizard de construcción, lateral o colapsable) ─┐
  └────────────────────────────────────────────────────────────────────┘
  
  ENTRY ──► Atracción ─► Captura ─► Conversión ─► Onboarding ─► Recompra ──┐
   ↑                                                                       │
   └─────────── loop de referidos / testimonios ──────────────────────────┘
```

**Qué se ve en cada touchpoint del canvas:**
- Nombre + canal (icono) + responsable (avatar)
- Badge de clasificación: 🟥 crítico / 👁️ invisible / 🔁 redundante / ✕ innecesario
- Badge de apalancamiento: ⚡ velocidad / 🎯 diagnóstico / 🔂 persistencia
- Indicador de salud: verde si los 8 atributos están completos, ámbar si faltan 1-2, rojo si faltan 3+
- Mini-meta de KPIs si tiene mediciones recientes

**Interacciones:**
- Click en TP → drawer-ficha completo
- Drag entre anchors → crear flecha de journey (predecesor/sucesor)
- Botón "siguiente paso recomendado" — sugiere el TP más débil para atender
- Modo guiado (primera vez) — tour fase por fase explicando qué es cada cosa

#### Pestaña 2 — **Trabajo** (lo que hay que mejorar esta semana)

Aquí pasa la operación de mejora. No es para visualizar — es para resolver.

**Secciones:**
1. **Inbox de fricciones** — filtrable por tipo (las 6 del Manifiesto), por TP, por dueño.
2. **Iniciativas activas** con su ciclo 30-60-90 visible. Cada una marca día 30, 60, 90 con decisión pendiente: continuar / optimizar más / descartar / double down.
3. **Carta de Gobernanza** — tabla de áreas → dueño → cadencia de auditoría.
4. **Registro de Huecos** — mediciones que sabemos que faltan pero no podemos cerrar todavía.
5. **Pruebas de validación pendientes** — terreno, cliente fantasma, datos.

#### Pestaña 3 — **Mediciones** (la brújula)

**Bloques top-down:**
1. **4 maestras del CEO** — Utilidad, LTV, CAC, Conversión. Semáforo y tendencia. Manifiesto §44.
2. **KPIs por fase** — agrupados por las 5 fases. Cada uno con histórico, dueño, semáforo.
3. **KPIs del Motor de Confianza** — vistas, alcance, testimonios coleccionados, etc.
4. **Pruebas de validación realizadas** — bitácora con findings.

### 3.2 Drawer-ficha del touchpoint (pieza central)

Cubre los **8 atributos formales** del workbook, organizados así:

```
┌─ Identidad ─────────────────────────────────────────┐
│ Nombre · Fase · Canal(es) · Responsable             │
├─ Secuencia ─────────────────────────────────────────┤
│ Predecesores · Sucesores · Paralelos                │
├─ Operación ─────────────────────────────────────────┤
│ Checklist interno (5-10 ítems)                      │
│ Duración estimada                                   │
├─ Diagnóstico ───────────────────────────────────────┤
│ Clasificación · Apalancamiento                      │
│ Fricciones (con tipo de los 6)                      │
├─ Medición ──────────────────────────────────────────┤
│ KPIs (1-2) · histórico · próxima medición           │
├─ Histórico ─────────────────────────────────────────┤
│ Comentarios · log de actividad                      │
└─────────────────────────────────────────────────────┘
```

Validador en el header: "TP completo 7/8 — falta checklist".

### 3.3 Wizard del Motor de Confianza

NO es una fase con touchpoints operables. Es un **playbook de construcción** que te lleva de la mano para armar los 5 componentes.

**Estructura por componente:**
```
[1] Contenido en redes               45% completo
    ✓ Definir frecuencia mínima
    ✓ Asignar dueño (Cris)
    ☐ Plantilla de calendario       ← siguiente
    ☐ Primer mes de contenido publicado
    ☐ Cadencia validada 30 días
    Próxima acción: armar plantilla este viernes
    
[2] Testimonios coleccionados        20% completo
    ...
    
[3] Símbolos de autoridad            0% completo
[4] Identidad de marca               60% completo
[5] Comunidad activa                 0% completo
```

Cada componente tiene: dueño, % progreso, próxima acción, deadline opcional, log de avances.

### 3.4 Sistema de gobernanza

**Cuatro mecanismos físicos en la app:**

1. **Carta de Gobernanza** (tabla): Atracción → María, Conversión → Luis, etc., con cadencia de auditoría.
2. **Ciclo 30-60-90** (sobre cada iniciativa): tres revisiones obligatorias con campo de decisión.
3. **Registro de Huecos** (lista): mediciones imposibles hoy, ordenadas por prioridad de cerrarlas.
4. **Pruebas de validación** (registro): cada vez que alguien hace una prueba de terreno, cliente fantasma o datos, queda documentada.

---

## 4. Personas y User Stories

> **Nota:** son **roles operativos**, no usuarios técnicos del sistema. Todos ven la misma app sin filtros. Las personas describen *cómo* cada rol usa la herramienta en su día a día.

### 4.1 CEO / Director General — Jerónimo

**Frecuencia de uso:** revisión semanal de 30 min + auditoría trimestral de 1-2 hr.

**Lo que necesita ver primero al abrir la app:**
- Las 4 maestras (utilidad, LTV, CAC, conversión) con flecha de tendencia.
- TPs críticos en rojo (los que están sangrando).
- Iniciativas con día 30/60/90 vencido sin decisión.

**User stories:**
- Como CEO, quiero ver las 4 métricas maestras en 5 segundos para saber si el sistema está sano sin tener que perseguir a nadie.
- Como CEO, quiero ver qué iniciativas requieren decisión 30-60-90 esta semana, para no dejar nada en limbo.
- Como CEO, quiero un overlay de salud sobre el mapa que me muestre dónde está el TP más débil, para decidir dónde meter recursos.
- Como CEO, quiero abrir el wizard del Motor de Confianza y saber qué componente está atrasado, sin pedírselo a nadie.
- Como CEO, quiero que la Carta de Gobernanza me confirme que cada área tiene dueño con cadencia, para garantizar que no me llegan sorpresas.

**Anti-stories (lo que el CEO NO debe hacer en la app):**
- NO debería tener que ejecutar checklists de TPs (eso es de los líderes).
- NO debería tener que cargar mediciones manuales (las cargan los ejecutores).

### 4.2 Líder de Marketing / Atracción

**Responsable de:** fases 1 y 2 (Atracción + Captura), Motor de Confianza, KPIs CAC y calidad de lead.

**User stories:**
- Como Líder de Marketing, quiero ver mis TPs de Atracción y Captura con su clasificación, para identificar redundantes y eliminarlos primero.
- Como Líder de Marketing, quiero registrar el costo por canal cada semana, para que el CAC se actualice automáticamente.
- Como Líder de Marketing, quiero ser dueño del wizard del Motor de Confianza, para construirlo paso a paso con cadencia visible al CEO.
- Como Líder de Marketing, quiero que cuando agregue un canal nuevo (ej: TikTok Ads), pueda crear los TPs asociados en menos de 5 minutos con plantilla.
- Como Líder de Marketing, quiero que el sistema me alerte si un canal tiene CAC subiendo 3 períodos consecutivos.

### 4.3 Líder Comercial / Ventas

**Responsable de:** fase 3 (Conversión), KPIs de cierre, fricciones operativas en venta.

**User stories:**
- Como Líder Comercial, quiero ver la tasa de conversión por etapa del embudo, para detectar dónde se pierden los prospectos.
- Como Líder Comercial, quiero asignar fricciones a cada vendedor con deadline, para que no queden en aire.
- Como Líder Comercial, quiero el checklist interno del TP "Vendedor envía propuesta" sea ejecutable por mis vendedores en menos de 60 segundos.
- Como Líder Comercial, quiero medir el tiempo de respuesta inicial (Punto 1: Velocidad) por vendedor, para identificar quién necesita coaching.
- Como Líder Comercial, quiero documentar las objeciones más frecuentes en el TP de cierre para que un vendedor nuevo se entrene con el sistema.

### 4.4 Líder Operaciones / Onboarding

**Responsable de:** fases 4 y 5 (Onboarding + Recompra), KPIs de LTV y churn.

**User stories:**
- Como Líder de Operaciones, quiero ver cuánto tarda un cliente en llegar al "primer momento ajá", para optimizar el onboarding.
- Como Líder de Operaciones, quiero registrar cada vez que un cliente recompra para que el LTV se actualice solo.
- Como Líder de Operaciones, quiero un protocolo de win-back ejecutable cuando un cliente baja su frecuencia de compra.
- Como Líder de Operaciones, quiero que las fricciones de tipo "expectativas no comunicadas" en mi fase me lleguen primero porque son las que más rompen LTV.

### 4.5 Vendedor / Ejecutor

**Responsable de:** ejecutar TPs día a día y registrar evidencia.

**User stories:**
- Como Vendedor, quiero abrir el TP que estoy ejecutando y ver el checklist interno tachable, para que no se me olvide ningún paso.
- Como Vendedor, quiero registrar una medición de KPI en menos de 30 segundos sin tener que abrir varios menús.
- Como Vendedor, quiero reportar una fricción que detecté en mi día a día sin pedir permiso, con un campo de "qué pasó" y un botón.
- Como Vendedor, quiero ver mis propios KPIs de la última semana sin tener que filtrar nada.

### 4.6 Asistente / PM Operativo del Sistema

**Responsable de:** mantener la documentación al día, auditar gaps, agendar pruebas de validación.

**User stories:**
- Como Asistente, quiero ver los TPs incompletos (faltan atributos) ordenados por prioridad, para cerrarlos uno por uno.
- Como Asistente, quiero agendar una prueba de cliente fantasma trimestral con recordatorio automático.
- Como Asistente, quiero exportar la Carta de Gobernanza para revisar con cada líder de área.
- Como Asistente, quiero el Registro de Huecos visible en el dashboard, para no perder mediciones pendientes.

---

## 5. Flujos canónicos (los 5 caminos del usuario)

### Flujo 1 — "Empezar de cero" (primera vez en el sistema)

1. Usuario entra → Mapa con empty states sugiriendo agregar primer TP por fase.
2. Modo guiado opcional: tour de 90 segundos explicando las 5 fases + Motor de Confianza.
3. Plantilla de touchpoints típicos por fase (ej: "Cliente ve anuncio en Meta", "Vendedor envía propuesta") — se pueden añadir con un click.
4. Al crear un TP, drawer abre con los 8 campos, marca cuáles son obligatorios.
5. Una vez hay 3-5 TPs, se sugiere correr la primera prueba de cliente fantasma.

### Flujo 2 — "Ritual semanal de 30 min" (CEO + Líderes)

1. CEO abre Mediciones → revisa 4 maestras + tendencia.
2. Cambia a Trabajo → revisa iniciativas con día 30/60/90 vencido.
3. Cada líder presenta su mejora de la semana (1 fricción atendida + KPI movido).
4. Decisiones del 30-60-90 quedan registradas.
5. Acuerdos próxima semana → se vuelven nuevas iniciativas.

### Flujo 3 — "Atacar fricción"

1. Vendedor o cliente reporta fricción (botón "+ Fricción" desde el TP).
2. Drawer se abre, asigna tipo (uno de los 6), TP afectado, dueño sugerido.
3. Líder responsable la triaja → la convierte en iniciativa con deadline.
4. Ciclo 30-60-90 corre automático.
5. Día 90: decisión → continuar / optimizar más / descartar / double down.

### Flujo 4 — "Construir Motor de Confianza"

1. Líder de Marketing abre wizard.
2. Elige componente "Testimonios" → ve 5 sub-pasos predefinidos.
3. Marca el primero como hecho, sube evidencia (link).
4. Próxima acción auto-aparece como recordatorio en su Trabajo.
5. Progreso del componente sube. CEO lo ve sin preguntar.

### Flujo 5 — "Reportar al CEO"

1. CEO no necesita reportes — entra a Mediciones.
2. Si quiere profundizar, click en métrica maestra → ve qué KPIs de TP la están alimentando.
3. Click en KPI → ve histórico, dueño, último comentario.
4. Si algo está mal, abre fricción desde ahí.

---

## 6. Modelo de datos — resumen ejecutivo

**Lo que ya existe (24 tablas, no se toca lo bueno):**
- Phases, Touchpoints, Frictions, TrustPillars, KPIs, People, Channels (M:N), Touchpoint flows, Canvas layout, Notes, Comments, Activity log, Initiatives + sus M:N.

**Lo que se agrega (sumario de tasks #60-#69):**

| Tabla | Campos nuevos | Propósito |
|---|---|---|
| `comercial_touchpoints` | `internal_checklist`, `duration_minutes`, `duration_label`, `classification`, `leverage_point` | Cubrir los 8 atributos formales |
| `comercial_frictions` | `friction_type` | Taxonomía de las 6 fricciones |
| `comercial_kpis` | `is_master`, `master_metric` | Distinguir las 4 maestras del CEO |
| `comercial_trust_pillars` | `build_steps JSON`, `progress`, `owner_id`, `next_action`, `deadline` | Wizard de construcción |
| `comercial_governance_charter` | (nueva) | Carta de Gobernanza |
| `comercial_audit_cycle` | (nueva) | Ciclo 30-60-90 sobre iniciativas |
| `comercial_gap_log` | (nueva) | Registro de huecos |
| `comercial_validation_test` | (nueva) | 3 pruebas (terreno, cliente fantasma, datos) |

Migraciones v13 (campos) y v14 (tablas de gobernanza).

---

## 7. Roadmap por fases

| Fase | Duración estimada CC | Entregable |
|---|---|---|
| **F1 — Cimiento** | 1-2 sesiones | Migración v13 + drawer con 8 atributos + fricciones tipadas |
| **F2 — Mapa intuitivo** | 1 sesión | Health overlay, modo guiado, empty states, leyenda permanente |
| **F3 — Wizard Motor de Confianza** | 1-2 sesiones | UI lateral con 5 componentes y sub-pasos |
| **F4 — Gobernanza** | 1-2 sesiones | Migración v14 + UI de las 4 tablas |
| **F5 — Reorganizar 3 pestañas** | 1 sesión | Colapsar 8 tabs en Mapa / Trabajo / Mediciones |
| **F6 — Limpieza** | < 1 sesión | Revertir persona switcher (#57-59) |
| **F7 — Polish + plantillas** | 1 sesión | Plantillas de TPs por fase, modo guiado, mediciones rápidas |

**Orden de ejecución recomendado:** F1 → F2 → F3 → F4 → F5 → F6 → F7.

F1 es plomería que desbloquea todo. F2 entrega valor visual rápido. F3-F4 cubren los conceptos del Manifiesto que faltan. F5-F6 limpian la deuda. F7 lo deja listo para que el equipo lo use sin fricción.

---

## 8. Métricas de éxito del propio sistema

Cómo sabremos que el sistema funciona (más allá de las métricas comerciales):

| Métrica del sistema | Cómo se mide | Meta |
|---|---|---|
| **% de TPs completos** | TPs con los 8 atributos / total TPs | >80% en 60 días |
| **Frecuencia de uso** | Sesiones únicas por semana | ≥3 personas distintas/semana |
| **Iniciativas con decisión 30-60-90** | Iniciativas con día 90 cerrado / total con día 90 cumplido | 100% (no debe haber limbo) |
| **Fricciones cerradas** | Fricciones con status=completed este mes | ≥5/mes |
| **KPIs medidos en el período esperado** | Mediciones registradas dentro de su frecuencia | ≥85% |
| **Componentes del Motor de Confianza con avance** | Componentes con sub-pasos marcados este mes / 5 | ≥3/5 cada mes |

Si después de 90 días alguna de estas está en rojo, el sistema no se está usando — toca rediseñar la fricción de adopción.

---

## 9. Anti-objetivos (lo que NO queremos)

Para mantener el rumbo, recordar lo que NO es esto:

1. **No es un CRM** — no maneja leads ni deals individuales. Maneja la arquitectura del proceso.
2. **No es un task manager genérico** — tareas viven dentro de TPs y fricciones, no como entidad libre.
3. **No es multi-empresa** — Promoselect, single-tenant, sin auth.
4. **No es para clientes externos** — solo equipo interno.
5. **No reemplaza a Slack/email/WhatsApp** — la comunicación operativa pasa fuera.
6. **No genera reportes para nadie más** — el CEO se reporta a sí mismo aquí.
7. **No tiene "modo administrador" vs "modo usuario"** — todos ven todo.
8. **No vamos a construir IA generativa propia** — herramientas externas (Claude, ChatGPT) opinan; aquí persistimos.

---

## 10. Decisiones que quedan abiertas

Cosas no críticas para arrancar pero que tarde o temprano hay que resolver:

1. **¿Vendedor individual ve sus propios KPIs filtrados, aunque todos vean todo?** Probable: sí, vista "mis cosas" sin tab dedicado.
2. **¿Subimos evidencia (screenshots, videos) a un componente del Motor o solo links externos?** Por ahora links. Storage propio es post-MVP.
3. **¿Integrar con ZOHO/Aircall/Wati para auto-medir KPIs?** Diferido a F8+.
4. **¿Plantillas predefinidas de TPs descargables de la metodología?** Sí, pero al final de F7.
5. **¿Modo lectura para alguien externo (consultor, board)?** Diferido. Single-tenant por ahora.

---

## 11. Lo que noté de cómo piensas en este proyecto

Lo que se observó a lo largo de las conversaciones que dio forma a este plan:

- **Distingues bien entre "playground personal" y "producto real"**: dejaste claro que dashboard, gastos y simulador son tu sandbox, y que el módulo Comercial es lo único que aspira a ser una solución completa. Eso evitó que infláramos el scope.
- **Sabes corregir cuando ves rigidez**: cuando propuse "KPIs maestros" como concepto fijo, dijiste "no quiero que giren todo en torno a eso". Esa flexibilidad es lo que diferencia a un sistema operable de un sistema impuesto.
- **Distinguiste correctamente que el persona switcher era complejidad falsa** ("la parte esa de la persona quizás no me haga tanto sentido"). En single-tenant, todo el mundo viendo lo mismo es más simple y más honesto.
- **Tienes claro que el Motor de Confianza es construcción guiada, no operación diaria**. Eso es exactamente lo que el Manifesto §11 dice: "se delega como un proceso operativo permanente, con responsable, con cadencia". Como wizard funciona; como TPs operables no encajaba.
- **Cuando dijiste "que sea muy intuitivo el usarlo", no estabas pidiendo decoración**: estabas pidiendo que el siguiente paso sea obvio. Esa es la prueba real del UX, y por eso F2 es la fase con más cuidado.

---

## La asignación

Antes de que arranquemos código:

**Decide en qué orden quieres ejecutar las fases F1-F7** y confirma si las estimaciones te hacen sentido. No las ejecutes — solo léelas y dime si hay alguna que muevas de lugar o que no quieras hacer.

Después de eso, arranco F1 (migración v13 + drawer).

---

*Documento generado en sesión /office-hours, basado en Workbook de Cris Urzúa y Manifiesto Teórico — Arquitectura Comercial.*

---

# Apéndice A — Cambios post-autoplan (2026-05-01)

Decisiones aplicadas tras review pipeline `/autoplan` (CEO + Design + Eng).
Reporte completo: `docs/AUTOPLAN_REVIEW_REPORT.md`. Restore point: `~/.gstack/projects/Skatalites94-dashboard-q1-api/main-autoplan-restore-20260501-141833.md`.

## A.1 Cambios al modelo de datos

### A.1.1 Wizard del Motor de Confianza — tabla real (no JSON)

Originalmente: `comercial_trust_pillars.build_steps JSON`.
**Reemplazado por** tabla nueva `comercial_trust_pillar_steps`:
```
comercial_trust_pillar_steps (
  id, pillar_id FK, order INT, text, done BOOL,
  owner_id FK, deadline DATE NULL, evidence_link TEXT NULL,
  completed_at DATETIME NULL, created_at, updated_at
)
```
Razón: cuando el CEO pregunte "qué sub-pasos del Motor están atrasados con dueño Cris", JSON column no es queryable en SQLite local.

### A.1.2 Migration v13 — endurecida

- Single transaction wrapper por archivo de migración (no múltiples `engine.begin()` separados)
- Crear tabla `schema_migrations (version, applied_at)` para tracking idempotente
- Cada migración tiene script paralelo `migrate_comercial_v13_rollback.py`
- Pre-deploy: `pg_dump` de Supabase obligatorio (vía dashboard o CLI)

### A.1.3 §3.2.1 Completeness contract (drawer "X/8 atributos")

Definir exactamente 8 predicados booleanos en `app/serialize.py:_tp_completeness(tp)`:
1. `has_name` = `tp.name IS NOT NULL AND len(tp.name) > 0`
2. `has_phase` = `tp.phase_id IS NOT NULL`
3. `has_channel` = al menos 1 row en `comercial_touchpoint_channel`
4. `has_responsable` = `tp.responsable_id IS NOT NULL AND person.is_active`
5. `has_sequence` = al menos 1 row en `comercial_touchpoint_flow` (entrante o saliente)
6. `has_kpi` = al menos 1 row en `comercial_kpi_touchpoint`
7. `has_checklist` = `len(tp.internal_checklist) >= 3` (mínimo 3 ítems)
8. `has_diagnosis` = `tp.classification IS NOT NULL` (no requiere apalancamiento — opcional)

Pure function, testable. Test asociado en F1.

### A.1.4 §6.1 Rollup contract — 4 maestras

Antes de F1 ship, definir formula explícita por cada maestra:
- **Conversión** = `count(deals_cerrados) / count(prospectos)` por período. Source: KPIs con `master_metric='conversion'`. Rollup: avg ponderado por phase si múltiples fuentes.
- **CAC** = `sum(spend_marketing+ventas) / count(nuevos_clientes)` por período. Source: KPIs `master_metric='cac'`. Rollup: ratio simple.
- **LTV** = `avg(suma de compras por cliente en su lifetime)`. Source: KPIs `master_metric='ltv'`. Rollup: avg simple. (Nota: requiere histórico de >6 meses para ser confiable.)
- **Utilidad** = `(LTV * margin_pct) - CAC`. Source: combinación de las anteriores. Rollup: derivada.

Implementar en `app/serialize.py:_master_metrics_rollup()`. Documentar en docstring.

## A.2 Cambios al UX (drawer + IA)

### A.2.1 Drawer two-tier completeness (softening)

Reemplazar "TP completo X/8" rígido por:
- **TP usable** = 3 fields obligatorios (nombre, fase, responsable) — los únicos requeridos al CREATE
- **TP completo** = 8 atributos — métrica aspiracional, mostrada como progreso visual sin bloqueo
- Drawer abre con secciones Identidad+Secuencia expandidas, resto colapsadas
- Inline canvas edit: doble-click en TP card permite editar los 3 fields mínimos sin abrir drawer
- Autosave con indicador "Guardado hace 3s" (debounce 500ms)
- Sin presión visual de "incompleto = malo" — solo muestra progreso

### A.2.2 Sticky strip de 4 maestras

Las 4 métricas maestras (Utilidad, LTV, CAC, Conversión) viven en una **sticky strip arriba** visible en todas las 3 pestañas, no enterradas en pestaña Mediciones. CEO ve estado en 5 segundos siempre, sin importar dónde esté.

### A.2.3 Progressive disclosure (Tier A/B/C)

Reglas de visibilidad de conceptos en UI:
- **Tier A — visible siempre**: Touchpoint, Fase, KPI, Fricción, Iniciativa
- **Tier B — visible cuando ya hay >5 TPs creados (auto-unlock) o toggle "Ver avanzado"**: Clasificación, Apalancamiento, Predecesor/Sucesor, los 8 atributos formales del drawer, Checklist interno, Canal M:N
- **Tier C — visible solo en F4 cuando se complete Gobernanza**: Motor de Confianza wizard, Ciclo 30-60-90, Carta de Gobernanza, Registro de Huecos, Pruebas de validación, KPI maestro tagging, Health overlay

UI: toggle "Modo simple / Modo avanzado" en topbar. Modo simple por defecto.

### A.2.4 Wizard del Motor de Confianza — drawer overlay lateral

Decidir explícitamente: no en canvas, no inline. **Drawer overlay lateral** (similar al drawer-ficha pero específico para el Motor) que se abre con botón "🔧 Motor de Confianza" en topbar. Permite trabajar en el motor sin perder contexto del Mapa.

### A.2.5 Specificity Pass en F2 (deliverable mandatorio)

F2 NO se cierra hasta que existan mocks HTML (no Figma — usamos design-system existente) referenciando `docs/design-system/tokens.md` y `components.md` para:
- Drawer width, scroll behavior, sectional collapse animation
- Anchor visual + cursor states durante drag-to-link
- Health badge (forma + color + label, nunca solo emoji)
- Classification + apalancamiento badges (consistentes con design-system, no emoji)
- Modo guiado: trigger, dismissal, persistencia
- Mobile: viewport <768px qué se rinde y qué se oculta

### A.2.6 Mobile + a11y mínimos en F7

F7 incluye:
- Mediciones (4 maestras + KPIs) **lectura mobile**: viewport <768px stackea cards verticalmente
- Vendedor user story: registrar medición de KPI en mobile vía formulario simple (no canvas)
- Keyboard navigation en drawer: Tab/Shift-Tab + Esc para cerrar
- Color contrast WCAG AA mínimo (revisar `--text-muted` en tokens, hoy ~3:1 en `--bg-page`)
- Touch targets ≥44px en controles principales

## A.3 Adoption gate post-F2 (proceso, no código)

**Antes de iniciar F3** (Wizard Motor de Confianza), correr este checkpoint:
1. F1 + F2 deployadas a Railway
2. Jero presenta el sistema a 1 líder (María/Luis/quien sea), 30 min
3. Ese líder, sin asistencia, debe **abrir 1 fricción real**, asignarla a un TP existente, marcarla como "en análisis", y agregar 1 comentario
4. Si lo logra sin pedir ayuda → green light F3
5. Si NO lo logra → diagnosticar antes de seguir (problema de UX, problema de adopción, problema de scope, etc.)

Documentar resultado en `docs/ADOPTION_GATE_F2.md` con findings.

## A.4 Endpoint de export (en F1)

Añadir `GET /api/comercial/export.json` que retorna snapshot completo de los datos comerciales (touchpoints, fricciones, KPIs, iniciativas, etc.) en formato JSON. Permite migrar a otra herramienta o respaldar manualmente. Versión inicial sin auth (acorde con postura general del sistema), pero **TD-2 deadline:** cuando se haga security hardening, este endpoint requiere bearer token.

## A.5 Concurrencia: optimistic locking en PATCH

Modificar endpoints PATCH de Touchpoint y Friction:
- Aceptar header `If-Match: <updated_at_iso>` o body field `expected_updated_at`
- Comparar con valor en DB
- Si NO coincide → return 409 Conflict con `{"error": "stale", "current_updated_at": "..."}`
- Frontend: al recibir 409, refrescar el TP/Fricción y mostrar toast "Otro usuario modificó esto, recarga e intenta de nuevo"

## A.6 Friction delete cascade

En `app/routers/comercial.py:delete_friction`:
1. Antes de delete del row de `comercial_frictions`, ejecutar:
   - `DELETE FROM comercial_kpi_friction WHERE friction_id = ?`
   - `DELETE FROM comercial_initiative_friction WHERE friction_id = ?`
   - `DELETE FROM comercial_comments WHERE entity_type='friction' AND entity_id = ?`
2. Test de integración: crear → asociar a KPI + iniciativa → delete → assert orphans = 0

## A.7 Tests críticos en F1

Crear `tests/` directory con SOLO 2 archivos en F1:
- `tests/test_migrations_v13_v14.py`: aplica migración 2 veces sobre SQLite tmp, assert idempotente + tablas + columnas correctas
- `tests/test_comercial_master_kpis.py`: fixtures por cada maestra, assert formulas del §6.1

Resto de tests (completeness predicates, friction lifecycle, audit cycle, concurrent edit, bootstrap size, wizard build_steps) → F4 cuando ya se haya validado adopción y volume.

## A.8 Diferidos con deadline explícito

| Item | Decisión hoy | Trigger para reactivar |
|---|---|---|
| Bootstrap split (`/bootstrap` light + `/bootstrap/history` lazy) | DEFER | Smoke test mide bootstrap >800ms o >500KB en datos reales |
| Security hardening (bearer token + Cloudflare Access) | DEFER 1 mes | Onboarding de externo / contratista / 5+ usuarios concurrentes / endpoint de export usado por mobile |
| 6 personas → 3 personas | DEFER | Plan se mantiene con 6, pero las 3 "no activas" (Líder Mkt, Líder Ops, Vendedor, Asistente PM) están marcadas como **documentación pendiente de validación** — no diseñar UI específica para ellas hasta que un humano real ocupe el rol |
| Migración a Alembic | DEFER hasta v15+ | Cuando v15 sea la próxima migración o el ad-hoc se vuelva ingobernable |

## A.9 Resumen de impacto en roadmap F1-F7

| Fase | Cambios netos | Tiempo extra estimado |
|---|---|---|
| **F1** | +export endpoint, +completeness contract, +rollup contract, +tests/test_migrations + test_master_kpis, +optimistic locking, +friction cascade, schema_migrations table, rollback scripts | +1 sesión (de 1-2 a 2-3) |
| **F2** | +Specificity Pass deliverable (mocks HTML), +sticky 4 maestras strip, +modo simple/avanzado toggle | +0.5 sesión |
| **F2.5** | **NUEVO**: Adoption Gate proceso (no código) | <0.5 sesión |
| **F3** | Wizard como drawer overlay lateral (no canvas), tabla `trust_pillar_steps` (no JSON) | sin cambio |
| **F4** | Resto de tests pytest (~6 archivos), tablas gobernanza | +0.5 sesión |
| **F5** | Hash routing redirects (URLs viejas → nuevas) | sin cambio |
| **F6** | sin cambio | sin cambio |
| **F7** | +mobile lectura, +a11y básica | +0.5 sesión |

**Total de roadmap revisado:** 8 fases (F1, F2, F2.5, F3, F4, F5, F6, F7), ~9-10 sesiones CC totales.

---

*Apéndice A aplicado tras gate de autoplan cerrado el 2026-05-01. Este apéndice manda sobre cualquier conflicto con secciones 1-11 del plan original.*
