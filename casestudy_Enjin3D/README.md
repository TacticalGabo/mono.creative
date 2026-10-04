# casestudy_Enjin3D — imágenes del case study

Página: `../casestudy_Enjin3D.html`

Para **reemplazar** una imagen: guarda el archivo nuevo aquí con **el mismo nombre**.
No hay que tocar el HTML. Si un archivo no existe, su hueco muestra el color placeholder.

Si prefieres otro formato (`.png`, `.jpg`), cambia la extensión en un solo sitio:
el bloque `9 · ASSETS` al final del `<style>` de la página.

Generadas (todas menos el hero) desde `RAW images/Eniin Gifs and animations/` con
`mono.creative Entries/content generator/Enjin 3D/make_assets.py` (fuente y recorte de cada una, ahí).
Las marcadas **anim.** son WebP animados (loop): el bloque las pinta como `background-image`, sin código extra.
Tamaño = el de la fuente, sin ampliar (las RAW son de 1080–4000 px). Formato `.webp`, q80 las fijas, q55–70 las animadas.

| Archivo | Bloque | Proporción | Exportado | Peso |
|---|---|---|---|---|
| `01-hero.webp` | 11.1 Hero (B01) | 1056 : 508 desktop · 312 : 306 mobile (recorte centrado) | ⬜ placeholder por ahora (pedido de Gabriel); la regla CSS ya apunta a este nombre | — |
| `01-avatar-1.webp` | 11.1 Hero, avatar (Gabriel) | 1 : 1 | ⬜ falta (100 × 100) | — |
| `04-exploration-1.webp` | 11.4 Multiverse, fila 1 · anim. | 704 : 396 desktop · 360 : 260 mobile | 1408 × 792 | 1.5 MB |
| `04-exploration-2.webp` | 11.4 Multiverse, fila 2 · anim. | 704 : 396 · 360 : 260 | 1408 × 792 | 811 KB |
| `04-exploration-3a.webp` | 11.4 Multiverse, fila 3 panel estrecho · anim. | 140 : 304 desktop · 72 : 260 mobile | 400 × 868 | 798 KB |
| `04-exploration-3b.webp` | 11.4 Multiverse, fila 3 panel ancho | 540 : 304 desktop · 276 : 260 mobile | 1408 × 792 | 33 KB |
| `05-card-1.webp` … `05-card-3.webp` | 11.5 Blobby (B12) | 711 : 400 desktop · 360 : 260 mobile | 1600 × 900 · 1846 × 1039 | 43–126 KB |
| `06-detail-1.webp`, `06-detail-2.webp` | 11.6 Two Styles (B10 modified) · anim. | 516 : 510 | 900 × 890 | 391 / 353 KB |
| `07-direction-1.webp`, `07-direction-2.webp` | 11.7 Degen (B11), 2-up | 516 : 510 | 1342 × 1326 | 121 / 96 KB |
| `07-direction-wide.webp` | 11.7 Degen, ancha | 1056 : 611 desktop · 360 : 260 mobile | 2752 × 1592 | 80 KB |
| `09-closing-scene.webp` | 11.9 Outcome (B02), escena a sangre (desenfocada 8 px) | 1440 : 900 desktop · 360 : 400 mobile | 3200 × 2000 | 68 KB |
| `09-closing-screen.webp` | 11.9 Outcome, pantalla interior | 744 : 419 | 1880 × 1059 | 48 KB |

Las imágenes se pintan con `background-size: cover`: si la proporción mobile es
distinta, se recorta al centro. Si una pieza necesita versión mobile propia,
se añade un segundo archivo (`-m`) y una regla `@media (max-width:767.98px)` en el
mismo bloque ASSETS.
