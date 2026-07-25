#!/usr/bin/env python3

from pathlib import Path
import re
import argparse

ROOT = Path("web/assets/icons")

parser = argparse.ArgumentParser()
parser.add_argument(
    "--dry-run",
    action="store_true",
    help="Show what would change without modifying files."
)

args = parser.parse_args()

processed = 0
modified = 0
backups = 0
backgrounds_removed = 0
fills_changed = 0
strokes_changed = 0
warnings = []


def remove_background(text):
    global backgrounds_removed

    patterns = [

        r'<rect[^>]*fill="#(?:000|000000)"[^>]*/?>',

        r'<path[^>]*d="M0 0h512v512H0z"[^>]*fill="#(?:000|000000)"[^>]*>\s*</path>',

        r'<path[^>]*d="M0 0h512v512H0z"[^>]*fill="#(?:000|000000)"[^>]*/?>',

    ]

    original = text

    for pattern in patterns:
        text = re.sub(
            pattern,
            "",
            text,
            flags=re.IGNORECASE
        )

    if text != original:
        backgrounds_removed += 1

    return text


def replace_colors(text):

    global fills_changed
    global strokes_changed

    fill_patterns = [
        r'fill="#000000"',
        r'fill="#000"',
        r"fill='#000000'",
        r"fill='#000'",
    ]

    stroke_patterns = [
        r'stroke="#000000"',
        r'stroke="#000"',
        r"stroke='#000000'",
        r"stroke='#000'",
    ]

    for pattern in fill_patterns:

        matches = len(
            re.findall(
                pattern,
                text,
                flags=re.IGNORECASE
            )
        )

        if matches:

            fills_changed += matches

            text = re.sub(
                pattern,
                'fill="currentColor"',
                text,
                flags=re.IGNORECASE
            )

    for pattern in stroke_patterns:

        matches = len(
            re.findall(
                pattern,
                text,
                flags=re.IGNORECASE
            )
        )

        if matches:

            strokes_changed += matches

            text = re.sub(
                pattern,
                'stroke="currentColor"',
                text,
                flags=re.IGNORECASE
            )

    return text


def remove_size(text):

    text = re.sub(
        r'\swidth="\d+"',
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r'\sheight="\d+"',
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r'\sstyle="[^"]*(width|height)[^"]*"',
        "",
        text,
        flags=re.IGNORECASE
    )

    return text


for svg in ROOT.rglob("*.svg"):

    processed += 1

    original = svg.read_text(
        encoding="utf-8"
    )

    cleaned = original

    cleaned = remove_background(cleaned)
    cleaned = replace_colors(cleaned)
    cleaned = remove_size(cleaned)

    if "#fff" in cleaned.lower() or "#ffffff" in cleaned.lower():
        warnings.append(svg)

    if cleaned != original:

        modified += 1

        if not args.dry_run:

            backup = svg.with_suffix(".svg.bak")

            if not backup.exists():

                backup.write_text(
                    original,
                    encoding="utf-8"
                )

                backups += 1

            svg.write_text(
                cleaned,
                encoding="utf-8"
            )


print()
print("========== SVG NORMALIZER ==========")
print(f"Processed            : {processed}")
print(f"Modified             : {modified}")
print(f"Backups created      : {backups}")
print(f"Backgrounds removed  : {backgrounds_removed}")
print(f"Fill changes         : {fills_changed}")
print(f"Stroke changes       : {strokes_changed}")
print(f"Needs manual review  : {len(warnings)}")

if warnings:

    print()
    print("SVGs containing white fills:")

    for file in warnings:
        print(" -", file)