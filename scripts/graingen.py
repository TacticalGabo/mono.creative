"""Genera las texturas de grano en transparencia normal a partir de texture-grain.png.
uso: python -I scripts/graingen.py <carpeta del sitio>

fondo: UNA imagen sin mix-blend-mode que replica el overlay .42 sobre el fondo #101913 (exacto ahí):
       · píxeles oscuros de la textura (s < .5): negro con alfa .42(1-2s)  -> fondo x (1 - .42(1-2s))
       · píxeles claros  (s > .5): verde del fondo llevado a su máximo brillo con alfa .0456(2s-1)
         -> fondo x (1 + .42(2s-1)), mismo tono que el fondo, como hace overlay.
       GAIN_* multiplica la amplitud (1 = overlay exacto). DENS_* = fracción de píxeles con punto (los más
       alejados del gris medio, mitad claros y mitad oscuros); 1 = todos, como el overlay.
fondo light: mismo generador con DENS_LIGHT / GAIN_LIGHT / DARK_LIGHT -> texture-grain-light.png.
imágenes:    DENS_IMG / GAIN_IMG / DARK_IMG -> texture-grain-img.png (light y dark).
"""
import sys, os, numpy as np
from PIL import Image

DENS_DARK = .55   # 2026-10-21, elegido en grain-lab: densidad 55 %
GAIN_DARK = 2     # intensidad 2 (x2 la amplitud del overlay); puntos oscuros 1. Escala en CSS: 153.6px (0.6 px por punto)
DENS_LIGHT, GAIN_LIGHT, DARK_LIGHT = 1, 3.35, .15   # fondo en light, elegido en grain-lab 2026-10-21 (escala CSS 115.2px = 0.45 px)
DENS_IMG, GAIN_IMG, DARK_IMG = 1, 2.5, .15   # grano de imágenes, elegido en grain-lab 2026-10-21 (escala CSS 128px = 0.5 px)

root = sys.argv[1]; out = os.path.join(root, 'assets/shared')
tex = np.asarray(Image.open(os.path.join(out, 'texture-grain.png')).convert('L'), dtype=np.float64) / 255
BG = np.array([0x10, 0x19, 0x13]) / 255
O, K = .42, .0456                              # overlay .42; K = alfa por unidad de los claros
CLARO = np.clip(BG * (1 + O / K), 0, 1)        # verde del fondo llevado a su máximo brillo (163,255,194)

def puntos(d, g=1, gd=1):
    # solo el d de píxeles más lejos del gris medio (mitad claros, mitad oscuros), con la amplitud exacta del overlay
    lejos = np.abs(tex - .5); thr = np.quantile(lejos, 1 - d) if d < 1 else -1
    usa = lejos > thr
    claro = tex > .5
    A = np.where(claro, K * (2 * tex - 1), O * (1 - 2 * tex) * gd) * usa * g   # gd: peso de los puntos oscuros
    rgb = np.where(claro[..., None], CLARO[None, None, :], 0.0)
    return Image.fromarray(np.dstack([rgb * 255, np.clip(A, 0, 1) * 255]).round().astype(np.uint8), 'RGBA')

puntos(DENS_DARK, GAIN_DARK).save(os.path.join(out, 'texture-grain-dark.png'), optimize=True)
puntos(DENS_LIGHT, GAIN_LIGHT, DARK_LIGHT).save(os.path.join(out, 'texture-grain-light.png'), optimize=True)
# imágenes (light y dark): capa propia encima de cada imagen; los negros pesan menos porque overlay casi no oscurece lo claro
puntos(DENS_IMG, GAIN_IMG, DARK_IMG).save(os.path.join(out, 'texture-grain-img.png'), optimize=True)
print('ok')
