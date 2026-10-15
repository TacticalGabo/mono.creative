# casestudy_JupiterDTF — imágenes y vídeos del case study

Página: `../../casestudy_JupiterDTF.html` · Origen: `mono.cases/cases_psd/` (copias optimizadas; los originales no se tocan).
Actualizado: 2026-10-15.

- El tamaño del hueco lo manda el frame de Figma (Desktop 1440 / Mobile 360), no el archivo:
  Figma FILL = `background-size:cover` / `object-fit:cover` centrado (ver `xlogClaude/figma-fill-imagenes.md`).
- Export: 2× el tamaño máximo en pantalla (página a 1920) sin pasar del original. Opacas → WebP q84 o JPG q85
  (el más ligero); con alfa → WebP q92; GIF grande → MP4 H.264 (crf 24-25, sin audio, faststart) + poster JPG
  del primer frame; GIF pequeño → WebP animado.
- Para reemplazar una pieza: mismo nombre de archivo. Las rutas viven en el bloque `9 · ASSETS` de la página.

| Archivo | Bloque | Peso | Tamaño |
|---|---|---|---|
| `01-hero-mobile.webp` | Hero (B01) · mobile | 64 KB | 1000×1056 |
| `01-hero.webp` | Hero (B01) · desktop | 98 KB | 1920×1080 |
| `04-research.webp` | 5.4 Research & Exploration (B10) | 43 KB | 1400×663 |
| `05-direction-left.webp` | 5.5 Final Direction (B07) | 15 KB | 1000×1400 |
| `05-direction-right.webp` | 5.5 Final Direction (B07) | 47 KB | 1400×943 |
| `06-ui-1.webp` | 5.6 UI Details (B10 modified) | 28 KB | 1000×988 |
| `06-ui-2.webp` | 5.6 UI Details (B10 modified) | 30 KB | 1000×988 |
| `07-after-1.webp` | 5.7 Before / After (B09) | 40 KB | 1000×986 |
| `07-after-2.webp` | 5.7 Before / After (B09) | 32 KB | 1000×986 |
| `07-before-1.webp` | 5.7 Before / After (B09) | 38 KB | 1000×986 |
| `07-before-2.webp` | 5.7 Before / After (B09) | 23 KB | 1000×986 |
| `10-closing-scene.webp` | 5.10 Outcome (B02) | 102 KB | 3840×2400 |
| `10-closing-screen.webp` | 5.10 Outcome (B02) | 89 KB | 1400×788 |
