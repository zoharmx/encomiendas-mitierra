# CLAUDE.md

Contexto para trabajar en este repositorio.

## Qué es

Tracking de paquetería + panel administrativo para **Encomiendas Mi Tierra**
(encomiendasmitierra.com). Negocio pequeño de envíos: **~10–30 envíos/día**.
El cambio de estatus es **manual**, lo hace el personal. No hay integraciones con
paqueterías ni GPS.

Next.js 15 (App Router) · TypeScript estricto · Tailwind v4 · Firebase (Firestore,
Auth, Storage) · lucide-react · qrcode.

## Filosofía — léela antes de proponer nada

1. **Costo cero.** Todo cabe en el tier gratuito de Firebase (plan Spark). **Nada de
   Cloud Functions** (exigen plan Blaze). Nada de servicios de pago.
2. **El operador no es técnico.** Botones grandes, flujos de máximo 2 clics, textos
   en español de México sin jerga.
3. **Optimiza para simplicidad, no para escala.** A 30 envíos/día, la solución
   ingenua casi siempre gana. Si dudas entre dos opciones, elige la más simple.
4. **Esto será la base de "Tracking Lite"** (producto para otros clientes): branding,
   textos y catálogo de estatus viven en archivos de configuración, **nunca quemados
   en un componente**.

## Reglas no negociables

- **Los componentes NUNCA escriben a Firestore.** Toda escritura pasa por
  `src/lib/envios.ts`; toda lectura del panel, por `src/lib/consultas.ts`.
  Es lo que garantiza que al espejo público `tracking/` solo lleguen campos seguros.
- **`firebase-admin` solo en `src/app/api/`.** Nunca en un componente ni en el
  middleware (corre en Edge; el Admin SDK de Node no funciona ahí).
- **`notasInternas` y los datos de contacto jamás salen a rutas públicas.**
- **Ninguna API key de terceros en el cliente.** Las `NEXT_PUBLIC_FIREBASE_*` son las
  únicas variables públicas permitidas. El QR se genera localmente, no con una API.
- **Nunca configurar para Vercel Hobby**: su licencia prohíbe el uso comercial.

`npm run verificar:seguridad` comprueba las tres primeras automáticamente.

## Archivos que NO se reescriben

Vienen del paquete `emt-firestore` (la carpeta original quedó en
`emt-firestore-schema/`, como referencia). Son la fuente de verdad del modelo:

- `src/types/index.ts` — catálogo de estatus + tipos.
- `src/lib/envios.ts` — `crearEnvio`, `cambiarEstatus`, `consultarTracking`,
  `generarFolio`. Ya están implementados y son correctos.
- `firestore.rules`, `storage.rules`, `firestore.indexes.json`.
- `docs/ESQUEMA.md` — **léelo completo antes de escribir código.**

Se les puede **agregar** (así se añadió un índice compuesto que faltaba), pero no
reinterpretar su contenido.

## Comandos

```bash
npm run dev                  # desarrollo
npm run build                # debe salir SIN errores ni warnings
npm run lint                 # debe salir limpio
npm run probar               # emulador + pruebas de reglas y de flujo completo
npm run verificar:seguridad  # las 3 invariantes de seguridad
npm run emu                  # emuladores (necesita Java 17+)
npm run sembrar              # datos de ejemplo en el emulador
```

Al terminar cualquier cambio no trivial: **`npm run build` y `npm run probar` deben
pasar**.

## Estructura

```
src/app/          rutas: / · /tracking · /login · /admin/* · /api/auth/session
src/components/   tracking/ · admin/ · ui/ (componentes propios, sin librería)
src/lib/          envios · consultas · estatus · config · firebase · firebase-admin
src/types/        catálogo de estatus (fuente de verdad)
scripts/          verificar-seguridad · sembrar · pruebas/{reglas,flujo}
docs/             ESQUEMA · TECNICA · MANUAL-OPERADOR · PUESTA-EN-MARCHA
```

## Fuera de alcance (NO construir)

Pagos · chatbot/IA · notificaciones push o WhatsApp automático · multi-idioma ·
GPS/mapas · portal de cliente autenticado · Cloud Functions · tests e2e.

**Si algo de esto parece "fácil de agregar", NO lo agregues.**

## Notas de entorno

- El emulador de Firestore necesita **Java** (se instaló Microsoft OpenJDK 21).
- `.env.local` tiene **valores de marcador**, no credenciales reales: la app compila
  pero no se conecta a nada. Ver `.env.example` para saber de dónde sale cada valor.
- El `index.html` de la raíz es la **landing estática vieja** del negocio (demo previo,
  otro branding: rojo/azul, no el tema oscuro). No forma parte de la app Next; se
  conservó como referencia de marca.
