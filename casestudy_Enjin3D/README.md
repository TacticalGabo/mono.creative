# casestudy_Enjin3D — imágenes y vídeos del case study

Página: `../casestudy_Enjin3D.html` · Origen: `mono.cases/cases_psd/` (copias optimizadas; los originales no se tocan).
Actualizado: 2026-10-15.

- El tamaño del hueco lo manda el frame de Figma (Desktop 1440 / Mobile 360), no el archivo:
  Figma FILL = `background-size:cover` / `object-fit:cover` centrado (ver `xlogClaude/figma-fill-imagenes.md`).
- Export: 2× el tamaño máximo en pantalla (página a 1920) sin pasar del original. Opacas → WebP q84 o JPG q85
  (el más ligero); con alfa → WebP q92; GIF grande → MP4 H.264 (crf 24-25, sin audio, faststart) + poster JPG
  del primer frame; GIF pequeño → WebP animado.
- Para reemplazar una pieza: mismo nombre de archivo. Las rutas viven en el bloque `9 · ASSETS` de la página.

| Archivo | Bloque | Peso | Tamaño |
|---|---|---|---|
| `01-hero-mobile.webp` | Hero (B01) · mobile | 94 KB | 1000×1056 |
| `01-hero.webp` | Hero (B01) · desktop | 128 KB | 1920×1080 |
| `03-styles-1.webp` | 11.6 Two Styles (B10 modified) | 19 KB | 1032×1020 |
| `03-styles-2.webp` | 11.6 Two Styles (B10 modified) | 22 KB | 1032×1020 |
| `05-multiverse-1.mp4` | 11.4 Multiverse Items (B08) | 3646 KB | 1920×1080 (vídeo, poster `05-multiverse-1-poster.jpg`) |
| `05-multiverse-2.mp4` | 11.4 Multiverse Items (B08) | 440 KB | 1240×1240 (vídeo, poster `05-multiverse-2-poster.jpg`) |
| `05-multiverse-3.mp4` | 11.4 Multiverse Items (B08) | 483 KB | 1000×1080 (vídeo, poster `05-multiverse-3-poster.jpg`) |
| `06-styles-1.mp4` | 11.6 Two Styles (B10 modified) | 100 KB | 700×692 (vídeo, poster `06-styles-1-poster.jpg`) |
| `06-styles-2.mp4` | 11.6 Two Styles (B10 modified) | 178 KB | 700×692 (vídeo, poster `06-styles-2-poster.jpg`) |
| `06-styles-3.mp4` | 11.6 Two Styles (B10 modified) | 114 KB | 700×692 (vídeo, poster `06-styles-3-poster.jpg`) |
| `06-styles-4.mp4` | 11.6 Two Styles (B10 modified) | 244 KB | 700×692 (vídeo, poster `06-styles-4-poster.jpg`) |
| `06-styles-5.mp4` | 11.6 Two Styles (B10 modified) | 327 KB | 700×692 (vídeo, poster `06-styles-5-poster.jpg`) |
| `06-styles-6.mp4` | 11.6 Two Styles (B10 modified) | 384 KB | 700×692 (vídeo, poster `06-styles-6-poster.jpg`) |
| `07-blobby-1.mp4` | 11.5 Blobby (B12) | 276 KB | 480×480 (vídeo, poster `07-blobby-1-poster.jpg`) |
| `07-blobby-2.webp` | 11.5 Blobby (B12) | 321 KB | 500×500 animado |
| `07-blobby-3.mp4` | 11.5 Blobby (B12) | 297 KB | 500×500 (vídeo, poster `07-blobby-3-poster.jpg`) |
| `07-blobby-4.mp4` | 11.5 Blobby (B12) | 270 KB | 480×416 (vídeo, poster `07-blobby-4-poster.jpg`) |
