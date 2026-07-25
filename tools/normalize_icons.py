from pathlib import Path
import re

SOURCE = Path("web/assets/icons")
DEST = Path("web/assets/icons_generated")

BACKGROUND = "#f6f2e8"
ICON = "#222222"

COLOR_MAP = {
    "#000000": BACKGROUND,
    "#000": BACKGROUND,

    "#ffffff": ICON,
    "#fff": ICON,

    "#f7efd6": ICON,
    "#f5f1e8": ICON,
    "#faf4e8": ICON,
}

BACKGROUND_RE = re.compile(
    r'<path\b[^>]*d=["\']M0 0h512v512H0z["\'][^>]*>\s*</path>',
    re.IGNORECASE | re.DOTALL,
)

processed = 0

for svg in SOURCE.rglob("*.svg"):

    relative = svg.relative_to(SOURCE)
    output = DEST / relative

    output.parent.mkdir(parents=True, exist_ok=True)

    text = svg.read_text(encoding="utf-8")

    # Remove full-page background
    text = BACKGROUND_RE.sub("", text)

    # Swap colors
    for old, new in COLOR_MAP.items():
        text = re.sub(
            re.escape(old),
            new,
            text,
            flags=re.IGNORECASE,
        )

    output.write_text(text, encoding="utf-8")
    processed += 1

print(f"Generated {processed} SVGs in '{DEST}'")