# Puesta en marcha — Encomiendas Mi Tierra

## Archivos de este paquete

```
firestore.rules          Reglas de seguridad (el archivo más importante)
storage.rules            Reglas de fotos/evidencia
firestore.indexes.json   Índices compuestos del panel admin
types/index.ts           Modelo de datos + catálogo de estatus
lib/envios.ts            Crear envío, cambiar estatus, consultar tracking
docs/ESQUEMA.md          Documento del esquema y decisiones de diseño
```

## Pasos

**1. Crear el proyecto Firebase** (plan Spark, gratuito). Habilitar:
Firestore, Authentication (Email/Password) y Storage.

**2. Desplegar reglas e índices:**
```bash
npm install -g firebase-tools
firebase login
firebase init firestore storage    # apuntar a los archivos de este paquete
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

**3. Crear el primer admin (huevo y gallina).**
Las reglas exigen ser admin para crear usuarios, así que el primero se crea
a mano: en Firebase Console → Authentication → agregar usuario; copiar su UID;
en Firestore crear manualmente `usuarios/{uid}`:
```json
{ "email": "...", "nombre": "...", "rol": "admin", "activo": true }
```
A partir de ahí, ese admin da de alta al resto desde el panel.

**4. Inicializar el contador:** crear `contadores/folios` con `{ "ultimo": 0 }`.

**5. Probar las reglas antes de exponer nada** (esto no es opcional):
```bash
firebase emulators:start --only firestore
```
Verificar los 4 casos críticos:
- ✅ Un anónimo PUEDE leer `tracking/EMT-0001-K3F9` conociendo el folio
- ❌ Un anónimo NO puede listar la colección `tracking`
- ❌ Un anónimo NO puede leer nada de `envios`
- ❌ Un operador NO puede escribir un campo extra (ej. `telefono`) en `tracking`

**6. Hosting:** Firebase Hosting o Cloudflare Pages.
**No Vercel Hobby** — su licencia gratuita prohíbe uso comercial.

## Recordatorios permanentes

- Toda escritura pasa por `lib/envios.ts`. Nunca escribir a `tracking/`
  directamente desde un componente: se rompe la garantía de que solo salen
  campos públicos.
- Ninguna API key en el cliente. Si más adelante se agrega resumen con IA o
  notificaciones por WhatsApp, van detrás de una Cloud Function.
- El historial interno es inmutable por diseño (las reglas prohíben update
  y delete). Es la bitácora del negocio: si hay una disputa con un cliente,
  esa bitácora es la evidencia.
