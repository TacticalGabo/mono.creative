# casestudy_DegenAnimations — imágenes y vídeos del case study

Página: `../../casestudy_DegenAnimations.html` · Origen: `mono.cases/cases_psd/` (copias optimizadas; los originales no se tocan).
Actualizado: 2026-10-15.

- El tamaño del hueco lo manda el frame de Figma (Desktop 1440 / Mobile 360), no el archivo:
  Figma FILL = `background-size:cover` / `object-fit:cover` centrado (ver `xlogClaude/figma-fill-imagenes.md`).
- Export: 2× el tamaño máximo en pantalla (página a 1920) sin pasar del original. Opacas → WebP q84 o JPG q85
  (el más ligero); con alfa → WebP q92; GIF grande → MP4 H.264 (crf 24-25, sin audio, faststart) + poster JPG
  del primer frame; GIF pequeño → WebP animado.
- Para reemplazar una pieza: mismo nombre de archivo. Las rutas viven en el bloque `9 · ASSETS` de la página.

| Archivo | Bloque | Peso | Tamaño |
|---|---|---|---|
| `01-hero-mobile.webp` | Hero (B01) · mobile | 74 KB | 1000×1056 |
| `01-hero.webp` | Hero (B01) · desktop | 95 KB | 1920×1080 |
| `02-presence.mp4` | 11.4 Multiverse Items (B08) | 894 KB | 1080×756 (vídeo, poster `02-presence-poster.webp`) |
| `02-reach.mp4` | 11.4 Multiverse Items (B08) | 331 KB | 1000×710 (vídeo, poster `02-reach-poster.webp`) |
| `04-outcome-1.webp` | 12.7 Outcome (B02) | 155 KB | 1920×1164 |
| `04-outcome-2.mp4` | 12.7 Outcome (B02) | 560 KB | 1080×756 (vídeo, poster `04-outcome-2-poster.webp`) |
| `04-outcome-3.webp` | 12.7 Outcome (B02) | 91 KB | 1000×826 |
| `06-keyvisual.webp` | 11.4 Multiverse Items (B08) | 176 KB | 2204×1543 |
| `06-story.mp4` | 11.4 Multiverse Items (B08) | 2342 KB | 1920×1362 (vídeo, poster `06-story-poster.webp`) |
