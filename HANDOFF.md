# HANDOFF — estado del proyecto

Última actualización: **13 de julio de 2026** (ya en producción).

Documento para retomar el proyecto en otra sesión (o por otra persona). Lee también
[`CLAUDE.md`](CLAUDE.md) (las reglas del proyecto) y
[`docs/ESQUEMA.md`](docs/ESQUEMA.md) (el modelo de datos).

---

## Estado de producción (13 de julio de 2026)

El dueño activó el **plan Blaze** y hay un proyecto de Firebase real:
`encomiendas-mitierra`. Esto está desplegado y funcionando:

- **Sitio en vivo**: <https://encomiendas-mitierra--encomiendas-mitierra.us-central1.hosted.app>
  (Firebase App Hosting, desplegado desde código local con `firebase deploy --only apphosting`).
- **Firestore**: reglas e índices publicados. `contadores/folios` inicializado en `{ultimo: 0}`.
- **Storage**: reglas publicadas.
- **Auth**: Email/Password **y Google Sign-In** habilitados (el login ofrece ambos).
- **Primer admin**: `hoymismotv@gmail.com`, precreado con el Admin SDK y perfil
  `usuarios/{uid}` con `rol: admin`. Entra con el botón "Entrar con Google" usando
  ese correo — Firebase enlaza automáticamente por coincidencia de correo verificado,
  sin que nadie tenga que copiar un UID a mano.
- **Repo en GitHub**: `zoharmx/encomiendas-mitierra`, rama `master`, ya con todo el
  código (commit `aa02cc2`).
- **Logo oficial** incorporado en login, landing, header del panel, header del
  rastreo público, favicon (`src/app/icon.png`), apple-touch-icon, e imagen social
  Open Graph (`src/app/opengraph-image.png`). Los recortes fuente están en
  `public/logo.png` (completo) y `public/logo-emblema.png` (solo el globo);
  ambos se generaron a partir de `images/logo.png` (no versionado).

### Pendiente para cerrar del todo

1. **Dominio `encomiendasmitierra.com`.** Falta conectarlo: Firebase Console →
   App Hosting → backend `encomiendas-mitierra` → **Add custom domain**. La consola
   genera los registros DNS exactos (verificación + A/CNAME) que hay que dar de alta
   donde esté administrado el dominio. Este paso requiere acceso al panel del
   registrador/DNS, que Claude no tiene — debe hacerlo alguien con esas credenciales.
2. **Despliegue continuo (opcional).** Hoy el deploy es manual
   (`firebase deploy --only apphosting`). Para que se despliegue solo en cada
   `git push`, hay que conectar el repo de GitHub al backend desde Firebase Console
   → App Hosting → backend → conectar repositorio. Ese paso exige autorizar la
   GitHub App vía navegador (OAuth interactivo) — no se puede automatizar desde la
   CLI ni desde este agente.
3. Existe una app web de Firebase duplicada y sin usar
   (`encomiendas-mitierra`, distinta de `Encomiendas Mi Tierra - Web` que sí se usa
   en `.env.local`/`apphosting.yaml`): la creó automáticamente
   `apphosting:backends:create`. Es inofensiva, solo clutter en la lista de apps del
   proyecto; se puede borrar desde Firebase Console si molesta.

Los pendientes que ya existían (revisar la UI en un teléfono real, pantalla de
gestión de usuarios, verificar los teléfonos de contacto) siguen abajo, sin cambios.

---

## Qué está hecho

**La aplicación completa, según la especificación.** Todo lo que pedía el master
prompt está construido y verificado:

| | Estado |
|---|---|
| Landing (`/`) | ✅ folio + WhatsApp + teléfono |
| Rastreo público (`/tracking`) | ✅ timeline, historial, QR, compartir, `?folio=` auto-resuelto, skeleton, manejo de errores |
| Login del staff (`/login`) | ✅ Email/Password + cookie de sesión HttpOnly |
| Panel (`/admin`) | ✅ métricas, tabla filtrable, búsqueda por folio, paginación por cursor (25/pág) |
| Alta de envío (`/admin/nuevo`) | ✅ 4 secciones, validación en cliente, folio en grande + copiar/WhatsApp |
| Detalle (`/admin/envio/[folio]`) | ✅ datos internos, historial con notas internas, cambio de estatus |
| Reglas e índices | ✅ integrados del paquete original (+1 índice añadido) |
| Documentación | ✅ README, técnica, manual del operador, puesta en marcha |

### Verificado (no "debería funcionar" — se corrió)

```
npm run build                → limpio, sin errores ni warnings
npm run lint                 → limpio
npm run verificar:seguridad  → 3/3 invariantes
npm run probar               → 36/36 aserciones (emulador Firestore + Auth)
```

Las 36 aserciones cubren el Definition of Done completo:

- **Reglas**: un anónimo puede leer `tracking/{folio}` pero **no** puede listar la
  colección, **no** puede leer `envios/`, y un operador **no** puede meter un campo
  extra (un teléfono) en el espejo público ni auto-promoverse a admin.
- **Flujo**: crear envío → aparece en el rastreo público → cambiar estatus → el
  rastreo lo refleja con su nuevo evento. Y campo por campo: al espejo público
  **no** llegan teléfonos, direcciones, correos, costos, el nombre completo del
  destinatario ni las notas internas.

También se comprobó, contra el servidor de desarrollo real: las 4 rutas públicas
responden 200 sin errores de render, y `/admin` sin cookie redirige a
`/login?destino=/admin`.

---

## Lo que NO se verificó

**La interfaz no se ha visto renderizada en un navegador.** Se comprobó que las
páginas no revientan al renderizar (Next las renderiza también en el servidor), pero
nadie ha mirado el resultado: pueden quedar detalles visuales por pulir. En
particular, vale la pena revisar en un teléfono de verdad:

- el **timeline vertical** del rastreo (es la vista que más se usa: la abren desde
  WhatsApp);
- el **modal de compartir** con el QR;
- la **tabla de envíos** en móvil (se convierte en tarjetas por debajo de `md`).

Para verlo: `npm run emu` + `npm run sembrar` + `npm run dev`
(con `NEXT_PUBLIC_USE_EMULATORS=true` en `.env.local`).

---

## Decisiones que tomé y que conviene que sepas

**1. El sitio se publicó en Firebase App Hosting, no en Cloudflare Workers.**
La app tiene un middleware y una API route: necesita servidor. En plan Spark,
Firebase Hosting solo sirve archivos estáticos y el SSR de Next exige Cloud
Functions/Cloud Run (plan Blaze). El dueño activó Blaze deliberadamente, así que
**Firebase App Hosting** (el producto moderno de Firebase para frameworks
full-stack) es la opción usada — todo queda en un solo panel. El README original
recomendaba Cloudflare Workers para cuando NO había Blaze; si el proyecto alguna
vez vuelve al plan Spark, esa sigue siendo la alternativa documentada en
[`docs/PUESTA-EN-MARCHA.md`](docs/PUESTA-EN-MARCHA.md#5-publicar-el-sitio) (ese
documento aún no se actualizó con los pasos de App Hosting — pendiente).

**2. El middleware no verifica la firma de la cookie, solo que exista.**
No puede: corre en Edge y `firebase-admin` es un paquete de Node. La autorización
real está en `firestore.rules` + el guardia de `/admin/layout.tsx`. Una cookie
falsificada pasa el middleware y no consigue nada. Está razonado en
[`docs/TECNICA.md`](docs/TECNICA.md#autenticación-por-qué-está-partida-en-tres).

**3. Se agregó un índice compuesto** `(estatus, actualizadoEn desc)` a
`firestore.indexes.json`. El dashboard ordena por `actualizadoEn` (lo que se movió al
último, que es lo que le importa al operador) y el paquete original solo traía
`creadoEn`. Es aditivo: no se quitó nada.

**4. No hay subida de fotos del paquete.** `storage.rules` está desplegado y el campo
`paquete.fotoUrl` existe en el modelo, pero el formulario no sube nada (guarda `null`).
Se dejó fuera por simplicidad; la especificación no lo pedía.

---

## Pendientes reales (por orden de urgencia)

1. **Configurar el proyecto de Firebase real.** Ahora mismo `.env.local` tiene valores
   de marcador: la app compila pero no se conecta a nada. Sigue
   [`docs/PUESTA-EN-MARCHA.md`](docs/PUESTA-EN-MARCHA.md) — hay que crear el proyecto,
   publicar las reglas, crear el primer admin a mano e inicializar
   `contadores/folios` con `{ultimo: 0}`.

2. **Publicar el sitio** (Cloudflare Workers) y apuntar el dominio.

3. **Pantalla para gestionar usuarios del staff.** Hoy dar de alta a un operador se
   hace a mano en la consola de Firebase (crear la cuenta en Auth + crear
   `usuarios/{uid}`). Las reglas ya soportan que un admin lo haga desde la app; solo
   falta la interfaz. Es lo primero que va a pedir el negocio cuando contrate a
   alguien.

4. **Revisar la interfaz en un teléfono real** (ver arriba).

5. **Verificar los teléfonos del negocio.** Los que están en `src/lib/config.ts` los
   saqué de la landing vieja (`index.html`): +1 (831) 785-8487 y +1 (832) 866-0050.
   Son números de **Estados Unidos**, aunque la especificación describe el negocio como
   envíos "entre ciudades de México". Puede que la landing esté vieja, o que el negocio
   sea EE. UU. → México. **Confírmalo antes de publicar**: de esos números depende que
   el cliente pueda contactarlos cuando su folio no aparece.

---

## Trampas conocidas

- **`npm run build` necesita las `NEXT_PUBLIC_*` definidas**, aunque sean falsas: se
  incrustan en el bundle al compilar. En el servidor de despliegue tienen que estar
  cargadas *antes* del primer build, o habrá que recompilar.
- **`firebase-admin` se inicializa perezosamente** (dentro de la función, no al
  importar el módulo). Si lo mueves al ámbito del módulo, `next build` revienta al
  recolectar los datos de la ruta: en tiempo de compilación no hay credenciales.
- **El emulador de Firestore necesita Java.** Se instaló Microsoft OpenJDK 21 en esta
  máquina (`winget install Microsoft.OpenJDK.21`).
- **Los scripts de prueba son `.mts`, no `.ts`.** El `package.json` no es
  `type: module`, así que `tsx` compilaría un `.ts` como CommonJS y el top-level await
  fallaría.
- **No mezcles el `db` de la app con el cliente de `@firebase/rules-unit-testing`** en
  un script de prueba: son instancias distintas del SDK y Firestore rechaza las
  referencias cruzadas ("Expected first argument to collection() to be a
  CollectionReference..."). Por eso `flujo.mts` lee lo interno a través del contexto
  del emulador.
