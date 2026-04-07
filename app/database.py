import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine

# Carga variables desde .env en la raíz del proyecto (si existe).
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
from sqlalchemy.orm import declarative_base, sessionmaker


def _normalize_postgres_url(url: str) -> str:
    """Usa el driver psycopg2 explícito para SQLAlchemy."""
    url = url.strip()
    if url.startswith("postgres://"):
        rest = url[len("postgres://") :]
        return "postgresql+psycopg2://" + rest
    if url.startswith("postgresql://") and not url.startswith("postgresql+psycopg2://"):
        rest = url[len("postgresql://") :]
        return "postgresql+psycopg2://" + rest
    return url


def _ensure_ssl_query(url: str) -> str:
    """Supabase requiere SSL; añade sslmode=require si no viene en la URI."""
    if "sslmode=" in url:
        return url
    sep = "&" if "?" in url else "?"
    return f"{url}{sep}sslmode=require"


def _create_engine_from_env():
    raw = os.environ.get("DATABASE_URL", "").strip()
    if not raw:
        return None
    url = _ensure_ssl_query(_normalize_postgres_url(raw))
    return create_engine(url, pool_pre_ping=True)


def _create_sqlite_engine():
    base_dir = Path(__file__).resolve().parent.parent
    db_path = base_dir / "data" / "dashboard.db"
    db_path.parent.mkdir(parents=True, exist_ok=True)
    sqlite_url = f"sqlite:///{db_path}"
    return create_engine(sqlite_url, connect_args={"check_same_thread": False})


_engine = _create_engine_from_env() or _create_sqlite_engine()

engine = _engine
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def is_postgres() -> bool:
    """True si la app está usando DATABASE_URL (Postgres), False si SQLite local."""
    return bool(os.environ.get("DATABASE_URL", "").strip())
