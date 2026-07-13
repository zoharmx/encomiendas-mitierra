# Puesta en marcha, paso a paso

Guía para dejar el sistema funcionando en internet. No hace falta saber programar,
pero sí seguir los pasos en orden.

Calcula **una hora** la primera vez.

---

## 1. Crear el proyecto en Firebase

1. Entra a <https://console.firebase.google.com> con una cuenta de Google.
2. **Agregar proyecto** → nómbralo (por ejemplo `encomiendas-mi-tierra`).
3. Desactiva Google Analytics (no hace falta y pide más permisos).
4. Deja el **plan Spark** (gratuito). No metas tarjeta.

Dentro del proyecto, activa tres cosas:

| Servicio | Dónde | Qué elegir |
|---|---|---|
| **Firestore Database** | Compilación → Firestore | Modo **producción**. Ubicación: `nam5` (EE. UU.) o la más cercana. |
| **Authentication** | Compilación → Authentication | Método **Correo electrónico/contraseña** → habilitar. |
| **Storage** | Compilación → Storage | Modo producción. |

> La ubicación de Firestore **no se puede cambiar después**. Elígela con calma.

---

## 2. Conectar el proyecto con el código

En tu computadora, dentro de la carpeta del proyecto:

```bash
npm install -g firebase-tools     # una sola vez en la vida
firebase login
firebase use --add                # elige el proyecto que acabas de crear
```

### Publicar las reglas de seguridad

**Esto no es opcional.** Sin las reglas, la base queda abierta.

```bash
npm run reglas:deploy
```

Publica `firestore.rules` (quién puede leer y escribir qué), `storage.rules` (las
fotos) y `firestore.indexes.json` (los índices que necesita el panel para buscar).

Los índices tardan unos minutos en construirse. Se ve el avance en
Firestore → Índices.

---

## 3. Crear el primer administrador (el problema del huevo y la gallina)

Las reglas dicen: *"solo un admin puede crear usuarios"*. Como todavía no existe
ningún admin, **el primero se crea a mano**. Es a propósito: así nadie puede
registrarse solo y auto-promoverse.

**Paso 1 — crear la cuenta.**
Firebase Console → Authentication → **Agregar usuario**.
Escribe el correo y una contraseña. Se crea la cuenta y aparece en la lista.

**Paso 2 — copiar el UID.**
En la fila del usuario recién creado, copia el **UID de usuario** (una cadena larga
tipo `x7Kd9mP2...`).

**Paso 3 — darle permisos.**
Firebase Console → Firestore Database → **Iniciar colección**:

- ID de la colección: `usuarios`
- ID del documento: **pega el UID** que copiaste
- Campos:

| Campo | Tipo | Valor |
|---|---|---|
| `email` | string | el correo que usaste |
| `nombre` | string | el nombre de la persona |
| `rol` | string | `admin` |
| `activo` | boolean | `true` |

Guarda. **Esa persona ya puede entrar al panel** y, desde ahí, dar de alta al resto
del personal.

> `rol: operador` puede registrar envíos y cambiar estatus, pero no puede dar de alta
> a otros usuarios ni borrar envíos. `rol: admin` puede todo.

---

## 4. Inicializar el contador de folios

Los folios son consecutivos (`EMT-0001`, `EMT-0002`…), así que hay que decirle al
sistema por dónde empezar.

Firestore Database → **Iniciar colección**:

- ID de la colección: `contadores`
- ID del documento: `folios`
- Un campo: `ultimo`, tipo **number**, valor `0`

Listo. El primer envío será `EMT-0001-XXXX`.

---

## 5. Publicar el sitio

### Por qué no Firebase Hosting a secas

Esta app tiene una parte que corre en un servidor (el login del personal y el filtro
de `/admin`). Firebase Hosting en el plan gratuito **solo sirve archivos estáticos**;
para correr Next completo exige Cloud Functions, que necesitan el plan Blaze (con
tarjeta). Por eso el sitio se publica en otro lado — y las reglas y los datos siguen
viviendo en Firebase, que es lo que importa.

**Y nunca en Vercel Hobby**: su licencia gratuita prohíbe el uso comercial.

### Cloudflare Workers (gratis, permite uso comercial)

```bash
npm install --save-dev @opennextjs/cloudflare wrangler
npx opennextjs-cloudflare build
npx wrangler deploy
```

En el panel de Cloudflare, en **Settings → Variables and Secrets**, carga todas las
variables de tu `.env.local`:

- Las seis `NEXT_PUBLIC_FIREBASE_*` como **variables de texto**.
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` como
  **secretos** (`Secret`, no `Text`).

> Las `NEXT_PUBLIC_*` se incrustan al compilar: si las cargas *después* del primer
> build, hay que volver a compilar y desplegar.

Por último, apunta el dominio `encomiendasmitierra.com` al Worker desde
Cloudflare → Workers → tu worker → **Custom Domains**.

### Las credenciales de servidor (service account)

El login del personal necesita firmar la cookie de sesión, y para eso hacen falta
credenciales de administrador:

Firebase Console → ⚙️ Configuración del proyecto → **Cuentas de servicio** →
**Generar nueva clave privada**. Se descarga un `.json`. De ahí salen tres valores:

| Del `.json` | A la variable |
|---|---|
| `project_id` | `FIREBASE_PROJECT_ID` |
| `client_email` | `FIREBASE_CLIENT_EMAIL` |
| `private_key` | `FIREBASE_PRIVATE_KEY` |

⚠️ **Ese `.json` es la llave maestra del negocio.** Da acceso total a la base,
saltándose todas las reglas. No lo subas a Git, no lo mandes por WhatsApp, no lo
pegues en un chat. Si se te filtra: Cuentas de servicio → borra esa clave y genera
otra.

---

## 6. Probar antes de dársela a los clientes

Con el sitio ya publicado:

1. Entra a `/login` con el admin que creaste. Debe dejarte pasar.
2. Registra un envío de prueba. Debe darte un folio tipo `EMT-0001-K3F9`.
3. Abre `/tracking?folio=EMT-0001-K3F9` **en una ventana de incógnito** (sin sesión).
   Debe verse el envío, y **no** deben aparecer teléfonos, direcciones ni notas internas.
4. Cambia el estatus desde el panel y recarga el rastreo. Debe reflejarse.
5. En incógnito, intenta entrar a `/admin`. Debe rebotarte a `/login`.

Si los cinco pasos salen bien, el sistema está listo.

---

## Mantenimiento

**Dar de alta a alguien del personal.** Por ahora se hace igual que el primer admin
(pasos 3.1 a 3.3 de esta guía), con `rol: operador`. Una pantalla para gestionar
usuarios desde el panel queda pendiente (ver `HANDOFF.md`).

**Dar de baja a alguien.** En Firestore, en su documento `usuarios/{uid}`, pon
`activo: false`. Pierde el acceso al instante, sin borrar nada de su historial.

**¿Cuánto cuesta?** Nada, mientras no se pase de las cuotas gratuitas diarias:
50 000 lecturas y 20 000 escrituras. Con ~30 envíos al día se usa cerca del **2 %**.
El detalle del cálculo está en [`ESQUEMA.md`](ESQUEMA.md#4-costo-estimado-tier-gratuito-spark).
