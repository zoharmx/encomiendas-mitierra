# Documentación técnica

Para quien vaya a programar sobre este proyecto. Lee antes
[`ESQUEMA.md`](ESQUEMA.md): el modelo de datos explica el 80 % de las decisiones
que verás en el código.

---

## La idea central

Firestore autoriza **documentos completos, no campos**. No existe "puedes leer este
documento pero no la columna `telefono`". De ahí sale toda la arquitectura:

```
envios/{folio}            TODO (teléfonos, direcciones, costos, notas internas)
                          └─ solo staff autenticado

tracking/{folio}          SOLO lo mostrable en público
                          └─ lectura por ID para cualquiera; listar, PROHIBIDO
```

Cada cambio escribe **los dos documentos en un batch atómico**. La proyección de qué
sale al espejo público vive en un único lugar: `src/lib/envios.ts`. Si un componente
escribiera a Firestore por su cuenta, esa garantía se rompe — por eso
`npm run verificar:seguridad` falla si alguien lo intenta.

---

## Reglas que el código debe respetar

1. **Los componentes nunca escriben a Firestore.** Escrituras: `src/lib/envios.ts`.
   Lecturas del panel: `src/lib/consultas.ts`.
2. **`notasInternas` y los datos de contacto jamás se renderizan en rutas públicas.**
   No pueden: el espejo público ni siquiera los contiene.
3. **`firebase-admin` solo en `src/app/api/`.** Nunca en un componente, nunca en el
   middleware.
4. **Ninguna API key de terceros en el cliente.** El proyecto no usa APIs externas.
   El QR se genera localmente con la librería `qrcode` justamente por eso: un
   servicio tipo "api.qrserver.com" vería todos los folios de los clientes.

Las tres primeras las verifica `npm run verificar:seguridad` en cada corrida.

---

## Mapa del código

| Archivo | Responsabilidad |
|---|---|
| `src/types/index.ts` | **Catálogo de estatus** (fuente de verdad) + tipos del modelo. Cambiar el flujo del negocio = editar `FLUJO_ESTATUS`. |
| `src/lib/envios.ts` | **Todas las escrituras**: `crearEnvio`, `cambiarEstatus`, `generarFolio`, `consultarTracking`. Viene del paquete `emt-firestore`, integrado sin modificar. |
| `src/lib/consultas.ts` | Todas las lecturas del panel: lista paginada, búsqueda por folio, métricas. |
| `src/lib/estatus.ts` | Interpreta el catálogo: transiciones válidas, colores, etiquetas. |
| `src/lib/config.ts` | Branding: nombre, teléfonos, mensajes de WhatsApp, regex del folio. |
| `src/lib/auth-context.tsx` | Sesión del staff en el navegador (usuario de Auth + perfil de `usuarios/{uid}`). |
| `src/lib/firebase.ts` | SDK cliente. Se conecta al emulador si `NEXT_PUBLIC_USE_EMULATORS=true`. |
| `src/lib/firebase-admin.ts` | SDK admin, **inicialización perezosa** (si no, `next build` revienta al no haber credenciales en tiempo de compilación). |
| `src/middleware.ts` | Filtro barato de `/admin/*`: solo comprueba que la cookie exista. |

---

## Autenticación: por qué está partida en tres

```
1. /login                       Firebase Auth (cliente) → idToken
                                       ↓
2. POST /api/auth/session       firebase-admin verifica el idToken y devuelve
                                una cookie de sesión HttpOnly (5 días)
                                       ↓
3. middleware.ts (Edge)         ¿existe la cookie? → sigue. ¿no? → /login
                                       ↓
4. /admin/layout.tsx (cliente)  ¿hay sesión de Firebase Auth?
                                ¿hay perfil de staff ACTIVO en usuarios/{uid}?
                                       ↓
5. firestore.rules              LA autorización de verdad
```

**El middleware no verifica la firma de la cookie.** No puede: corre en el runtime
Edge, y el Admin SDK de Node no funciona ahí. Es un filtro de conveniencia, no una
defensa.

La defensa real son los pasos 4 y 5. **Una cookie falsificada pasa el middleware y no
consigue nada**: el panel se queda vacío porque Firestore rechaza cada lectura que
haga. La seguridad no depende del middleware, y por eso puede permitirse ser barato.

> Si algún día se quiere verificación real en el borde, el camino es migrar el rol a
> **custom claims** de Firebase Auth y validar el JWT con `jose` (que sí corre en Edge).
> No hacía falta a esta escala.

---

## Decisiones que quizá te sorprendan

**La búsqueda del panel exige el folio completo.**
Es una lectura por ID (`getDoc`), no una consulta: cuesta 1 lectura y no necesita
índice. Buscar por nombre parcial en Firestore obligaría a un servicio de búsqueda
externo de pago (Algolia, Typesense). A 30 envíos/día no vale la pena.

**Las métricas usan `getCountFromServer`.**
Una consulta de agregación cuesta **1 lectura** sin importar cuántos documentos
cuente. Traer la lista para contarla costaría N.

**El historial público va embebido como array en `tracking/{folio}`.**
Toda la página de rastreo se pinta con **1 sola lectura** en vez de N. A 6-8 eventos
por envío, el documento queda muy por debajo del límite de 1 MB.

**`Timestamp.now()` (hora del cliente) dentro del array del historial público.**
Firestore no admite `serverTimestamp()` dentro de un array. El campo `actualizadoEn`
del documento sí usa la hora del servidor; el del array es la del navegador del
operador. Un reloj mal puesto en la computadora del negocio desalinearía esa fecha
por minutos — irrelevante para el caso de uso, y así lo dejó el paquete original.

**No hay rate limiting.**
La lectura pública va directa a Firestore, protegida por reglas: no hay endpoint
propio que abusar. El folio lleva sufijo aleatorio, así que la fuerza bruta no es
rentable. Si algún día se mete la consulta detrás de una API route, el limitador va
ahí — hay un comentario en `src/app/tracking/page.tsx` señalando el punto exacto.

**Un índice compuesto añadido al paquete original.**
`firestore.indexes.json` traía `(estatus, creadoEn desc)`, pero el dashboard ordena
por `actualizadoEn desc` (que es lo que le importa al operador: qué se movió al
último). Se **agregó** `(estatus, actualizadoEn desc)`; no se quitó nada.

---

## Estilos

Tailwind v4. Los tokens de marca están en `src/app/globals.css` (`@theme`), no en los
componentes:

- `--color-marca-de` / `--color-marca-a` — los dos extremos del gradiente de acento.
- Utilidades propias: `vidrio` (glassmorphism), `texto-acento`, `pulso`.

Mobile-first: el rastreo se abre casi siempre desde WhatsApp, en un teléfono. El
timeline es **vertical en móvil y horizontal en escritorio**. En el panel, la tabla
de envíos se convierte en tarjetas por debajo de `md` (cinco columnas no caben en un
teléfono).

---

## Qué NO tiene, a propósito

Pagos · chatbot o IA · notificaciones automáticas · multi-idioma · GPS o mapas ·
portal de cliente con login · Cloud Functions · tests e2e.

Si algo de esto parece "fácil de agregar", **no lo agregues**. La premisa del
proyecto es que cabe en el tier gratuito y que lo opera alguien que no es técnico.
Cada pieza de más traiciona una de las dos cosas.

Lo que sí quedó fuera pero **sí hace falta**, está en [`../HANDOFF.md`](../HANDOFF.md).
