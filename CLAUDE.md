# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run locally (SQLite, no DB setup needed)
uvicorn app.main:app --reload

# Run locally with Supabase
DATABASE_URL='postgresql://...' uvicorn app.main:app --reload

# Seed dashboard data
python3 seed.py              # clear + reload from data/initial.json
python3 seed.py --no-clear   # append only

# Seed expense data
python3 seed_gastos.py

# Seed commercial architecture data (55 touchpoints, 19 frictions, 6 phases)
python3 seed_comercial.py

# Migración comercial v3 (columna resolution_checklist en fricciones)
python3 migrate_comercial_v3.py

# Migración comercial v4 (KPI hybrid tracking + tp_kpi config + tp_kpi_history)
python3 migrate_comercial_v4.py

# Migración comercial v5 (tabla comercial_iniciativas)
python3 migrate_comercial_v5.py

# Migración comercial v6 (description, motor en iniciativas)
python3 migrate_comercial_v6.py

# Migración comercial v7 (priority, area, tipo en iniciativas + M:N links)
python3 migrate_comercial_v7.py

# Migración comercial v8 (tabla comercial_canvas_layout — Mapa Visual)
python3 migrate_comercial_v8.py

# Migración comercial v9 (tabla comercial_canvas_notes — notas libres)
python3 migrate_comercial_v9.py

# Migración comercial v10 (tabla comercial_touchpoint_flow — journey editable)
python3 migrate_comercial_v10.py

# Solo SQLite local (ignora DATABASE_URL del .env):
python3 migrate_comercial_v3.py --sqlite
# URI explícita (p. ej. pooler Supabase para IPv4):
python3 migrate_comercial_v3.py --database-url 'postgresql://...'

# Para Railway/Supabase: correr v5..v10 en orden ANTES del próximo deploy.
# Si no, el bootstrap del módulo comercial truena por relation does not exist.

# Deploy to Railway
railway up --detach

# Check deploy status
railway service status
```

## Architecture

**Backend:** FastAPI + SQLAlchemy 2.0 + Pydantic 2.x

- `app/main.py` — FastAPI app, CORS, health check, startup table creation, static file mount
- `app/database.py` — Dual-mode: Supabase PostgreSQL (if `DATABASE_URL` set) or SQLite fallback (`data/dashboard.db`)
- `app/models.py` — All ORM models (19 tables across 4 modules)
- `app/schemas.py` — Pydantic Create/Update schemas for validation
- `app/serialize.py` — ORM-to-dict conversion functions
- `app/routers/` — One file per resource, all follow identical CRUD pattern (GET list, GET by id, POST, PATCH, DELETE)

**Frontend:** Vanilla JS app shell with hash routing, no build step

- `static/index.html` — App shell with sidebar, topbar, hash router (`#/dashboard`, `#/gastos`, `#/escenarios`, `#/comercial`)
- `static/app.js` — React 18 (CDN) dashboard. Loaded via `fetch() + new Function()` to allow re-mounting. **Do not modify** unless changing dashboard logic.
- `static/gastos.js` — Expense configurator module. Exports `window.GastosModule.init(container)` / `.destroy()`
- `static/escenarios.js` — Scenario manager module. Exports `window.EscenariosModule.init(container)` / `.destroy()`
- `static/comercial.js` — Commercial architecture / strategic project manager module. Exports `window.ComercialModule.init(container)` / `.destroy()`

**Database:** 4 modules

- Dashboard: `deals`, `iniciativas`, `kpis_meta`, `semaforo`, `area_resumen`
- Gastos: `gastos_empleados`, `gastos_operativos`, `gastos_suscripciones`, `gastos_consultorias`, `gastos_financieros`, `escenarios`
- Comercial: `comercial_phases`, `comercial_touchpoints`, `comercial_frictions`, `comercial_trust_pillars`, `comercial_kpis`, `comercial_kpi_touchpoint`, `comercial_tp_kpi_history`, `comercial_kpi_friction`, `comercial_kpi_history`, `comercial_comments`, `comercial_activity_log`, `comercial_people`

## Key Conventions

**Short API field names for deals:** The deals API uses abbreviated keys (`a`=asesor, `c`=cuenta, `t`=trato, `i`=importe, `p`=pct_util, `u`=utilidad, `f`=fecha, `m`=mes, `tri`=trimestre). See `app/schemas.py` and `app/serialize.py` for mappings.

**CRUD router pattern:** Every router follows the same structure. To add a new resource: create model in `models.py`, schemas in `schemas.py`, serializer in `serialize.py`, router in `routers/`, register in `routers/__init__.py`.

**Frontend module pattern:** Each module exposes `init(container)` and `destroy()`. The shell calls these on route change. CSS is injected inline by each module (no shared stylesheet).

**app.js React re-execution:** The shell loads `app.js` via `fetch + new Function()` (not `<script src>`), because `app.js` uses top-level `const` declarations that would throw on re-execution. This is intentional.

**Bootstrap endpoints:** `/api/bootstrap` loads all dashboard data in one call. `/api/gastos/bootstrap` loads all expense data. `/api/comercial/bootstrap` loads all commercial architecture data. Frontend uses these for initial page load, then PATCH/POST/DELETE for mutations.

**Comercial module:** Operational system for commercial architecture. 6 tabs: Dashboard, Mapa de Proceso, Fricciones & Tareas, Linea de Tiempo, Equipo, KPIs Seguimiento. Hybrid KPI model: global KPIs + critical touchpoint-level measurement with configurable frequency. Full CRUD on frictions with 5-state workflow (pending→analysis→in_progress→validation→completed), responsable assignment, comments, and activity logging.

**Design system:** Before creating any UI component, read `docs/design-system/tokens.md` for CSS variables and `docs/design-system/components.md` for component patterns (Perdoo-inspired light theme with dark navy sidebar).

**Calculations in frontend:** Aggregations (totals, percentages, KPIs) are computed client-side. The backend only persists individual rows.

**Escenarios snapshot:** Scenarios store a full JSON snapshot of all expense data at save time. No foreign keys to expense tables — snapshots are self-contained.

## CRITICAL: Database Migration Rules

**SQLAlchemy `create_all` only creates NEW tables — it does NOT add columns to existing tables.** When modifying models:

1. **Every new column on an existing table MUST have a migration script.** Create or update `migrate_*.py` with the `ALTER TABLE ADD COLUMN` statement.
2. **Run the migration immediately** after modifying `models.py` — do NOT leave it for later.
3. **Always verify the change works** by hitting the affected API endpoint (e.g., `curl /api/comercial/bootstrap`) after the migration.
4. **For Postgres**, use `ADD COLUMN IF NOT EXISTS` to make migrations idempotent.
5. **For SQLite**, `ALTER TABLE ADD COLUMN` (no `IF NOT EXISTS` — catch the exception instead).
6. **Test the full cycle**: model change → migration → seed → API call → UI loads without errors.

**Never commit model changes without the corresponding migration.** This breaks the live Postgres database.

## Deploy

- **Railway** (primary): `railway.toml` config, Nixpacks builder, health check at `/health`
- **Render** (alternative): `render.yaml` blueprint
- **Supabase pooler URL format:** `postgresql://postgres.{ref}:{password}@aws-1-us-west-2.pooler.supabase.com:5432/postgres`
- Direct Supabase connection is IPv6 only — use the pooler for IPv4 environments (Railway, Render)

## gstack

Use the `/browse` skill from gstack for all web browsing. **Never** use `mcp__claude-in-chrome__*` tools.

Teammates can install gstack with:

```sh
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
```

### Available skills

`/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/setup-gbrain`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`, `/plan-devex-review`, `/devex-review`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`
