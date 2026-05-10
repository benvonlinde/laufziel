#!/usr/bin/env python3
"""Render apple-touch-icon.png and a 32x32 favicon.png from the same chart-line motif.

Run from project root: python3 scripts/make_icon.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT_APPLE = ROOT / "apple-touch-icon.png"
OUT_FAVPNG = ROOT / "favicon-32.png"

BG       = (10, 10, 15, 255)     # var(--bg) #0a0a0f
ACCENT   = (58, 109, 255, 255)   # var(--accent) #3a6dff
RADIUS_R = 0.22                   # corner radius as fraction of size


def render(size: int) -> Image.Image:
    # Render at 4x then downsample for crisp antialiased edges.
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(s * RADIUS_R)
    d.rounded_rectangle((0, 0, s - 1, s - 1), radius=r, fill=BG)

    # Chart-line motif: 4 points scaled to size.
    # Original viewBox coords (0..100): (18,78) → (38,56) → (56,64) → (82,22)
    pts = [(18, 78), (38, 56), (56, 64), (82, 22)]
    pts_s = [(int(x / 100 * s), int(y / 100 * s)) for (x, y) in pts]
    line_w = int(s * 0.09)
    d.line(pts_s, fill=ACCENT, width=line_w, joint="curve")

    # Round caps: draw filled circles at each endpoint and joint.
    cap_r = line_w // 2
    for (x, y) in pts_s:
        d.ellipse((x - cap_r, y - cap_r, x + cap_r, y + cap_r), fill=ACCENT)

    # Endpoint highlight dot (slightly larger ring at the top-right).
    end_x, end_y = pts_s[-1]
    end_r = int(s * 0.06)
    d.ellipse((end_x - end_r, end_y - end_r, end_x + end_r, end_y + end_r), fill=ACCENT)

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    render(180).save(OUT_APPLE, "PNG")
    render(32).save(OUT_FAVPNG, "PNG")
    print(f"Wrote {OUT_APPLE}")
    print(f"Wrote {OUT_FAVPNG}")


if __name__ == "__main__":
    main()
