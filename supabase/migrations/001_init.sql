-- Ejecutar en Supabase → SQL Editor (una vez).
-- Alineado con app/models.py

CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY,
    asesor VARCHAR(200) NOT NULL,
    cuenta VARCHAR(400) NOT NULL,
    trato TEXT NOT NULL,
    importe DOUBLE PRECISION NOT NULL,
    pct_util DOUBLE PRECISION DEFAULT 0,
    utilidad DOUBLE PRECISION DEFAULT 0,
    fecha VARCHAR(20) NOT NULL,
    mes VARCHAR(10) NOT NULL,
    trimestre VARCHAR(10) DEFAULT 'Q1'
);

CREATE TABLE IF NOT EXISTS iniciativas (
    id SERIAL PRIMARY KEY,
    area VARCHAR(200) DEFAULT '',
    resp VARCHAR(200) DEFAULT '',
    ini TEXT NOT NULL,
    pri VARCHAR(20) DEFAULT '',
    est VARCHAR(80) DEFAULT '',
    av DOUBLE PRECISION DEFAULT 0,
    notas TEXT DEFAULT '',
    trimestre VARCHAR(10) DEFAULT 'Q1'
);

CREATE TABLE IF NOT EXISTS kpis_meta (
    id SERIAL PRIMARY KEY,
    kpi VARCHAR(200) NOT NULL,
    r25 VARCHAR(120) DEFAULT '',
    m26 VARCHAR(120) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS semaforo (
    id SERIAL PRIMARY KEY,
    kpi TEXT DEFAULT '',
    area VARCHAR(200) DEFAULT '',
    resp VARCHAR(200) DEFAULT '',
    descripcion TEXT DEFAULT '',
    meta TEXT DEFAULT '',
    ene TEXT DEFAULT '',
    feb TEXT DEFAULT '',
    mar TEXT DEFAULT '',
    est VARCHAR(80) DEFAULT '',
    tendencia VARCHAR(80) DEFAULT '',
    trimestre VARCHAR(10) DEFAULT 'Q1',
    diagnostico TEXT DEFAULT '',
    recomendacion TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS area_resumen (
    id SERIAL PRIMARY KEY,
    area VARCHAR(200) NOT NULL,
    resp VARCHAR(200) DEFAULT '',
    rol TEXT DEFAULT '',
    verdes INTEGER DEFAULT 0,
    amarillos INTEGER DEFAULT 0,
    rojos INTEGER DEFAULT 0,
    tendencia VARCHAR(200) DEFAULT '',
    trimestre VARCHAR(10) DEFAULT 'Q1',
    diagnostico TEXT DEFAULT '',
    recomendacion TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS ix_deals_id ON deals (id);
CREATE INDEX IF NOT EXISTS ix_iniciativas_id ON iniciativas (id);
CREATE INDEX IF NOT EXISTS ix_kpis_meta_id ON kpis_meta (id);
CREATE INDEX IF NOT EXISTS ix_semaforo_id ON semaforo (id);
CREATE INDEX IF NOT EXISTS ix_area_resumen_id ON area_resumen (id);
