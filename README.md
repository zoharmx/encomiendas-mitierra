# Encomiendas Mi Tierra — Tracking + Panel

Aplicación web de rastreo de paquetería con panel administrativo. El cambio de
estatus es **manual**: lo hace el personal desde el panel. No hay integraciones
con paqueterías externas ni GPS.

Diseñada para operar **completa dentro del tier gratuito de Firebase (plan Spark)**:
sin Cloud Functions, sin servicios de pago.

- **Rastreo público** (`/tracking`) — el cliente escribe su folio y ve dónde va su paquete.
- **Panel del personal** (`/admin`) — registrar envíos y mover su estatus.

## Documentación

| Documento | Para quién |
|---|---|
| [`docs/MANUAL-OPERADOR.md`](docs/MANUAL-OPERADOR.md) | **El personal del negocio.** Cómo usar el panel, sin tecnicismos. |
| [`docs/PUESTA-EN-MARCHA.md`](docs/PUESTA-EN-MARCHA.md) | Quien configure Firebase y publique el sitio, paso a paso. |
| [`docs/TECNICA.md`](docs/TECNICA.md) | Quien programe: arquitectura y decisiones de diseño. |
| [`docs/ESQUEMA.md`](docs/ESQUEMA.md) | El modelo de datos y por qué es así. **Léelo antes de tocar código.** |
| [`CLAUDE.md`](CLAUDE.md) / [`HANDOFF.md`](HANDOFF.md) | Contexto para retomar el proyecto en otra sesión. |

---

## Arranque rápido (desarrollo local)

Necesitas **Node.js 20+** y **Java 17+** (solo para el emulador de Firebase).

```bash
npm install
cp .env.example .env.local     # y llena los valores (ver más abajo)
```

### Opción A — con el emulador (recomendado para desarrollar)

No necesitas un proyecto de Firebase real ni credenciales: todo corre en tu máquina.

```bash
# Terminal 1 — levanta Firestore + Auth + Storage locales
npm run emu

# Terminal 2 — crea datos de ejemplo (4 envíos en distintos estatus)
npm run sembrar

# Terminal 3 — la app, apuntando al emulador
#   pon NEXT_PUBLIC_USE_EMULATORS=true en tu .env.local
npm run dev
```

Entra a <http://localhost:3000>. Para el panel, el usuario que siembra el script:

```
correo:     admin@mitierra.mx
contraseña: prueba1234
```

> ⚠️ El login del panel usa una cookie de sesión firmada por `firebase-admin`, así
> que **/login sí necesita credenciales reales de servicio** aunque uses el emulador
> para los datos. Si solo vas a trabajar en el rastreo público, no hace falta.

### Opción B — contra un proyecto de Firebase real

Sigue [`docs/PUESTA-EN-MARCHA.md`](docs/PUESTA-EN-MARCHA.md), pon
`NEXT_PUBLIC_USE_EMULATORS=false` y `npm run dev`.

---

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Compila para producción. Debe salir **sin errores ni warnings**. |
| `npm run lint` | ESLint. Debe salir limpio. |
| `npm run typecheck` | TypeScript en modo estricto, sin emitir. |
| `npm run probar` | **Levanta el emulador y corre todas las pruebas** (reglas + flujo completo). |
| `npm run verificar:seguridad` | Comprueba las 3 invariantes de seguridad (ver abajo). |
| `npm run emu` | Emuladores de Firebase (Firestore, Auth, Storage) + consola en :4000. |
| `npm run sembrar` | Datos de ejemplo en el emulador. |
| `npm run reglas:deploy` | Publica reglas e índices a Firebase. |

### Las pruebas

`npm run probar` verifica, contra el emulador, las dos cosas que importan:

**Las reglas de seguridad** (`scripts/pruebas/reglas.mjs`)
- ✅ Un anónimo **puede** leer `tracking/{folio}` si conoce el folio exacto.
- ❌ Un anónimo **no puede listar** `tracking/` (no puede cosechar folios ajenos).
- ❌ Un anónimo **no puede leer** nada de `envios/`.
- ❌ Un operador **no puede** meter un campo extra (un teléfono) en `tracking/`.
- ❌ Un operador **no puede** auto-promoverse a admin.

**El flujo completo** (`scripts/pruebas/flujo.mts`), con el mismo `src/lib/envios.ts`
que usa la app real: crear envío → aparece en el rastreo público → cambiar estatus
→ el rastreo lo refleja con su nuevo evento de historial. Y comprueba, campo por
campo, que al espejo público **nunca** llegan teléfonos, direcciones, correos,
costos, el nombre completo del destinatario ni las notas internas.

---

## Variables de entorno

Todas están documentadas en [`.env.example`](.env.example). En resumen:

| Variable | Secreta | Para qué |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` (6) | No | Config del SDK en el navegador. Son públicas por diseño; lo que protege los datos son las reglas, no estas claves. |
| `FIREBASE_PROJECT_ID` · `FIREBASE_CLIENT_EMAIL` · `FIREBASE_PRIVATE_KEY` | **Sí** | Service account. Solo la usa `/api/auth/session` para firmar la cookie del staff. **Da acceso total a la base: nunca la subas a Git ni la pongas en una variable `NEXT_PUBLIC_*`.** |
| `NEXT_PUBLIC_USE_EMULATORS` | No | `true` para desarrollar contra el emulador. |

> Las `NEXT_PUBLIC_*` se **incrustan en el JavaScript durante `npm run build`**.
> Tienen que estar definidas en el servidor de compilación, no solo en ejecución.

---

## Seguridad

Tres invariantes sostienen la privacidad de los clientes. `npm run verificar:seguridad`
las comprueba de forma automática:

1. **`firebase-admin` no sale de `src/app/api/`.** El Admin SDK se salta *todas* las
   reglas; si llegara al navegador, se filtraría la base entera.
2. **Ningún componente escribe a Firestore directamente.** Toda escritura pasa por
   `src/lib/envios.ts`, que es lo que garantiza que al espejo público solo lleguen
   campos seguros.
3. **El espejo público (`tracking/`) no contiene datos de contacto ni notas internas.**

Además: la cookie de sesión es `HttpOnly`, `SameSite=Lax`, `Secure` en producción, y
dura 5 días. No hay claves de terceros en el cliente. No se loggean datos personales.

### ¿Y el middleware no verifica la cookie de verdad?

No, y es a propósito. `middleware.ts` corre en el runtime **Edge**, donde el Admin SDK
de Node no puede ejecutarse: ahí solo se comprueba que la cookie *exista*, como filtro
barato. La autorización real está en dos capas que sí son infalsificables:

- **`firestore.rules`** — nadie lee ni escribe un envío sin ser staff activo.
- **`src/app/admin/layout.tsx`** — valida la sesión contra Firebase Auth y exige perfil
  de staff activo en `usuarios/{uid}`.

Una cookie falsificada pasa el middleware y **no obtiene absolutamente nada**: el panel
se queda vacío porque Firestore rechaza todas sus lecturas.

---

## Despliegue

⚠️ **Nunca Vercel Hobby**: su licencia gratuita prohíbe el uso comercial, y
encomiendasmitierra.com es un negocio.

Esta app **necesita un servidor** (tiene una API route y un middleware), así que
**Firebase Hosting a secas no basta**: en el plan Spark, Hosting solo sirve archivos
estáticos, y el SSR de Next exige Cloud Functions (plan Blaze, con tarjeta).

**Opción recomendada: Cloudflare Workers** — gratis, permite uso comercial, corre Next
completo. Los detalles paso a paso están en
[`docs/PUESTA-EN-MARCHA.md`](docs/PUESTA-EN-MARCHA.md#5-publicar-el-sitio).

Las reglas e índices de Firestore se despliegan aparte, y eso sí es Firebase:

```bash
npm run reglas:deploy
```

---

## Estructura

```
src/
├── app/
│   ├── page.tsx                  landing: folio + contacto
│   ├── tracking/page.tsx         rastreo público (el corazón del sistema)
│   ├── login/page.tsx            acceso del personal
│   ├── admin/
│   │   ├── layout.tsx            guardia de sesión + shell con nav
│   │   ├── page.tsx              dashboard: métricas + tabla de envíos
│   │   ├── nuevo/page.tsx        alta de envío
│   │   └── envio/[folio]/page.tsx  detalle + cambio de estatus
│   └── api/auth/session/route.ts  cookie de sesión (ÚNICO uso de firebase-admin)
├── components/{tracking,admin,ui}/
├── lib/
│   ├── envios.ts                 ← del paquete emt-firestore. TODAS las escrituras.
│   ├── consultas.ts              todas las lecturas del panel
│   ├── estatus.ts                transiciones válidas, colores, etiquetas
│   ├── config.ts                 branding: nombre, teléfonos, mensajes
│   ├── firebase.ts               SDK cliente
│   └── firebase-admin.ts         SDK admin (solo servidor)
├── types/index.ts                ← del paquete emt-firestore. Catálogo de estatus.
└── middleware.ts                 filtro de /admin/*
firestore.rules · storage.rules · firestore.indexes.json · firebase.json
```

### Re-marcar el producto ("Tracking Lite")

Ningún componente tiene el nombre, el teléfono o un color de la marca escrito dentro.
Para otro cliente basta con editar:

- `src/lib/config.ts` — nombre, tagline, teléfonos, mensajes de WhatsApp.
- `src/app/globals.css` — los dos colores del gradiente de acento (`--color-marca-*`).
- `src/types/index.ts` — el catálogo de estatus, si su flujo es distinto.
