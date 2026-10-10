"""
Safe, non-destructive database schema migration script.
Usage:
    python -m scripts.migrate
    python -m scripts.migrate --dry-run
"""
import sys
import logging
from sqlalchemy import inspect as sa_inspect, text
from app.core.database import engine

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("migrate")


def check_and_migrate(dry_run: bool = False):
    logger.info("Connecting to database: %s (host: %s, database: %s)", engine.name, engine.url.host, engine.url.database)
    inspector = sa_inspect(engine)
    tables = inspector.get_table_names()
    logger.info("Discovered %d existing tables: %s", len(tables), tables)

    changes_needed = []

    # 1. Check relief_requests table
    if "relief_requests" in tables:
        existing_cols = {c["name"].lower() for c in inspector.get_columns("relief_requests")}
        expected_cols = {
            "latitude": "FLOAT NULL",
            "longitude": "FLOAT NULL",
            "phone": "VARCHAR(15) NULL",
            "request_source": "VARCHAR(30) NOT NULL DEFAULT 'victim'"
        }
        for col_name, col_def in expected_cols.items():
            if col_name not in existing_cols:
                changes_needed.append(("relief_requests", col_name, f"ALTER TABLE relief_requests ADD COLUMN {col_name} {col_def}"))

    # 2. Check volunteers table
    if "volunteers" in tables:
        existing_cols = {c["name"].lower() for c in inspector.get_columns("volunteers")}
        expected_cols = {
            "latitude": "FLOAT NULL",
            "longitude": "FLOAT NULL"
        }
        for col_name, col_def in expected_cols.items():
            if col_name not in existing_cols:
                changes_needed.append(("volunteers", col_name, f"ALTER TABLE volunteers ADD COLUMN {col_name} {col_def}"))

    if not changes_needed:
        logger.info("✅ Database schema is up-to-date. No column additions required.")
        return 0

    logger.info("Identified %d missing columns to add safely:", len(changes_needed))
    for table, col, sql in changes_needed:
        logger.info("  - Table '%s': add column '%s' -> SQL: %s", table, col, sql)

    if dry_run:
        logger.info("Dry-run mode: no changes applied.")
        return 0

    with engine.connect() as conn:
        for table, col, sql in changes_needed:
            logger.info("Executing: %s", sql)
            conn.execute(text(sql))
            conn.commit()
            logger.info("Added column '%s' to '%s' successfully.", col, table)

    logger.info("✅ All migrations completed safely and successfully.")
    return 0


if __name__ == "__main__":
    is_dry_run = "--dry-run" in sys.argv
    sys.exit(check_and_migrate(dry_run=is_dry_run))
