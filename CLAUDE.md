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

# Deploy to Railway
railway up --detach

# Check deploy status
railway service status
```

## Architecture

**Backend:** FastAPI + SQLAlchemy 2.0 + Pydantic 2.x

- `app/main.py` — FastAPI app, CORS, health check, startup table creation, static file mount
- `app/database.py` — Dual-mode: Supabase PostgreSQL (if `DATABASE_URL` set) or SQLite fallback (`data/dashboard.db`)
- `app/models.py` — All ORM models (12 tables across 2 modules)
- `app/schemas.py` — Pydantic Create/Update schemas for validation
- `app/serialize.py` — ORM-to-dict conversion functions
- `app/routers/` — One file per resource, all follow identical CRUD pattern (GET list, GET by id, POST, PATCH, DELETE)

**Frontend:** Vanilla JS app shell with hash routing, no build step

- `static/index.html` — App shell with sidebar, topbar, hash router (`#/dashboard`, `#/gastos`, `#/escenarios`)
- `static/app.js` — React 18 (CDN) dashboard. Loaded via `fetch() + new Function()` to allow re-mounting. **Do not modify** unless changing dashboard logic.
- `static/gastos.js` — Expense configurator module. Exports `window.GastosModule.init(container)` / `.destroy()`
- `static/escenarios.js` — Scenario manager module. Exports `window.EscenariosModule.init(container)` / `.destroy()`

**Database:** 2 modules

- Dashboard: `deals`, `iniciativas`, `kpis_meta`, `semaforo`, `area_resumen`
- Gastos: `gastos_empleados`, `gastos_operativos`, `gastos_suscripciones`, `gastos_consultorias`, `gastos_financieros`, `escenarios`

## Key Conventions

**Short API field names for deals:** The deals API uses abbreviated keys (`a`=asesor, `c`=cuenta, `t`=trato, `i`=importe, `p`=pct_util, `u`=utilidad, `f`=fecha, `m`=mes, `tri`=trimestre). See `app/schemas.py` and `app/serialize.py` for mappings.

**CRUD router pattern:** Every router follows the same structure. To add a new resource: create model in `models.py`, schemas in `schemas.py`, serializer in `serialize.py`, router in `routers/`, register in `routers/__init__.py`.

**Frontend module pattern:** Each module exposes `init(container)` and `destroy()`. The shell calls these on route change. CSS is injected inline by each module (no shared stylesheet).

**app.js React re-execution:** The shell loads `app.js` via `fetch + new Function()` (not `<script src>`), because `app.js` uses top-level `const` declarations that would throw on re-execution. This is intentional.

**Bootstrap endpoints:** `/api/bootstrap` loads all dashboard data in one call. `/api/gastos/bootstrap` loads all expense data. Frontend uses these for initial page load, then PATCH/POST/DELETE for mutations.

**Design system:** Before creating any UI component, read `docs/design-system/tokens.md` for CSS variables and `docs/design-system/components.md` for component patterns (Perdoo-inspired light theme with dark navy sidebar).

**Calculations in frontend:** Aggregations (totals, percentages, KPIs) are computed client-side. The backend only persists individual rows.

**Escenarios snapshot:** Scenarios store a full JSON snapshot of all expense data at save time. No foreign keys to expense tables — snapshots are self-contained.

## Deploy

- **Railway** (primary): `railway.toml` config, Nixpacks builder, health check at `/health`
- **Render** (alternative): `render.yaml` blueprint
- **Supabase pooler URL format:** `postgresql://postgres.{ref}:{password}@aws-1-us-west-2.pooler.supabase.com:5432/postgres`
- Direct Supabase connection is IPv6 only — use the pooler for IPv4 environments (Railway, Render)
