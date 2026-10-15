# casestudy_VariousBrands — imágenes y vídeos del case study

Página: `../../casestudy_VariousBrands.html` · Origen: `mono.cases/cases_psd/` (copias optimizadas; los originales no se tocan).
Actualizado: 2026-10-15.

- El tamaño del hueco lo manda el frame de Figma (Desktop 1440 / Mobile 360), no el archivo:
  Figma FILL = `background-size:cover` / `object-fit:cover` centrado (ver `xlogClaude/figma-fill-imagenes.md`).
- Export: 2× el tamaño máximo en pantalla (página a 1920) sin pasar del original. Opacas → WebP q84 o JPG q85
  (el más ligero); con alfa → WebP q92; GIF grande → MP4 H.264 (crf 24-25, sin audio, faststart) + poster JPG
  del primer frame; GIF pequeño → WebP animado.
- Para reemplazar una pieza: mismo nombre de archivo. Las rutas viven en el bloque `9 · ASSETS` de la página.

| Archivo | Bloque | Peso | Tamaño |
|---|---|---|---|
| `01-hero-mobile.webp` | Hero (B01) · mobile | 55 KB | 1000×1056 |
| `01-hero.webp` | Hero (B01) · desktop | 67 KB | 1920×1080 |
| `05-exploration-1.webp` | 10.5 Butrich (B11) | 31 KB | 1200×675 |
| `05-exploration-2.webp` | 10.5 Butrich (B11) | 36 KB | 1200×675 |
| `07-mobile.webp` | 10.7 Mobile (B14) | 36 KB | 1600×985 |
| `09-closing-screen.mp4` | 10.9 Outcome (B02) | 4659 KB | 1742×998 (vídeo, poster `09-closing-screen-poster.webp`) |
