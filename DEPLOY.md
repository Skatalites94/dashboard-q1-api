# Desplegar en Railway

## Antes de empezar

1. **Supabase:** en **SQL Editor**, ejecuta `supabase/migrations/001_init.sql` (crea las tablas).
2. **No subas `.env` a Git.** Contiene secretos; ya está en `.gitignore`.

---

## Paso 1 — Crear el proyecto en Railway

1. Entra a [railway.app](https://railway.app) y regístrate con GitHub.
2. **New Project → Deploy from GitHub Repo**.
3. Selecciona el repo `Skatalites94/dashboard-q1-api`, rama `main`.
4. Railway detecta Python automáticamente (Nixpacks) y usa `railway.toml`.

---

## Paso 2 — Variable `DATABASE_URL` en Railway

1. En tu servicio: **Variables → New Variable**.
2. **Key:** `DATABASE_URL`
3. **Value:** tu URI de Supabase (la misma de `.env` local).
4. Click **Deploy** para que tome la variable.

---

## Paso 3 — Generar dominio público

1. En tu servicio: **Settings → Networking → Generate Domain**.
2. Railway asigna una URL tipo `dashboard-q1-api-production.up.railway.app`.

---

## Paso 4 — Probar

- Dashboard: `https://TU-URL.up.railway.app`
- API docs: `https://TU-URL.up.railway.app/docs`
- Health check: `https://TU-URL.up.railway.app/api/areas`

---

## Poblar datos (opcional)

Desde tu Mac:

```bash
export DATABASE_URL="postgresql://postgres:...@db....supabase.co:5432/postgres"
cd "/Users/jeronimocelisrodriguez/Documents/Claude/Projects/Vision 2026/dashboard_q1_api"
python3 seed.py
```

---

## Si falla la conexión a Supabase

Usa la URI del **Session pooler** de Supabase (puerto 5432 pooled) como `DATABASE_URL` en Railway.

---

## Resumen

| Dónde | Qué guardas |
|--------|------------|
| **Tu Mac** | `.env` con `DATABASE_URL` (solo local) |
| **Railway** | Misma variable `DATABASE_URL` en **Variables** |
| **GitHub** | Código **sin** `.env` |

---

## Alternativa: Render

Si prefieres Render, el archivo `render.yaml` sigue disponible en el repo. Sigue las instrucciones del Blueprint en render.com.
