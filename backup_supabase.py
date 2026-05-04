"""Dump all comercial_* tables from the configured DATABASE_URL to a JSON file in data/backups/.

Usage:
    railway run python3 backup_supabase.py
    DATABASE_URL='postgresql://...' python3 backup_supabase.py
"""
import json
import os
import sys
from datetime import datetime, date
from decimal import Decimal
from pathlib import Path

import psycopg2
import psycopg2.extras


def default_serializer(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, (bytes, bytearray)):
        return obj.decode("utf-8", errors="replace")
    raise TypeError(f"Type {type(obj)} not JSON serializable")


def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url or not db_url.startswith("postgres"):
        print("ERROR: DATABASE_URL not set or not Postgres. Got:", db_url[:30] if db_url else None)
        sys.exit(1)

    out_dir = Path("data/backups")
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = out_dir / f"supabase_pre_v19_{ts}.json"

    conn = psycopg2.connect(db_url)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute(
        """
        SELECT table_name FROM information_schema.tables
        WHERE table_schema='public' AND table_name LIKE 'comercial_%'
        ORDER BY table_name;
        """
    )
    tables = [r["table_name"] for r in cur.fetchall()]
    print(f"Found {len(tables)} comercial_* tables:", tables)

    backup = {"timestamp": ts, "database_host": db_url.split("@")[-1].split("/")[0], "tables": {}}
    total_rows = 0
    for t in tables:
        cur.execute(f'SELECT * FROM "{t}";')
        rows = [dict(r) for r in cur.fetchall()]
        backup["tables"][t] = rows
        total_rows += len(rows)
        print(f"  {t}: {len(rows)} rows")

    cur.close()
    conn.close()

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(backup, f, default=default_serializer, ensure_ascii=False, indent=2)

    size_kb = out_path.stat().st_size / 1024
    print(f"\nBackup written: {out_path} ({size_kb:.1f} KB, {total_rows} rows total)")


if __name__ == "__main__":
    main()
