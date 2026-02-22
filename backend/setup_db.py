#!/usr/bin/env python3
"""
HireFlow — Supabase Database Setup
===================================
Runs the schema and seed migrations against your Supabase PostgreSQL database.

Usage:
  python setup_db.py --db-url "postgresql://postgres.xxxx:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

Or set the environment variable:
  export DATABASE_URL="postgresql://..."
  python setup_db.py

Get your connection string from:
  Supabase Dashboard → Project Settings → Database → Connection string (URI)
  Use the "Transaction" pooler (port 6543) for migrations.
"""

import argparse
import os
import sys
from pathlib import Path


def run_migrations(db_url: str, migrations_dir: str):
    """Execute SQL migration files against the database."""
    try:
        import psycopg2
    except ImportError:
        print("Installing psycopg2-binary...")
        os.system(f"{sys.executable} -m pip install psycopg2-binary --quiet")
        import psycopg2

    migration_files = sorted(Path(migrations_dir).glob("*.sql"))
    if not migration_files:
        print(f"❌ No .sql files found in {migrations_dir}")
        sys.exit(1)

    print(f"📦 Found {len(migration_files)} migration(s)")
    print(f"🔗 Connecting to database...")

    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor()

        for sql_file in migration_files:
            print(f"\n▶ Running {sql_file.name}...")
            sql = sql_file.read_text()
            try:
                cur.execute(sql)
                print(f"  ✅ {sql_file.name} — success")
            except Exception as e:
                print(f"  ⚠️  {sql_file.name} — {e}")
                # Continue with other migrations

        # Verify tables were created
        cur.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        tables = [row[0] for row in cur.fetchall()]
        print(f"\n✅ Database ready! Tables: {', '.join(tables)}")

        # Count rows
        for table in ['users', 'jobs', 'applications', 'conversations', 'messages']:
            if table in tables:
                cur.execute(f"SELECT COUNT(*) FROM public.{table}")
                count = cur.fetchone()[0]
                print(f"   {table}: {count} rows")

        cur.close()
        conn.close()
        print("\n🎉 Database setup complete!")

    except psycopg2.OperationalError as e:
        print(f"\n❌ Connection failed: {e}")
        print("\nTroubleshooting:")
        print("  1. Check your connection string in Supabase Dashboard → Settings → Database")
        print("  2. Use the 'Transaction' pooler URI (port 6543)")
        print("  3. Make sure your IP is not blocked (Settings → Database → Network)")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Set up HireFlow database on Supabase")
    parser.add_argument("--db-url", help="PostgreSQL connection string (or set DATABASE_URL env var)")
    parser.add_argument("--migrations-dir", default="supabase/migrations", help="Path to migrations directory")
    args = parser.parse_args()

    db_url = args.db_url or os.environ.get("DATABASE_URL", "")
    if not db_url:
        print("❌ No database URL provided.")
        print("   Use: --db-url 'postgresql://...' or set DATABASE_URL env var")
        print("   Find it at: Supabase Dashboard → Settings → Database → Connection string")
        sys.exit(1)

    migrations_dir = args.migrations_dir
    if not Path(migrations_dir).exists():
        # Try relative to script location
        script_dir = Path(__file__).parent
        migrations_dir = str(script_dir / "supabase" / "migrations")

    run_migrations(db_url, migrations_dir)


if __name__ == "__main__":
    main()
