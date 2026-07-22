from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "apps" / "api" / "src"))

from day_to_day_assistant_api.server import main


if __name__ == "__main__":
    main()
