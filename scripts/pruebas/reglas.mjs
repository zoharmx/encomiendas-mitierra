/**
 * Pruebas de las reglas de seguridad, contra el emulador de Firestore.
 *
 * Estas son las 4 preguntas que decidieron el diseño del esquema (ver
 * docs/ESQUEMA.md §1). Si alguna cambia de respuesta, hay una fuga de datos.
 *
 *   1. ✅ Un anónimo PUEDE leer tracking/{folio} si conoce el folio exacto
 *   2. ❌ Un anónimo NO puede LISTAR tracking/ (no puede cosechar folios)
 *   3. ❌ Un anónimo NO puede leer nada de envios/ (ni un solo documento)
 *   4. ❌ Un operador NO puede meter un campo extra (teléfono) en tracking/
 *
 * Se corre con: npm run probar   (levanta el emulador y ejecuta esto)
 */
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

const ok = (t) => console.log(`   ✅ ${t}`);

const entorno = await initializeTestEnvironment({
  projectId: 'demo-reglas',
  firestore: {
    host: '127.0.0.1',
    port: 8080,
    rules: readFileSync('firestore.rules', 'utf8'),
  },
});

console.log('\n🔒 Reglas de seguridad\n');

// --- Sembrado: con las reglas desactivadas, como haría el admin desde la consola ---
await entorno.withSecurityRulesDisabled(async (contexto) => {
  const db = contexto.firestore();

  await setDoc(doc(db, 'usuarios', 'uid-operador'), {
    email: 'operador@mitierra.mx',
    nombre: 'Operador de Prueba',
    rol: 'operador',
    activo: true,
  });

  await setDoc(doc(db, 'envios', 'EMT-0001-K3F9'), {
    folio: 'EMT-0001-K3F9',
    estatus: 'registrado',
    destinatario: { nombre: 'Juana Ramírez', telefono: '8112345678' },
    notasInternas: 'Cliente frecuente.',
  });

  await setDoc(doc(db, 'tracking', 'EMT-0001-K3F9'), {
    folio: 'EMT-0001-K3F9',
    estatus: 'registrado',
    origen: 'Monterrey, NL',
    destino: 'Guadalajara, JAL',
    destinatarioIniciales: 'J.R.',
    piezas: 2,
    historial: [],
  });
});

const anonimo = entorno.unauthenticatedContext().firestore();
const operador = entorno.authenticatedContext('uid-operador').firestore();

let fallas = 0;
async function prueba(descripcion, fn) {
  try {
    await fn();
    ok(descripcion);
  } catch (e) {
    console.error(`   ❌ ${descripcion}\n      ${e.message}`);
    fallas++;
  }
}

// 1 — El rastreo público funciona sin login.
await prueba('Un anónimo PUEDE leer tracking/{folio} conociendo el folio', () =>
  assertSucceeds(getDoc(doc(anonimo, 'tracking', 'EMT-0001-K3F9'))),
);

// 2 — Pero no puede recorrer la colección para cosechar todos los envíos.
await prueba('Un anónimo NO puede LISTAR la colección tracking/', () =>
  assertFails(getDocs(collection(anonimo, 'tracking'))),
);

// 3 — Los datos internos (teléfonos, direcciones, notas) son inalcanzables.
await prueba('Un anónimo NO puede leer envios/{folio}', () =>
  assertFails(getDoc(doc(anonimo, 'envios', 'EMT-0001-K3F9'))),
);

await prueba('Un anónimo NO puede listar envios/', () =>
  assertFails(getDocs(collection(anonimo, 'envios'))),
);

// 4 — Ni siquiera el staff puede filtrar datos privados al espejo público:
//     la regla rechaza cualquier campo fuera de la lista blanca.
await prueba('Un operador NO puede escribir un campo extra (telefono) en tracking/', () =>
  assertFails(
    setDoc(doc(operador, 'tracking', 'EMT-0001-K3F9'), {
      folio: 'EMT-0001-K3F9',
      estatus: 'en_transito',
      origen: 'Monterrey, NL',
      destino: 'Guadalajara, JAL',
      destinatarioIniciales: 'J.R.',
      piezas: 2,
      historial: [],
      telefono: '8112345678', // ← el campo prohibido
    }),
  ),
);

// Contraprueba: el mismo escrito SIN el campo extra sí pasa. Si esto fallara,
// la regla estaría rota "hacia el otro lado" y el panel no podría trabajar.
await prueba('Un operador SÍ puede actualizar tracking/ con solo campos públicos', () =>
  assertSucceeds(
    setDoc(doc(operador, 'tracking', 'EMT-0001-K3F9'), {
      folio: 'EMT-0001-K3F9',
      estatus: 'en_transito',
      origen: 'Monterrey, NL',
      destino: 'Guadalajara, JAL',
      destinatarioIniciales: 'J.R.',
      piezas: 2,
      historial: [],
    }),
  ),
);

// 5 — El staff sí ve lo interno (si no, el panel no serviría de nada).
await prueba('Un operador SÍ puede leer envios/{folio}', () =>
  assertSucceeds(getDoc(doc(operador, 'envios', 'EMT-0001-K3F9'))),
);

// 6 — Nadie se auto-promueve a admin: crear staff exige ser admin.
await prueba('Un operador NO puede darse de alta a sí mismo como admin', () =>
  assertFails(
    setDoc(doc(operador, 'usuarios', 'uid-operador'), {
      email: 'operador@mitierra.mx',
      nombre: 'Operador de Prueba',
      rol: 'admin',
      activo: true,
    }),
  ),
);

await entorno.cleanup();

if (fallas > 0) {
  console.error(`\n❌ ${fallas} prueba(s) de reglas fallaron.\n`);
  process.exit(1);
}
console.log('\n✅ Reglas de seguridad: todas las pruebas pasaron.\n');
