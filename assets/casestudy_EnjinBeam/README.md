# casestudy_EnjinBeam — imágenes y vídeos del case study

Página: `../../casestudy_EnjinBeam.html` · Origen: `mono.cases/cases_psd/` (copias optimizadas; los originales no se tocan).
Actualizado: 2026-10-15.

- El tamaño del hueco lo manda el frame de Figma (Desktop 1440 / Mobile 360), no el archivo:
  Figma FILL = `background-size:cover` / `object-fit:cover` centrado (ver `xlogClaude/figma-fill-imagenes.md`).
- Export: 2× el tamaño máximo en pantalla (página a 1920) sin pasar del original. Opacas → WebP q84 o JPG q85
  (el más ligero); con alfa → WebP q92; GIF grande → MP4 H.264 (crf 24-25, sin audio, faststart) + poster JPG
  del primer frame; GIF pequeño → WebP animado.
- Para reemplazar una pieza: mismo nombre de archivo. Las rutas viven en el bloque `9 · ASSETS` de la página.

| Archivo | Bloque | Peso | Tamaño |
|---|---|---|---|
| `01-hero-mobile.webp` | Hero (B01) · mobile | 27 KB | 1000×1056 |
| `01-hero.webp` | Hero (B01) · desktop | 48 KB | 1920×1080 |
| `05-after.webp` | 3.5 Explorations / Options (B09) | 37 KB | 1000×986 |
| `05-before.webp` | 3.5 Explorations / Options (B09) | 60 KB | 1000×986 |
| `06-decision-wide.webp` | 3.6 Final Decision (B10) | 255 KB | 4382×2526 |
| `06-decision.mp4` | 3.6 Final Decision (B10) | 1037 KB | 1030×742 (vídeo, poster `06-decision-poster.webp`) |
| `07-access-left.webp` | 4.4 Exploration (B07) | 27 KB | 1547×1000 |
| `07-access-right.webp` | 4.4 Exploration (B07) | 25 KB | 809×1000 |
| `08-impact.mp4` | 3.8 Impact (B14) | 141 KB | 1280×720 (vídeo, poster `08-impact-poster.webp`) |
