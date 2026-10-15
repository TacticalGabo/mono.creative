# casestudy_Bedrock — imágenes y vídeos del case study

Página: `../../casestudy_Bedrock.html` · Origen: `mono.cases/cases_psd/` (copias optimizadas; los originales no se tocan).
Actualizado: 2026-10-15.

- El tamaño del hueco lo manda el frame de Figma (Desktop 1440 / Mobile 360), no el archivo:
  Figma FILL = `background-size:cover` / `object-fit:cover` centrado (ver `xlogClaude/figma-fill-imagenes.md`).
- Export: 2× el tamaño máximo en pantalla (página a 1920) sin pasar del original. Opacas → WebP q84 o JPG q85
  (el más ligero); con alfa → WebP q92; GIF grande → MP4 H.264 (crf 24-25, sin audio, faststart) + poster JPG
  del primer frame; GIF pequeño → WebP animado.
- Para reemplazar una pieza: mismo nombre de archivo. Las rutas viven en el bloque `9 · ASSETS` de la página.

| Archivo | Bloque | Peso | Tamaño |
|---|---|---|---|
| `01-hero-mobile.webp` | Hero (B01) · mobile | 62 KB | 1000×1056 |
| `01-hero.webp` | Hero (B01) · desktop | 100 KB | 1920×1080 |
| `05-direction-1.webp` | 4.5 Final Direction (B10) | 31 KB | 1000×736 |
| `05-direction-2.webp` | 4.5 Final Direction (B10) | 24 KB | 1000×736 |
| `05-direction-wide.webp` | 4.5 Final Direction (B10) | 75 KB | 1400×663 |
| `06-after-1.webp` | 4.6 Before / After (B09) | 126 KB | 1000×986 |
| `06-after-2.webp` | 4.6 Before / After (B09) | 69 KB | 1000×986 |
| `06-before-1.webp` | 4.6 Before / After (B09) | 135 KB | 1000×986 |
| `06-before-2.webp` | 4.6 Before / After (B09) | 39 KB | 1000×986 |
| `08-card-1.webp` | 4.8 Outcome (B02) | 54 KB | 1000×562 |
| `08-card-2.webp` | 4.8 Outcome (B02) | 21 KB | 1000×562 |
| `08-card-3.webp` | 4.8 Outcome (B02) | 11 KB | 1000×562 |
