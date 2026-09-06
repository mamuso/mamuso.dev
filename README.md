# feed.mamuso.net

```diff
- /* TODO: write something smart and funny for this README file */
- /* TODO: write something funny for this README file */
- /* TODO: write something useful for this README file */
- /* TODO: write something for this README file */
+ /* TODO: who reads this README anyway */
```

## Importar fotos

Usa Node.js 24 y pnpm 10.17.1. Después de actualizar el repositorio, ejecuta
`pnpm install` para instalar las dependencias del importador.

1. Ejecuta `pnpm photos` una vez para crear las carpetas locales.
2. Deja las fotos originales en `photo-inbox/` y vuelve a ejecutar `pnpm photos`.
   El importador corrige la orientación, genera las imágenes web y de galería,
   extrae el EXIF y una paleta de hasta ocho colores, y prepara los Markdown.
3. Abre `.photo-import/review.html` en el navegador para revisar miniaturas,
   paletas, fechas y enlaces a los borradores y metadatos.
4. Ejecuta `pnpm photos --review` en un terminal para completar títulos, slugs y
   fechas. También puedes editar `.photo-import/<ID>/draft.md` directamente y
   añadir un texto debajo del frontmatter. Ejecuta `pnpm photos` para actualizar
   la vista de revisión después de editar.
5. Ejecuta `pnpm photos --publish ID` para incorporar una foto al contenido, o
   `pnpm photos --publish all` para incorporar todos los borradores completos.
   Esto actualiza las imágenes y los Markdown en `content/`, copia los assets y
   regenera el feed. No hace commit, push ni despliegue. Los borradores
   incompletos dan error, pero los demás pueden publicarse.

Si falta la fecha de captura, tendrás que introducirla en formato `YYYY-MM-DD`.
Los originales no se mueven ni se borran. `photo-inbox/` y `.photo-import/` son
carpetas locales ignoradas por Git y no se copian al sitio. Conserva
`.photo-import/`: guarda tus ediciones y el registro de fotos importadas.

Puedes repetir `pnpm photos` para reintentar errores sin duplicar archivos
idénticos ni perder las ediciones de los borradores. No importes todo el archivo
antiguo de originales sin revisarlo: el nuevo registro no identifica
retroactivamente las fotos ya publicadas.

Se aceptan JPEG, PNG, WebP, AVIF y TIFF. HEIC/HEIF dependen del soporte de la
instalación de Sharp; si fallan, exporta a JPEG conservando los metadatos. No se
procesan RAW ni subcarpetas del inbox.

Para ejecutar las pruebas del importador:

```bash
pnpm photos:test
```

Más detalles sobre metadatos, recuperación de errores y publicación en
[la guía de importación de fotos](docs/photo-import.md).
