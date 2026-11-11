"""Mini biblioteca de graficacion sobre Pillow (sin matplotlib).

Coordenadas de datos -> pixeles, con supersampling para trazos suaves.
"""
from __future__ import annotations

import math

from PIL import Image, ImageDraw, ImageFont

SS = 3  # factor de supersampling
SCALE = 1.9  # escala tipografica global (px de lienzo -> pt en la pagina)
_FONT_CACHE = {}
_FONTS = {
    "normal": r"C:\Windows\Fonts\calibri.ttf",
    "bold": r"C:\Windows\Fonts\calibrib.ttf",
    "italic": r"C:\Windows\Fonts\calibrii.ttf",
    "serif": r"C:\Windows\Fonts\cambria.ttc",
}


def font(size, family="normal"):
    key = (int(size * SS * SCALE), family)
    if key not in _FONT_CACHE:
        _FONT_CACHE[key] = ImageFont.truetype(_FONTS.get(family, _FONTS["normal"]), key[0])
    return _FONT_CACHE[key]


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


class Fig:
    def __init__(self, w, h, bg="#ffffff"):
        self.w, self.h = w, h
        self.img = Image.new("RGB", (w * SS, h * SS), bg)
        self.d = ImageDraw.Draw(self.img)
        self.box = (60, 30, w - 20, h - 45)  # l, t, r, b
        self.xlim = (0, 1)
        self.ylim = (0, 1)

    # ------------------------------------------------------------------
    def axes(self, xlim, ylim, box=None, xlabel="", ylabel="", title="",
             xticks=None, yticks=None, grid=True, tickfmt="{:.2g}"):
        if box:
            self.box = box
        self.xlim, self.ylim = xlim, ylim
        l, t, r, b = self.box
        if grid:
            for xv in (xticks or []):
                self._dashed([(xv, ylim[0]), (xv, ylim[1])], "#ececec", 1)
            for yv in (yticks or []):
                self._dashed([(xlim[0], yv), (xlim[1], yv)], "#ececec", 1)
        self.d.rectangle([l * SS, t * SS, r * SS, b * SS], outline=(40, 40, 40), width=SS)
        for xv in (xticks or []):
            px = self.px(xv)
            self.d.line([px * SS, b * SS, px * SS, (b + 4) * SS], fill=(40, 40, 40), width=SS)
            self.text(px, (b + 6), tickfmt.format(xv), size=9, anchor="mt", color="#333333")
        for yv in (yticks or []):
            py = self.py(yv)
            self.d.line([(l - 4) * SS, py * SS, l * SS, py * SS], fill=(40, 40, 40), width=SS)
            self.text((l - 6), py, tickfmt.format(yv), size=9, anchor="rm", color="#333333")
        if xlabel:
            self.text((l + r) / 2, b + 20, xlabel, size=11, anchor="mt", color="#111111")
        if ylabel:
            self.text(l - 22 * SCALE - 12, (t + b) / 2, ylabel, size=11, anchor="mm", color="#111111", rotate=90)
        if title:
            self.text((l + r) / 2, t - 26, title, size=12, anchor="mt", color="#111111")

    # ------------------------------------------------------------------
    def px(self, x):
        l, t, r, b = self.box
        return l + (x - self.xlim[0]) / (self.xlim[1] - self.xlim[0]) * (r - l)

    def py(self, y):
        l, t, r, b = self.box
        return b - (y - self.ylim[0]) / (self.ylim[1] - self.ylim[0]) * (b - t)

    def line(self, pts, color="#1f4e79", width=2, smooth=True):
        p = [(self.px(x) * SS, self.py(y) * SS) for x, y in pts]
        self.d.line(p, fill=hex2rgb(color), width=max(1, int(width * SS)), joint="curve")

    def _dashed(self, pts, color="#cccccc", width=1, dash=4):
        (x1, y1), (x2, y2) = pts
        P1 = (self.px(x1) * SS, self.py(y1) * SS)
        P2 = (self.px(x2) * SS, self.py(y2) * SS)
        L = math.dist(P1, P2)
        n = max(1, int(L / (dash * SS)))
        for i in range(0, n, 2):
            a = i / n
            b = min(1.0, (i + 1) / n)
            self.d.line([(P1[0] + (P2[0] - P1[0]) * a, P1[1] + (P2[1] - P1[1]) * a),
                         (P1[0] + (P2[0] - P1[0]) * b, P1[1] + (P2[1] - P1[1]) * b)],
                        fill=hex2rgb(color), width=max(1, int(width * SS)))

    def vline(self, x, color="#999999", width=1, dash=True):
        fn = self._dashed if dash else (lambda pts, c, w: self.line(pts, c, w))
        fn([(x, self.ylim[0]), (x, self.ylim[1])], color, width)

    def hline(self, y, color="#999999", width=1, dash=True):
        fn = self._dashed if dash else (lambda pts, c, w: self.line(pts, c, w))
        fn([(self.xlim[0], y), (self.xlim[1], y)], color, width)

    def arrow(self, x1, y1, x2, y2, color="#333333", width=1.4, head=6):
        P1 = (self.px(x1) * SS, self.py(y1) * SS)
        P2 = (self.px(x2) * SS, self.py(y2) * SS)
        if math.dist(P1, P2) < 1e-9:
            return
        ang = math.atan2(P2[1] - P1[1], P2[0] - P1[0])
        L = math.dist(P1, P2)
        hs = min(head * SS, L * 0.6)
        tip = P2
        base = (P2[0] - hs * math.cos(ang), P2[1] - hs * math.sin(ang))
        self.d.line([P1, base], fill=hex2rgb(color), width=max(1, int(width * SS)))
        w = hs * 0.42
        self.d.polygon([tip,
                        (base[0] + w * math.sin(ang), base[1] - w * math.cos(ang)),
                        (base[0] - w * math.sin(ang), base[1] + w * math.cos(ang))],
                       fill=hex2rgb(color))

    def dtext(self, x, y, s, **kw):
        """Texto en coordenadas de datos."""
        self.text(self.px(x), self.py(y), s, **kw)

    def arrow_px(self, x1, y1, x2, y2, color="#333333", width=1.4, head=8):
        """Flecha en pixeles de figura (para diagramas, no para datos)."""
        P1 = (x1 * SS, y1 * SS)
        P2 = (x2 * SS, y2 * SS)
        ang = math.atan2(P2[1] - P1[1], P2[0] - P1[0])
        L = math.dist(P1, P2)
        hs = min(head * SS, L * 0.5)
        base = (P2[0] - hs * math.cos(ang), P2[1] - hs * math.sin(ang))
        self.d.line([P1, base], fill=hex2rgb(color), width=max(1, int(width * SS)))
        w = hs * 0.42
        self.d.polygon([P2,
                        (base[0] + w * math.sin(ang), base[1] - w * math.cos(ang)),
                        (base[0] - w * math.sin(ang), base[1] + w * math.cos(ang))],
                       fill=hex2rgb(color))

    def marker(self, x, y, color="#c00000", r=4, ring=False):
        cx, cy = self.px(x) * SS, self.py(y) * SS
        rr = r * SS
        if ring:
            self.d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=hex2rgb(color), width=2 * SS)
        else:
            self.d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=hex2rgb(color),
                           outline=(255, 255, 255), width=SS)

    def rect(self, x0, y0, x1, y1, fill=None, outline="#333333", width=1, radius=0):
        b = [self.px(x0) * SS, self.py(y1) * SS, self.px(x1) * SS, self.py(y0) * SS]
        self.d.rounded_rectangle(b, radius=radius * SS,
                                 fill=hex2rgb(fill) if fill else None,
                                 outline=hex2rgb(outline), width=max(1, int(width * SS)))

    def box_mm(self, l, t, r, b, fill=None, outline="#333333", width=1, radius=6):
        """Rectangulo en milimetros (pixeles) de la figura."""
        self.d.rounded_rectangle([l * SS, t * SS, r * SS, b * SS], radius=radius * SS,
                                 fill=hex2rgb(fill) if fill else None,
                                 outline=hex2rgb(outline), width=max(1, int(width * SS)))

    def text(self, x, y, s, size=10, anchor="lt", color="#111111", rotate=0, family="normal"):
        if "\n" in s:
            for i, ln in enumerate(s.split("\n")):
                self.text(x, y + i * size * 1.28 * SCALE, ln, size=size, anchor=anchor[0] + "t",
                          color=color, rotate=rotate, family=family)
            return
        f = font(size, family)
        px, py = x * SS, y * SS
        if rotate:
            # capa con margen para que el texto rotado no se recorte
            pad = 700
            tmp = Image.new("RGBA", (int(self.w * SS) + 2 * pad, int(self.h * SS) + 2 * pad),
                            (0, 0, 0, 0))
            dtmp = ImageDraw.Draw(tmp)
            dtmp.text((px + pad, py + pad), s, font=f, fill=hex2rgb(color) + (255,), anchor=anchor)
            tmp = tmp.rotate(rotate, center=(px + pad, py + pad), resample=Image.BICUBIC)
            self.img.paste(tmp, (-pad, -pad), tmp)
            return
        self.d.text((px, py), s, font=f, fill=hex2rgb(color), anchor=anchor)

    def save(self, path):
        self.img.resize((self.w, self.h), Image.LANCZOS).save(path)
        return path
