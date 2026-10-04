# casestudy_JupiterDTF — imágenes del case study

Página: `../casestudy_JupiterDTF.html`

Para **reemplazar** una imagen: guarda el archivo nuevo aquí con **el mismo nombre**.
No hay que tocar el HTML. Si un archivo no existe, su hueco muestra el color placeholder.

Si prefieres otro formato (`.png`, `.jpg`), cambia la extensión en un solo sitio:
el bloque `9 · ASSETS` al final del `<style>` de la página.

Tamaño recomendado = tamaño máximo en pantalla (página a 1920) × 2 para pantallas retina.
Formato sugerido: `.webp`, calidad 80.

| Archivo | Bloque | Proporción | Exportar a |
|---|---|---|---|
| `01-hero.webp` | 5.1 Hero (B01) | 1056 : 508 desktop · 312 : 306 mobile (recorte centrado) | 2752 × 1324 |
| `01-avatar-1.webp`, `01-avatar-2.webp` | 5.1 Hero, avatares | 1 : 1 | 100 × 100 |
| `04-research.webp` | 5.4 Research (B10) | 1056 : 611 desktop · 360 : 260 mobile | 2752 × 1592 |
| `05-direction-left.webp` | 5.5 Direction (B07), panel izq. (solo desktop) | 460 : 644 | 1228 × 1720 |
| `05-direction-right.webp` | 5.5 Direction, panel der. (fondo) | 956 : 644 desktop · 360 : 314 mobile | 2550 × 1718 |
| `05-direction-screen.webp` | 5.5 Direction, pantalla interior | 766 : 484 | 2044 × 1292 |
| `06-ui-1.webp`, `06-ui-2.webp` | 5.6 UI Details | 516 : 510 | 1352 × 1336 |
| `07-before-1.webp`, `07-after-1.webp`, `07-before-2.webp`, `07-after-2.webp` | 5.7 Before / After (B09) | 516 : 519 | 1352 × 1360 |
| `09-mobile.webp` | 5.9 Mobile (B14) | 1056 : 601 desktop · 312 : 260 mobile | 2752 × 1566 |
| `10-closing-scene.webp` | 5.10 Outcome (B02), escena a sangre | 1440 : 900 desktop · 360 : 400 mobile | 3840 × 2400 |
| `10-closing-screen.webp` | 5.10 Outcome, pantalla interior | 744 : 419 | 1984 × 1118 |

Las imágenes se pintan con `background-size: cover`: si la proporción mobile es
distinta, se recorta al centro. Si una pieza necesita versión mobile propia,
se añade un segundo archivo (`-m`) y una regla `@media (max-width:767.98px)` en el
mismo bloque ASSETS.
