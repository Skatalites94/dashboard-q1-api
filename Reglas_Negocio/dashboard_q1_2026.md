# Dashboard Q1 2026 — reglas y persistencia (actualización)

## Qué cambió

- Los datos que antes estaban solo en el HTML (`DEALS`, `INICIATIVAS`, `KPIS_META`, `SEMAFORO`) ahora viven en **SQLite** (`data/dashboard.db`) y se exponen por **API REST** (`/api/...`).
- El dashboard en el navegador **carga los datos con** `GET /api/bootstrap` y las ediciones **guardan con** `PATCH` sobre el recurso correspondiente (deals, iniciativas, kpis-meta, semaforo).
- La **semántica de negocio** del tablero (metas, semáforos, iniciativas, totales por mes/asesor) se calcula en el **frontend** a partir de los mismos campos que el HTML original; la base solo persiste filas.

## Implicaciones

- **Consistencia**: un cambio en un trato (deal) actualiza automáticamente resúmenes y vistas que dependen de ese listado al recargar o al actualizar el estado tras guardar.
- **Respaldo**: conviene copiar `data/dashboard.db` y/o `data/initial.json` en versiones.
- **Seed**: `python3 seed.py` **vacía** las tablas y vuelve a cargar desde `data/initial.json` (pérdida de cambios locales salvo que se exporten antes).

## Fuente de verdad inicial

- `data/initial.json` se genera a partir del mismo contenido que el archivo `Dashboard_Q1_2026_Interactivo_v2.html` (arrays constantes).

## Postgres (Supabase) — camino A

- Si existe la variable de entorno **`DATABASE_URL`** (URI de Supabase con contraseña real), la app usa **Postgres** en lugar de SQLite.
- Sin `DATABASE_URL`, comportamiento anterior: **`data/dashboard.db`**.
- Guía paso a paso de la URI, IPv4 y pooler: **`docs/SUPABASE_CONNECTION.md`**.
- Esquema SQL para pegar en Supabase: **`supabase/migrations/001_init.sql`**.
