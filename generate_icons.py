"""
One-off placeholder icon generator for Phase 7a (PWA installability).

Renders the Phosphor "flask" glyph (gold, matching the app's existing
#ffd76b accent) onto a rounded dark-navy background (#0d0f1a / #14172a,
matching style.css's existing theme), producing every PNG size the
manifest + apple-touch-icon need. Not part of the shipped app — this
script itself is not referenced by index.html/manifest; only its output
PNGs are. Safe to delete after running, or keep for regenerating icons
later if the theme colors ever change.

Requires: the rasterized flask_1024.png (already produced via
`convert` from the @phosphor-icons/core SVG) at /tmp/icons/flask_1024.png.
"""
from PIL import Image, ImageDraw
import os

SRC = "/tmp/icons/flask_1024.png"
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icons")
os.makedirs(OUT_DIR, exist_ok=True)

BG_TOP = (20, 23, 42)      # #14172a
BG_BOTTOM = (13, 15, 26)   # #0d0f1a
GOLD = (255, 215, 107)     # #ffd76b


def rounded_bg(size, radius_frac=0.22):
    """Dark navy square with a subtle vertical gradient + rounded corners."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    grad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    for y in range(size):
        t = y / max(1, size - 1)
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)
        for x in range(size):
            grad.putpixel((x, y), (r, g, b, 255))
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    radius = int(size * radius_frac)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    img.paste(grad, (0, 0), mask)
    return img


def make_icon(size, out_name, content_frac, square_bg=True, rounded=True):
    flask = Image.open(SRC).convert("RGBA")
    scaled = int(size * content_frac)
    flask = flask.resize((scaled, scaled), Image.LANCZOS)

    if square_bg:
        base = rounded_bg(size, radius_frac=0.22 if rounded else 0)
    else:
        base = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    off = (size - scaled) // 2
    base.alpha_composite(flask, (off, off))
    base.save(os.path.join(OUT_DIR, out_name))
    print(f"wrote {out_name} ({size}x{size}, content {content_frac*100:.0f}%)")


# Standard icons — content fills most of the square, corners rounded to
# match the app's own card/button rounding language.
make_icon(192, "icon-192.png", content_frac=0.62)
make_icon(512, "icon-512.png", content_frac=0.62)

# Maskable icon: Android can crop to a circle/squircle/rounded-square at
# will, so per the maskable-icon spec the important content must sit
# inside the centered ~80%-diameter "safe zone". No rounding baked in
# (the background must extend to the full edge — the OS does its own
# masking), and the flask itself is shrunk further so it survives even
# an aggressive circular crop.
make_icon(512, "icon-512-maskable.png", content_frac=0.42, rounded=False)

# Apple touch icon — iOS applies its own corner rounding automatically,
# and does not respect transparency well, so this is opaque, unrounded,
# edge-to-edge background (matching Apple's own HIG guidance).
make_icon(180, "apple-touch-icon.png", content_frac=0.62, rounded=False)

print("done")
