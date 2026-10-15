# casestudy_PanamaConventionCenter — imágenes y vídeos del case study

Página: `../../casestudy_PanamaConventionCenter.html` · Origen: `mono.cases/cases_psd/` (copias optimizadas; los originales no se tocan).
Actualizado: 2026-10-15.

- El tamaño del hueco lo manda el frame de Figma (Desktop 1440 / Mobile 360), no el archivo:
  Figma FILL = `background-size:cover` / `object-fit:cover` centrado (ver `xlogClaude/figma-fill-imagenes.md`).
- Export: 2× el tamaño máximo en pantalla (página a 1920) sin pasar del original. Opacas → WebP q84 o JPG q85
  (el más ligero); con alfa → WebP q92; GIF grande → MP4 H.264 (crf 24-25, sin audio, faststart) + poster JPG
  del primer frame; GIF pequeño → WebP animado.
- Para reemplazar una pieza: mismo nombre de archivo. Las rutas viven en el bloque `9 · ASSETS` de la página.

| Archivo | Bloque | Peso | Tamaño |
|---|---|---|---|
| `01-hero-mobile.webp` | Hero (B01) · mobile | 69 KB | 1000×1056 |
| `01-hero.webp` | Hero (B01) · desktop | 97 KB | 1920×1080 |
| `04-exploration-1.webp` | 8.4 Audience Paths (B08) | 42 KB | 1200×675 |
| `04-exploration-2.webp` | 8.4 Audience Paths (B08) | 35 KB | 1200×675 |
| `05-destination.webp` | 8.5 Final Direction (B11) | 56 KB | 1600×985 |
| `06-detail-1.webp` | 8.6 UI Details (B10 modified) | 41 KB | 1000×736 |
| `06-detail-2.webp` | 8.6 UI Details (B10 modified) | 56 KB | 1000×736 |
