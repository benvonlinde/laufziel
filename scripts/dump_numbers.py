#!/usr/bin/env python3
"""Read Laufziel 2026.numbers and emit data/seed.json.

Reads the "Läufe" table (Datum in column B, Distanz in column C),
emits a JSON array of {date, distanceKm} for every row that has a distance.
"""

import json
import sys
from datetime import date, datetime
from pathlib import Path

try:
    from numbers_parser import Document
except ImportError:
    print("ERR: numbers-parser not installed. Run: python3 -m pip install --user numbers-parser", file=sys.stderr)
    sys.exit(2)

DEFAULT_DOC = Path.home() / "Library/Mobile Documents/com~apple~Numbers/Documents/Laufziel 2026.numbers"
DEFAULT_OUT = Path(__file__).resolve().parent.parent / "data" / "seed.json"


def main():
    doc_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DOC
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUT

    if not doc_path.exists():
        print(f"ERR: Numbers file not found: {doc_path}", file=sys.stderr)
        sys.exit(1)

    doc = Document(str(doc_path))
    sheet = doc.sheets[0]
    table = next((t for t in sheet.tables if t.name == "Läufe"), None)
    if table is None:
        print("ERR: 'Läufe' table not found", file=sys.stderr)
        sys.exit(1)

    runs = []
    rows = table.rows()
    for r_idx, row in enumerate(rows):
        if r_idx == 0:
            continue
        date_cell = row[1].value if len(row) > 1 else None
        dist_cell = row[2].value if len(row) > 2 else None
        if dist_cell is None or date_cell is None:
            continue
        if isinstance(date_cell, datetime):
            iso = date_cell.date().isoformat()
        elif isinstance(date_cell, date):
            iso = date_cell.isoformat()
        else:
            continue
        try:
            km = float(dist_cell)
        except (TypeError, ValueError):
            continue
        runs.append({"date": iso, "distanceKm": km})

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(runs, indent=2, ensure_ascii=False) + "\n")
    js_path = out_path.with_suffix(".js")
    js_path.write_text("window.LAUFZIEL_SEED = " + json.dumps(runs, ensure_ascii=False) + ";\n")
    print(f"Wrote {len(runs)} runs to {out_path} and {js_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
