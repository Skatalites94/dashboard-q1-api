# Módulo Arquitectura Comercial — reglas de negocio y operación

## Objetivo del módulo

Herramienta para **implementar** el sistema comercial (mapa de proceso, touchpoints, fricciones, KPIs) y **dar seguimiento operativo**: quién hace qué, en qué estado va cada fricción, y cómo evolucionan las mediciones de KPIs.

## Fase 1 — Ejecución de fricciones

### Estados de fricción

Orden sugerido del flujo operativo:

1. **pending** (Abierta) — registrada, sin trabajo de resolución iniciado.
2. **analysis** (En análisis) — diagnóstico o plan de acción.
3. **in_progress** (En ejecución) — implementación.
4. **validation** (Validación) — revisión antes de cerrar.
5. **completed** (Completada) — cerrada; se registra `completed_at`.

Los estados anteriores a `completed` cuentan como **activas** para métricas de seguimiento.

### Touchpoint opcional

- Una fricción puede existir **sin** touchpoint (p. ej. fricción transversal o de gobernanza).
- Si se asigna **touchpoint_id**, debe existir el touchpoint y su **fase debe coincidir** con la `phase_id` de la fricción (validación en API).

### Responsable

- Un solo **responsable** por fricción (`responsable_id` + texto `responsable` sincronizado con el nombre de la persona al guardar).

### Checklist de resolución

- Campo `resolution_checklist`: lista JSON de objetos `{ "text": string, "done": boolean }`.
- Sirve para desglosar la resolución en pasos comprobables; no sustituye el cierre formal con estado `completed`.

### KPIs vinculados a una fricción

- Relación **N:M** en tabla `comercial_kpi_friction`.
- Sustitución del conjunto de vínculos: `PUT /api/comercial/frictions/{id}/kpis` con cuerpo JSON **array de strings** (`["kpi_id_1", ...]`).
- Lectura: `GET /api/comercial/frictions/{id}/kpis`.

### Métricas de dashboard (fricciones)

- **frictions_active**: fricciones no completadas.
- **frictions_pending**, **frictions_analysis**, **frictions_in_progress**, **frictions_validation**: conteos por estado.
- **frictions_overdue**: no completadas con `deadline` &lt; hoy.
- **lead_time_days_avg**: promedio de días entre `created_at` y `completed_at` para fricciones completadas (cuando ambos existen).

## Fase 2 — KPIs por touchpoint y supervisión (modelo híbrido)

### Doble capa en touchpoints

- **Campo texto `kpi`** en touchpoint: referencia rápida / nota (taller).
- **Vínculos estructurados** `comercial_kpi_touchpoint`: KPIs maestros medibles asociados al touchpoint; sustitución con `PUT /api/comercial/touchpoints/{id}/kpis`.

### Modelo híbrido de KPIs

Cada KPI maestro (`comercial_kpis`) tiene campos de tracking:

| Campo | Valores posibles | Propósito |
|-------|-----------------|-----------|
| `tracking_mode` | `global_only`, `touchpoint_critical` | Define si el KPI solo se mide a nivel global o si requiere medición granular por touchpoint |
| `frequency` | `daily`, `weekly`, `biweekly`, `monthly` | Cadencia con la que se debe capturar la medición |
| `grace_days` | Entero (default 3) | Días de tolerancia tras vencimiento de frecuencia antes de marcar como vencida |

### KPIs críticos por touchpoint

Cuando un vínculo touchpoint-KPI se marca como **`is_critical = true`**, se activa la medición granular:

- **`target_value_local`** (float, opcional): meta específica para ese touchpoint, diferente de la meta global del KPI.
- **`responsable_id`** (int, opcional): responsable de captura diferente al owner del touchpoint.
- La medición se registra en **`comercial_tp_kpi_history`** (tabla separada de `comercial_kpi_history` global).

### Flujo de captura y seguimiento

1. El responsable captura valor + notas vía pestaña **KPIs Seguimiento** o modal directo.
2. El sistema calcula:
   - **`capture_status`**: `on_time` (dentro de frecuencia), `due` (dentro de gracia), `overdue` (pasada la gracia), `no_data` (nunca capturado).
   - **`pct_target`**: porcentaje de cumplimiento vs meta (local o global).
3. Umbrales de semáforo (rendimiento):
   - Verde: >= 90% de la meta.
   - Amarillo: >= 70% y < 90%.
   - Rojo: < 70% — **en riesgo**, se recomienda abrir o actualizar fricción vinculada.

### Responsable efectivo

Prioridad para determinar quién debe capturar:

1. `responsable_id` del vínculo touchpoint-KPI (si existe).
2. `responsable_id` del touchpoint.
3. `owner_id` del KPI maestro.

### Historial de mediciones globales (sin cambios)

- Cada registro en `comercial_kpi_history` con `value`, `recorded_at`, `notes`.
- `POST /api/comercial/kpis/{kpi_id}/history` actualiza también `current_value` del KPI maestro.
- La UI del Dashboard permite **ver historial** y **registrar** nuevas mediciones por KPI.

### Pestaña KPIs Seguimiento

Vista operativa dedicada con:
- Tarjetas de resumen: KPIs críticos totales, capturas al día, vencidas, en riesgo.
- Tabla con columnas: Fase, Touchpoint, KPI, Frecuencia, Actual, Meta, % Meta, Estado captura, Responsable, Acción.
- Filtros por fase, responsable, estado de captura, búsqueda libre.
- Acción rápida: **Capturar** (modal con valor + notas + autor + historial reciente).
- Acción: **Marcar crítico** (activa medición por touchpoint para un vínculo no crítico).

### API de seguimiento

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/comercial/touchpoints/{tp}/kpis/{kpi}/config` | PATCH | Configurar `is_critical`, `target_value_local`, `responsable_id` |
| `/api/comercial/touchpoints/{tp}/kpis/{kpi}/history` | GET | Historial de capturas de ese touchpoint-KPI |
| `/api/comercial/touchpoints/{tp}/kpis/{kpi}/history` | POST | Registrar nueva medición |
| `/api/comercial/kpis/seguimiento` | GET | Lista de KPIs críticos con estado de captura (filtrable por `responsable_id`) |
| `/api/comercial/kpis/compliance-summary` | GET | Resumen ejecutivo: disciplina de captura + rendimiento vs meta |

### Disparadores de fricción por KPI

Situaciones que justifican abrir o actualizar una fricción vinculada al KPI:

- `pct_target` < 70% (rendimiento bajo meta sostenido).
- `capture_status = overdue` (responsable no está capturando a tiempo).
- Tendencia negativa en últimas 3 capturas (valor decreciente en KPI creciente, o viceversa).

## Integridad y limpieza

- Al **eliminar** una fricción se borran vínculos `comercial_kpi_friction` y comentarios asociados.
- Al **eliminar** un touchpoint se borran vínculos `comercial_kpi_touchpoint`.

## Migraciones

- `migrate_comercial_v3.py`: añade `resolution_checklist` en `comercial_frictions`.
- `migrate_comercial_v4.py`: añade campos híbridos (`tracking_mode`, `frequency`, `grace_days`) en `comercial_kpis`, campos de config (`is_critical`, `target_value_local`, `responsable_id`) en `comercial_kpi_touchpoint`, y crea tabla `comercial_tp_kpi_history`.
- **Dirección de base de datos**
  - Por defecto se usa `DATABASE_URL` del archivo `.env` (cargado al importar `app.database`).
  - Si el host `db.*.supabase.co` no resuelve o falla por IPv4, en Supabase usa la **URI del pooler** (Project Settings → Database → Connection string), no la conexión directa.
  - Migrar solo contra SQLite local sin leer el `.env` remoto: `python3 migrate_comercial_v3.py --sqlite`.
  - Forzar una URI concreta (por ejemplo pegando el pooler): `python3 migrate_comercial_v3.py --database-url 'postgresql://...'`.
  - Variable `FORCE_SQLITE=1` hace que la app use `data/dashboard.db` aunque exista `DATABASE_URL` (útil para desarrollo local sin tocar Supabase).
