from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "apps" / "api" / "src"))

from day_to_day_assistant_api.config import load_settings
from day_to_day_assistant_api.database import migrate


settings = load_settings()
migrate(ROOT / settings.database_path, ROOT / "apps" / "api" / "migrations")
print(f"Migrated {settings.database_path}")
