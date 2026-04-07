# Conexión a Supabase (URI / connection string)

## Qué es la URI

Es la **cadena de conexión** a Postgres. En Supabase aparece así (ejemplo de forma):

```text
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

- **`postgres`** → usuario por defecto del proyecto.
- **`[YOUR-PASSWORD]`** → debes **sustituirlo** por la contraseña del usuario de la base (la definiste al crear el proyecto; si no la recuerdas: **Project Settings → Database → Reset database password**).
- **`db....supabase.co`** → host de tu proyecto.
- **`5432`** → puerto de conexión **directa**.
- **`postgres`** al final → nombre de la base de datos.

Esa línea completa (ya con la contraseña real) es lo que guardas como variable de entorno **`DATABASE_URL`** en Render, Railway o en un archivo **`.env`** local (no subas `.env` a Git).

## Contraseñas con caracteres raros

Si la contraseña incluye `@`, `#`, `:`, `/`, etc., la URI se rompe. Solución: **codificar** la contraseña (URL encoding). En Python:

```python
from urllib.parse import quote_plus
quote_plus("tu contraseña aquí")
```

Sustituye en la URI la parte `postgres:LO_QUE_SALGA` por `postgres:CODIFICADO`.

## Aviso “Not IPv4 compatible”

En redes **solo IPv4** (muchos proveedores de hosting como Render entran por ahí), la conexión **directa** al host `db.xxx.supabase.co:5432` **puede fallar**.

Opciones:

1. En Supabase, en la misma zona de **Connection string**, usar el **Session pooler** o **Shared pooler** (suele mostrar otro host, a veces compatible con IPv4).
2. Contratar el **IPv4 add-on** en Supabase si tu plan lo permite.

Si desde Render no conecta, prueba primero la URI del **pooler** que te da el panel.

## SSL

La aplicación añade `sslmode=require` a la URI si no viene ya; Supabase exige conexión cifrada.

## Variable en tu máquina (probar antes de desplegar)

```bash
export DATABASE_URL="postgresql://postgres:TU_PASSWORD@db.tu-proyecto.supabase.co:5432/postgres"
cd /ruta/al/dashboard_q1_api
python3 -c "from app.database import engine; print(engine.url)"
python3 seed.py   # opcional: poblar tablas (vacía y reinserta si usas seed por defecto)
```

## Instalar Agent Skills de Supabase (opcional)

Es para que herramientas de IA tengan mejores instrucciones al trabajar con Supabase. No es obligatorio para que la app funcione.

```bash
npx skills add supabase/agent-skills
```

Sigue la documentación del propio paquete si tu entorno no usa `npx` igual.

## Tablas en Supabase

Crea el esquema con **`supabase/migrations/001_init.sql`** en el SQL Editor de Supabase, o deja que **`create_all`** al arrancar FastAPI las cree la primera vez (menos control que SQL explícito en producción).
