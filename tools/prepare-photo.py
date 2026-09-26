#!/usr/bin/env python3
"""
Prépare une photo pour le site : retire le bandeau de légende incrusté (s'il y en a un),
recadre au ratio voulu, puis génère les versions .webp et .jpeg optimisées.

    python tools/prepare-photo.py <source> <nom-de-sortie> [--ratio 0.75] [--width 600]
                                  [--no-crop-band] [--focus-x 0.5]

Exemple :
    python tools/prepare-photo.py "C:/.../photo.jpeg" plante-balisier

Le texte de légende doit vivre dans le HTML (<figcaption>), pas dans les pixels :
un nom de plante incrusté dans une image n'est pas indexable.
"""

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageStat

ROOT = Path(__file__).resolve().parent.parent


def detect_band(im, search_from=0.70, jump=40):
    """Hauteur du bandeau translucide en bas d'image, 0 si absent."""
    w, h = im.size
    prev = None
    best = 0
    for y in range(h - 1, int(h * search_from), -1):
        mean = sum(ImageStat.Stat(im.crop((0, y, w, y + 1))).mean) / 3
        if prev is not None and abs(mean - prev) > jump:
            best = h - y
        prev = mean
    return best


def crop_ratio(im, ratio, focus_x=0.5, focus_y=0.5):
    """Recadre au ratio largeur/hauteur demandé, centré sur le point d'intérêt."""
    w, h = im.size
    if w / h > ratio:                      # trop large → rogner les côtés
        new_w = int(round(h * ratio))
        left = max(0, min(w - new_w, int(focus_x * w - new_w / 2)))
        return im.crop((left, 0, left + new_w, h))
    new_h = int(round(w / ratio))          # trop haute → rogner en hauteur
    top = max(0, min(h - new_h, int(focus_y * h - new_h / 2)))
    return im.crop((0, top, w, top + new_h))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('source')
    ap.add_argument('name', help="nom de sortie sans extension, ex. plante-balisier")
    ap.add_argument('--ratio', type=float, default=0.75, help="largeur/hauteur (0.75 = portrait 3:4)")
    ap.add_argument('--width', type=int, default=600)
    ap.add_argument('--focus-x', type=float, default=0.5)
    ap.add_argument('--focus-y', type=float, default=0.5)
    ap.add_argument('--no-crop-band', action='store_true')
    ap.add_argument('--trim-bottom', type=float, default=0.0,
                    help="fraction de hauteur à rogner en bas avant recadrage (filigrane, etc.)")
    ap.add_argument('--quality', type=int, default=82)
    a = ap.parse_args()

    src = Path(a.source)
    if not src.exists():
        sys.exit(f"Introuvable : {src}")

    im = Image.open(src).convert('RGB')
    original = im.size

    band = 0 if a.no_crop_band else detect_band(im)
    if band:
        im = im.crop((0, 0, im.size[0], im.size[1] - band))

    if a.trim_bottom:
        w0, h0 = im.size
        im = im.crop((0, 0, w0, int(h0 * (1 - a.trim_bottom))))

    im = crop_ratio(im, a.ratio, a.focus_x, a.focus_y)
    height = int(round(a.width / a.ratio))
    im = im.resize((a.width, height), Image.LANCZOS)

    out_webp = ROOT / f"{a.name}.webp"
    out_jpeg = ROOT / f"{a.name}.jpeg"
    im.save(out_webp, 'WEBP', quality=a.quality, method=6)
    im.save(out_jpeg, 'JPEG', quality=a.quality, optimize=True, progressive=True)

    print(f"{src.name}")
    print(f"  original     {original[0]}x{original[1]}")
    if band:
        print(f"  bandeau      {band}px retirés en bas")
    if a.trim_bottom:
        print(f"  rognage      {a.trim_bottom:.0%} retirés en bas")
    print(f"  {out_webp.name:28s} {a.width}x{height}  {out_webp.stat().st_size / 1024:6.1f} Ko")
    print(f"  {out_jpeg.name:28s} {a.width}x{height}  {out_jpeg.stat().st_size / 1024:6.1f} Ko")


if __name__ == '__main__':
    main()
