# casestudy_EnjinDarkMode — imágenes y vídeos del case study

Página: `../../casestudy_EnjinDarkMode.html` · Origen: `mono.cases/cases_psd/` (copias optimizadas; los originales no se tocan).
Actualizado: 2026-10-15.

- El tamaño del hueco lo manda el frame de Figma (Desktop 1440 / Mobile 360), no el archivo:
  Figma FILL = `background-size:cover` / `object-fit:cover` centrado (ver `xlogClaude/figma-fill-imagenes.md`).
- Export: 2× el tamaño máximo en pantalla (página a 1920) sin pasar del original. Opacas → WebP q84 o JPG q85
  (el más ligero); con alfa → WebP q92; GIF grande → MP4 H.264 (crf 24-25, sin audio, faststart) + poster JPG
  del primer frame; GIF pequeño → WebP animado.
- Para reemplazar una pieza: mismo nombre de archivo. Las rutas viven en el bloque `9 · ASSETS` de la página.

| Archivo | Bloque | Peso | Tamaño |
|---|---|---|---|
| `01-hero-mobile.webp` | Hero (B01) · mobile | 53 KB | 1000×1056 |
| `01-hero.webp` | Hero (B01) · desktop | 87 KB | 1920×1080 |
| `04-exploration-1.webp` | 2.4 Exploration (B08) | 54 KB | 1200×675 |
| `04-exploration-2.webp` | 2.4 Exploration (B08) | 71 KB | 1200×675 |
| `04-exploration-3.webp` | 2.4 Exploration (B08) | 68 KB | 1200×675 |
| `04-exploration-4.webp` | 2.4 Exploration (B08) | 50 KB | 1200×675 |
| `05-direction.webp` | 2.5 Final Direction (B10) | 55 KB | 1600×985 |
| `06-color.webp` | 2.6 Color System (B12) | 126 KB | 1600×985 |
| `09-closing-scene.webp` | 2.9 Outcome (B02) | 991 KB | 3840×2400 |
| `09-closing-screen.webp` | 2.9 Outcome (B02) | 36 KB | 1400×788 |
