# Esquema Firestore — Encomiendas Mi Tierra

Tracking de paquetes con cambio de estatus manual. Diseñado para operar
dentro del tier gratuito de Firebase (Spark) a escala pequeña.

---

## 1. Principio de diseño: separación público / interno

Firestore autoriza **documentos completos**, no campos. Por eso el modelo usa
dos colecciones espejo:

| Colección | Contiene | Quién lee |
|---|---|---|
| `envios/{envioId}` | TODO: remitente, destinatario, teléfonos, direcciones, costos, notas internas | Solo admins autenticados |
| `tracking/{folio}` | Solo lo mostrable en la página pública: estatus, historial, ciudad origen/destino, iniciales | Cualquiera (lectura) |

Al cambiar un estatus, el panel admin escribe **ambos documentos en un batch**
(operación atómica: o se actualizan los dos, o ninguno).

**Por qué importa:** sin esto, cualquiera que pruebe folios consecutivos
(`EMT-0001`, `EMT-0002`...) cosecha nombres, teléfonos y direcciones de todos
los clientes. Con esto, lo peor que obtiene es "un paquete de Monterrey a
Guadalajara va en tránsito".

**Refuerzo adicional:** el folio incluye un sufijo aleatorio
(`EMT-2607-K3F9`), así no es enumerable. La regla pública además **prohíbe
listar** la colección: solo se puede leer un documento si ya conoces su ID.

---

## 2. Colecciones

### 2.1 `envios/{envioId}` — interno

```
envioId: string          // = folio, ej. "EMT-2607-K3F9"

folio            string   "EMT-2607-K3F9"
estatus          string   ver catálogo §3
creadoEn         timestamp
actualizadoEn    timestamp
entregadoEn      timestamp | null

remitente:  { nombre, telefono, email, ciudad, estado, direccion }
destinatario: { nombre, telefono, email, ciudad, estado, direccion }

paquete: {
  descripcion   string    "2 cajas de ropa"
  piezas        number
  pesoKg        number
  valorDeclarado number | null
  fotoUrl       string | null   // Firebase Storage
}

servicio: {
  tipo          string    "terrestre" | "aereo"
  costo         number
  moneda        string    "MXN"
  pagado        boolean
  formaPago     string | null
}

notasInternas    string    // NUNCA se copia al espejo público
creadoPor        string    // uid del admin
```

### 2.2 `envios/{envioId}/historial/{eventoId}` — subcolección

```
estatus       string      estatus al que se movió
fecha         timestamp
nota          string      visible al cliente (ej. "Salió de bodega MTY")
notaInterna   string      NO visible al cliente
usuarioId     string      uid del admin que hizo el cambio
usuarioNombre string
```

### 2.3 `tracking/{folio}` — espejo público

```
folio            string
estatus          string
actualizadoEn    timestamp
creadoEn         timestamp
origen           string    "Monterrey, NL"      // ciudad+estado, sin dirección
destino          string    "Guadalajara, JAL"
destinatarioIniciales string  "J.R."            // nunca el nombre completo
piezas           number
historial: [                                    // array embebido, no subcolección
  { estatus, fecha, nota }                      // solo la nota pública
]
```

> El historial va **embebido como array** en el espejo: una sola lectura
> para pintar toda la página (1 read en vez de N). A 6–8 eventos por envío
> el documento queda muy por debajo del límite de 1 MB.

### 2.4 `usuarios/{uid}` — control de acceso

```
email    string
nombre   string
rol      string    "admin" | "operador"
activo   boolean
```

> El rol vive en Firestore, no en el token. Es suficiente a esta escala.
> Si el proyecto crece, migrar a **custom claims** de Firebase Auth (evita
> una lectura extra por cada verificación de regla).

### 2.5 `contadores/folios` — generación de folios

```
ultimo   number    // se incrementa con transacción
```

---

## 3. Catálogo de estatus

| Orden | Estatus | Etiqueta pública |
|---|---|---|
| 0 | `registrado` | Envío registrado |
| 1 | `recolectado` | Recolectado |
| 2 | `en_bodega` | En bodega de origen |
| 3 | `en_transito` | En tránsito |
| 4 | `en_destino` | En ciudad destino |
| 5 | `en_reparto` | En reparto |
| 6 | `entregado` | Entregado |
| — | `incidencia` | Incidencia (fuera de flujo) |
| — | `cancelado` | Cancelado (fuera de flujo) |

Ajustable: el catálogo vive en `lib/estatus.ts`, no quemado en la UI ni en
las reglas. Cambiar el flujo = editar un arreglo.

---

## 4. Costo estimado (tier gratuito Spark)

Cuotas gratuitas diarias de Firestore: 50,000 lecturas, 20,000 escrituras,
1 GB almacenado.

Escenario realista de Encomiendas Mi Tierra:
- 30 envíos/día × 7 cambios de estatus × 2 escrituras (interno + espejo)
  ≈ **420 escrituras/día** (2% de la cuota)
- Cada consulta pública = **1 lectura** (gracias al historial embebido).
  Aun con 500 consultas/día ≈ 1% de la cuota.

**Conclusión: cabe holgado en el tier gratuito.** El proyecto solo saldría
del plan gratuito si más adelante se agregan Cloud Functions (requieren
plan Blaze, que igual tiene cuota gratuita mensual, pero exige tarjeta).

---

## 5. Hosting

Desplegar en **Firebase Hosting** (Spark, gratuito, permite uso comercial)
o Cloudflare Pages. **No usar Vercel Hobby**: su licencia gratuita prohíbe
uso comercial y encomiendasmitierra.com es un negocio.

---

## 6. Reglas operativas que el código debe respetar

1. **Nunca** escribir `notasInternas` ni datos de contacto en `tracking/`.
2. Todo cambio de estatus se hace con `writeBatch` (envío + espejo + evento
   de historial) — atómico.
3. El folio se genera con `runTransaction` sobre `contadores/folios` + sufijo
   aleatorio de 4 caracteres.
4. Ninguna clave de API (Gemini, WhatsApp, etc.) va en el cliente. Si se
   agrega IA más adelante, va detrás de una Cloud Function o API route.
