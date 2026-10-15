# casestudy_GVRN — imágenes y vídeos del case study

Página: `../../casestudy_GVRN.html` · Origen: `mono.cases/cases_psd/` (copias optimizadas; los originales no se tocan).
Actualizado: 2026-10-15.

- El tamaño del hueco lo manda el frame de Figma (Desktop 1440 / Mobile 360), no el archivo:
  Figma FILL = `background-size:cover` / `object-fit:cover` centrado (ver `xlogClaude/figma-fill-imagenes.md`).
- Export: 2× el tamaño máximo en pantalla (página a 1920) sin pasar del original. Opacas → WebP q84 o JPG q85
  (el más ligero); con alfa → WebP q92; GIF grande → MP4 H.264 (crf 24-25, sin audio, faststart) + poster JPG
  del primer frame; GIF pequeño → WebP animado.
- Para reemplazar una pieza: mismo nombre de archivo. Las rutas viven en el bloque `9 · ASSETS` de la página.

| Archivo | Bloque | Peso | Tamaño |
|---|---|---|---|
| `01-hero-mobile.webp` | Hero (B01) · mobile | 38 KB | 1000×1056 |
| `01-hero.webp` | Hero (B01) · desktop | 68 KB | 1920×1080 |
| `04-exploration-1.webp` | 6.4 Exploration (B08) | 46 KB | 1200×675 |
| `04-exploration-2.webp` | 6.4 Exploration (B08) | 86 KB | 1200×675 |
| `04-exploration-3a.webp` | 6.4 Exploration (B08) | 43 KB | 717×1000 |
| `04-exploration-3b.webp` | 6.4 Exploration (B08) | 40 KB | 1000×1000 |
| `05-direction-1.webp` | 6.5 Final Direction (B11) | 45 KB | 1000×736 |
| `05-direction-2.webp` | 6.5 Final Direction (B11) | 34 KB | 1000×736 |
| `05-direction-wide.webp` | 6.5 Final Direction (B11) | 29 KB | 1400×663 |
