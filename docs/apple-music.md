# Apple Music: configuración paso a paso

El pie muestra carátula, canción y artista de tu historial reciente, con enlace a
Apple Music. El texto es **Last played**: no es un indicador de reproducción en
directo. Sin configuración, historial disponible o respuesta válida de Apple, se oculta.

## 1. Guarda tu clave

Conserva el archivo `.p8` de MusicKit fuera del repositorio, en una ubicación
privada. Guarda también el Team ID y Key ID correspondientes a esa misma clave.
Necesitas una suscripción de Apple Music para autorizar tu historial.

## 2. Prepara la autorización local

En la raíz del proyecto, crea `.env.apple-music-setup.local` con tu editor:

```dotenv
APPLE_MUSIC_KEY_PATH="/ruta/absoluta/fuera/del/repositorio/AuthKey.p8"
APPLE_MUSIC_TEAM_ID=TU_TEAM_ID
APPLE_MUSIC_KEY_ID=TU_KEY_ID
```

Sustituye los ejemplos. Los dos IDs tienen 10 caracteres. La ruta debe ser absoluta;
no utilices `~`. `APPLE_MUSIC_KEY_PATH` solo se usa para esta herramienta local y
**no se configura en Vercel**.

Desde la raíz del proyecto, con Node 24:

```sh
node --version
chmod 600 .env.apple-music-setup.local
node --env-file=.env.apple-music-setup.local scripts/apple-music-setup.mjs
```

Abre la URL local impresa en una ventana privada. Pulsa **Authorize with Apple**,
inicia sesión en la ventana de Apple y acepta el acceso. La herramienta valida la
autorización y guarda `.apple-music/credentials.env` con permisos `0600`.
Cierra la ventana privada al terminar. Si pasan diez minutos, vuelve a ejecutar
el comando. La herramienta no imprime los tokens ni envía el `.p8` al navegador.

## 3. Obtén el Music User Token

Abre `.apple-music/credentials.env` en tu editor privado. Encontrarás:

```dotenv
APPLE_MUSIC_USER_TOKEN=valor_generado
```

Conserva ese valor como secreto. Para Vercel copiarás solo el valor, sin el nombre
ni el signo `=`. Si ya generaste un token con la versión anterior usando la misma
clave, puedes reutilizarlo mientras Apple lo acepte; ignora el developer token antiguo.

## 4. Añade estas cuatro variables en Vercel

Abre el proyecto de **mamuso.dev → Environment Variables** (según la interfaz,
puede estar dentro de Settings). Añade las variables a nivel de proyecto y
selecciona únicamente **Production**:

| Nombre exacto | Valor | Tipo |
| --- | --- | --- |
| `APPLE_MUSIC_PRIVATE_KEY` | Contenido completo del `.p8`, incluidos encabezado, pie y saltos de línea | Secret |
| `APPLE_MUSIC_TEAM_ID` | Tu Team ID de Apple Developer | Config |
| `APPLE_MUSIC_KEY_ID` | El Key ID correspondiente a ese `.p8` | Config |
| `APPLE_MUSIC_USER_TOKEN` | El valor obtenido en el paso 3 | Secret |

En la interfaz anterior, **Secret** puede aparecer como **Sensitive**. Los IDs
son identificadores; también puedes guardarlos como secretos si lo prefieres.
No añadas estas credenciales a Preview: esas versiones pueden ejecutar código
sin revisar.

En el campo de valor de `APPLE_MUSIC_PRIVATE_KEY`, pega el PEM original:

```text
-----BEGIN PRIVATE KEY-----
[contenido real de tu archivo]
-----END PRIVATE KEY-----
```

No pegues la ruta del archivo, no lo conviertas a base64 y no añadas comillas
externas en el dashboard. El ejemplo anterior es un marcador, no una clave válida.

**No necesitas `APPLE_MUSIC_DEVELOPER_TOKEN`.** El servidor lo genera automáticamente.
Si configuraste esa variable siguiendo la guía anterior, elimínala después de
configurar las cuatro nuevas y desplegar el código actualizado.

## 5. Despliega y comprueba

Despliega el código actualizado a producción después de guardar las variables.
Cambiar variables no modifica un despliegue existente.

Reproduce una canción en Apple Music y visita el pie de la web. El servidor
consulta el historial con caché de 60 segundos por instancia, y el navegador
actualiza cada dos minutos mientras la pestaña está visible. Apple puede tardar
más en reflejar actividad o no incluir algunas reproducciones.

`/api/music` devuelve solo `track` con nombre, artista, imagen y enlace. Si devuelve
`{"track":null}`, puede faltar configuración, Apple puede rechazar la autorización,
o no haber una canción utilizable. No compartas capturas de tus secretos para
investigar un problema.

## Desarrollo local (opcional)

Para activar el módulo también en tu ordenador, añade las mismas cuatro variables
a `.env.local`, preservando cualquier configuración existente. En un archivo dotenv,
la clave multilínea sí va entre comillas dobles:

```dotenv
APPLE_MUSIC_TEAM_ID=TU_TEAM_ID
APPLE_MUSIC_KEY_ID=TU_KEY_ID
APPLE_MUSIC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
[contenido real de tu archivo]
-----END PRIVATE KEY-----"
APPLE_MUSIC_USER_TOKEN=valor_generado
```

Ejecuta `chmod 600 .env.local` y reinicia `pnpm dev`. Este paso es opcional para
producción. El archivo de autorización del paso 2 no configura por sí solo la web.

## Renovación automática y seguridad

El servidor firma un developer token de diez minutos cada vez que necesita
actualizar el historial. No hay que renovarlo manualmente, programar un cron ni
volver a desplegar por su caducidad. La firma usa ES256, como requiere Apple.
El Music User Token es distinto: si Apple lo invalida o revocas el acceso, repite
los pasos 2–3, actualiza esa variable en Vercel y vuelve a desplegar.

La clave `.p8` ahora reside tanto en tu copia privada como en el entorno del servidor
de Vercel. No se envía a los visitantes. El código con acceso al entorno de producción
puede usarla: el tipo Secret oculta el valor en el dashboard, pero no impide que
código malicioso lo lea. Mantén revisados los cambios y restringido el acceso al proyecto.

`lib/apple-music.server.ts` usa `server-only`. La API consulta una URL fija de Apple,
no sigue redirecciones, no registra errores con credenciales, no guarda respuestas
autenticadas en la caché persistente de fetch y devuelve solo los campos públicos
validados. La caché en memoria limita peticiones por instancia; no es un límite global.
Las respuestas válidas se conservan **1 minuto** en memoria por instancia.
No hay caché en el CDN ni en el navegador para `/api/music`. Si falla Apple
(red, timeout, 401/403, 429, 5xx o datos inválidos), se borra la canción anterior
inmediatamente: no hay margen de quince minutos ni reutilización de datos antiguos.
La API devuelve un 503 genérico, `track: null` y `Retry-After: 15`; no expone
el motivo interno ni información de la cuenta. Un historial vacío devuelve 200
con `status: empty` y también elimina la canción anterior.

El navegador consulta al caducar la respuesta del servidor (como máximo cada
1 minuto mientras la pestaña está visible) y al volver a ella. `refreshAfterMs`
indica el tiempo restante de caché para no sumar otro minuto en el cliente. Ante fallo oculta el módulo y reintenta a los 15 segundos. Cada
petición tiene un timeout de 8 segundos en el navegador y de 5 segundos hacia
Apple. Se cancelan las peticiones al desmontar el módulo. La caché es local a cada
instancia y las consultas simultáneas se deduplican; un arranque en frío necesita
una respuesta válida de Apple. Estos tiempos limitan nuestra caché, no el retraso
con el que Apple actualiza su historial de reproducciones.

El navegador público no carga MusicKit: solo consulta `/api/music` y la imagen del CDN.

`.gitignore` excluye `.p8`, archivos de entorno y `.apple-music/`. No uses
`NEXT_PUBLIC_`, `next.config.js` ni `public/` para secretos. No pegues claves o tokens
en chats, logs, capturas ni herramientas online de JWT. El tema escuchado será público.

Para desactivar el módulo, elimina sus variables y redespliega; el resultado público
puede permanecer brevemente en caché. Si hay exposición de credenciales, revoca el
acceso o la clave afectada en Apple, reemplázala y actualiza las variables. Borrar un
secreto del repositorio no lo invalida.

## Si MusicKit rechaza la autorización después del consentimiento

`APPLE_LOGOUT_HTTP_403` corresponde al cierre de sesión que MusicKit intenta al
fallar; no identifica la causa original. No es necesario generar otra clave solo
por ese mensaje.

La herramienta usa `Referrer-Policy: strict-origin`: Apple necesita el origen de
la ventana inicial para establecer el canal de respuesta. `no-referrer` deja ese
origen vacío e impide ese intercambio en el flujo observado. El origen enviado
no incluye la ruta local de sesión ni sus parámetros. Si ejecutabas una versión
anterior, detén el proceso y reinicia el comando normal, sin `--compat`, para
aplicar esta corrección. La comparación en navegador confirmó origen vacío con
la política anterior y solo el origen local con la política corregida.

Para aislar un posible problema con la restricción opcional de origen, detén la
herramienta y prueba una vez el modo de compatibilidad:

```sh
node --env-file=.env.apple-music-setup.local scripts/apple-music-setup.mjs --compat
```

Este modo firma el token temporal del navegador con los campos mínimos de Apple,
sin el campo opcional `origin`. El token sigue caducando a los diez minutos. Quien
obtuviera ese token temporal podría usarlo desde otro origen hasta su caducidad;
por sí solo no permite acceder a tu historial sin el Music User Token. La clave
`.p8` no se envía al navegador. Se mantienen la CSP, comprobaciones de Host/Origin,
el servidor local y la validación con Apple antes de guardar el token de usuario.
Es una prueba de compatibilidad, no una solución confirmada a todos los errores
de MusicKit. No cambia la configuración ni las credenciales de producción.

## Referencias

- [Developer tokens de Apple](https://developer.apple.com/documentation/applemusicapi/generating-developer-tokens)
- [Autorización del usuario](https://developer.apple.com/documentation/applemusicapi/user-authentication-for-musickit)
- [Historial reciente](https://developer.apple.com/documentation/applemusicapi/get-v1-me-recent-played-tracks)
- [Variables Secret en Vercel](https://vercel.com/docs/environment-variables/sensitive-environment-variables)

Las pruebas automatizadas utilizan claves efímeras ficticias. La autorización real
requiere tu interacción local; guardar estas instrucciones no conecta tu cuenta.
