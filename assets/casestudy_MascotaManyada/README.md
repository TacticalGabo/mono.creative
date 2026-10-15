# casestudy_MascotaManyada — imágenes y vídeos del case study

Página: `../../casestudy_MascotaManyada.html` · Origen: `mono.cases/cases_psd/` (copias optimizadas; los originales no se tocan).
Actualizado: 2026-10-15.

- El tamaño del hueco lo manda el frame de Figma (Desktop 1440 / Mobile 360), no el archivo:
  Figma FILL = `background-size:cover` / `object-fit:cover` centrado (ver `xlogClaude/figma-fill-imagenes.md`).
- Export: 2× el tamaño máximo en pantalla (página a 1920) sin pasar del original. Opacas → WebP q84 o JPG q85
  (el más ligero); con alfa → WebP q92; GIF grande → MP4 H.264 (crf 24-25, sin audio, faststart) + poster JPG
  del primer frame; GIF pequeño → WebP animado.
- Para reemplazar una pieza: mismo nombre de archivo. Las rutas viven en el bloque `9 · ASSETS` de la página.

| Archivo | Bloque | Peso | Tamaño |
|---|---|---|---|
| `01-hero-mobile.webp` | Hero (B01) · mobile | 116 KB | 1000×1056 |
| `01-hero.webp` | Hero (B01) · desktop | 324 KB | 1920×1080 |
| `04-exploration-1.webp` | 1.4 Exploration (B16) | 88 KB | 1000×1000 |
| `04-exploration-2.webp` | 1.4 Exploration (B16) | 236 KB | 1000×1000 |
| `04-exploration-wide.webp` | 1.4 Exploration (B16) | 130 KB | 1400×663 |
| `06-card-1.webp` | 1.6 Final Direction (B12) | 67 KB | 1200×675 |
| `06-card-2.webp` | 1.6 Final Direction (B12) | 208 KB | 1200×675 |
| `06-card-3.webp` | 1.6 Final Direction (B12) | 36 KB | 1200×675 |
| `09-closing-scene.webp` | 1.9 Closing Scene (B02) | 334 KB | 1920×1200 |
