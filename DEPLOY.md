# Desplegar en Render (URL pública)

## Antes de empezar

1. **Supabase:** en **SQL Editor**, ejecuta el archivo `supabase/migrations/001_init.sql` (crea las tablas).
2. **No subas `.env` a Git.** Contiene secretos; ya está en `.gitignore`.

---

## Paso 1 — Subir el código a GitHub

En Terminal (ajusta la ruta si hace falta):

```bash
cd "/Users/jeronimocelisrodriguez/Documents/Claude/Projects/Vision 2026/dashboard_q1_api"

git init
git add .
git status   # comprueba que NO aparezca .env
git commit -m "Dashboard Q1 API + Render"
```

En [github.com](https://github.com): **New repository** (vacío, sin README si ya tienes código local).

Luego (sustituye `TU_USUARIO` y `TU_REPO`):

```bash
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

Si GitHub pide login, usa su asistente de credenciales o un **Personal Access Token** como contraseña.

---

## Paso 2 — Crear el servicio en Render

1. Entra a [render.com](https://render.com) y **Sign up** (puedes usar “Sign up with GitHub”).
2. **Dashboard → New → Blueprint** (o **New Web Service** si prefieres manual).
3. **Blueprint:** conecta el mismo repo de GitHub y elige la rama `main`. Render detectará `render.yaml`.
4. Si usas **Web Service** manual en lugar de Blueprint:
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Runtime:** Python 3.11

---

## Paso 3 — Variable `DATABASE_URL` en Render

1. En tu servicio en Render: **Environment**.
2. **Add Environment Variable**
   - **Key:** `DATABASE_URL`
   - **Value:** la misma URI completa que usas en tu `.env` local (Supabase, con contraseña). Cópiala desde Supabase o desde tu `.env` (no la compartas en chats públicos).
3. **Save** y deja que vuelva a desplegar (**Manual Deploy → Deploy latest commit** si no arranca solo).

---

## Paso 4 — Probar

Abre la URL que Render muestra (ej. `https://dashboard-q1-api.onrender.com`).

- Debe cargar el dashboard en `/`
- API: `https://TU-URL.onrender.com/docs`

---

## Poblar datos la primera vez (opcional)

Desde tu Mac, con la misma URI en variable (no hace falta pegarla aquí):

```bash
export DATABASE_URL="postgresql://postgres:...@db....supabase.co:5432/postgres"
cd "/Users/jeronimocelisrodriguez/Documents/Claude/Projects/Vision 2026/dashboard_q1_api"
python3 seed.py
```

Eso escribe en **Supabase** (misma base que usa Render). Si `seed` vacía tablas, hazlo solo cuando quieras resetear datos.

---

## Si el deploy falla al conectar a Supabase

Render a veces usa **solo IPv4** y la conexión **directa** a `db.xxx.supabase.co:5432` falla. En Supabase, copia la URI del **Session pooler** o **Shared pooler** y úsala como `DATABASE_URL` en Render.

---

## Resumen

| Dónde | Qué guardas |
|--------|------------|
| **Tu Mac** | `.env` con `DATABASE_URL` (solo local) |
| **Render** | Misma variable `DATABASE_URL` en **Environment** |
| **GitHub** | Código **sin** `.env` |
