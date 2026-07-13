/**
 * Prueba del flujo completo, contra los emuladores de Firestore + Auth.
 *
 * Ejercita el MISMO src/lib/envios.ts que usa la app real (no una copia):
 *
 *   crear envío → aparece en el tracking público → cambiar estatus →
 *   el tracking público refleja el cambio y el nuevo evento del historial
 *
 * Y comprueba la invariante que sostiene todo el diseño: que al espejo público
 * NUNCA lleguen datos de contacto ni notas internas.
 *
 * Se corre con: npm run probar
 */

// Las variables tienen que estar puestas ANTES de que se importe lib/firebase,
// porque ese módulo lee process.env al evaluarse. Por eso los imports de la app
// van dinámicos, más abajo.
process.env.NEXT_PUBLIC_USE_EMULATORS = 'true';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'demo-mitierra';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'clave-falsa-para-el-emulador';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'demo-mitierra.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'demo-mitierra.firebasestorage.app';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '000000000000';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:000000000000:web:0000000000000000000000';

import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, type DocumentData } from 'firebase/firestore';

const PROYECTO = 'demo-mitierra';

let fallas = 0;

function afirmar(condicion: unknown, descripcion: string) {
  if (condicion) {
    console.log(`   ✅ ${descripcion}`);
  } else {
    console.error(`   ❌ ${descripcion}`);
    fallas++;
  }
}

console.log('\n📦 Flujo completo (crear → rastrear → cambiar estatus)\n');

// --- Sembrado con reglas desactivadas: es lo que el dueño hace a mano en la
//     consola de Firebase la primera vez (ver README, "primer admin"). ---
const entorno = await initializeTestEnvironment({
  projectId: PROYECTO,
  firestore: { host: '127.0.0.1', port: 8080 },
});

/**
 * Lee un documento interno saltándose las reglas.
 *
 * Va por el contexto del emulador y no por el `db` de la app a propósito: el
 * cliente de la app y el de las pruebas son instancias distintas del SDK, y
 * mezclarlas hace que Firestore rechace las referencias.
 */
async function leerInterno(folio: string): Promise<DocumentData | undefined> {
  let datos: DocumentData | undefined;
  await entorno.withSecurityRulesDisabled(async (contexto) => {
    datos = (await getDoc(doc(contexto.firestore(), 'envios', folio))).data();
  });
  return datos;
}

// --- Login real contra el emulador de Auth ---
const { auth } = await import('../../src/lib/firebase');
const credencial = await createUserWithEmailAndPassword(
  auth,
  'admin@mitierra.mx',
  'contrasena-de-prueba',
);
const uid = credencial.user.uid;

await entorno.withSecurityRulesDisabled(async (contexto) => {
  const sinReglas = contexto.firestore();
  // El primer admin: las reglas impiden auto-promoverse, así que se siembra.
  await setDoc(doc(sinReglas, 'usuarios', uid), {
    email: 'admin@mitierra.mx',
    nombre: 'Dueña del Negocio',
    rol: 'admin',
    activo: true,
  });
  // El contador de folios arranca en 0.
  await setDoc(doc(sinReglas, 'contadores', 'folios'), { ultimo: 0 });
});

const usuario = { uid, nombre: 'Dueña del Negocio' };

// --- 1. Crear el envío, con el mismo código que usa el panel ---
const { crearEnvio, cambiarEstatus, consultarTracking } = await import('../../src/lib/envios');

const folio = await crearEnvio(
  {
    remitente: {
      nombre: 'Pedro Salinas',
      telefono: '8321234567',
      email: 'pedro@ejemplo.com',
      ciudad: 'Houston',
      estado: 'TX',
      direccion: '1234 Main St',
      pais: 'Estados Unidos',
    },
    destinatario: {
      nombre: 'Juana Ramírez López',
      telefono: '33123456',
      email: 'juana@ejemplo.mx',
      ciudad: 'Guadalajara',
      estado: 'Jalisco',
      direccion: 'Calle Hidalgo 567, Americana',
      pais: 'México',
    },
    paquete: {
      descripcion: '2 cajas de ropa',
      piezas: 2,
      pesoKg: 8.5,
      valorDeclarado: 3000,
      fotoUrl: null,
    },
    servicio: {
      tipo: 'terrestre',
      costo: 450,
      moneda: 'USD',
      pagado: false,
      formaPago: null,
    },
    notasInternas: 'Cliente frecuente. Cobrar al entregar.',
    creadoPor: uid,
  },
  usuario,
);

afirmar(/^EMT-\d{4}-[A-Z0-9]{4}$/.test(folio), `El folio generado tiene el formato correcto: ${folio}`);

// --- 2. Aparece en el tracking público, con 1 sola lectura ---
const publico = await consultarTracking(folio);

afirmar(publico !== null, 'El envío aparece en el tracking público');
afirmar(publico?.estatus === 'registrado', 'Su estatus inicial es "registrado"');
afirmar(publico?.origen === 'Houston, TX', 'El origen es la ciudad+estado del remitente');
afirmar(publico?.destino === 'Guadalajara, Jalisco', 'El destino es la ciudad+estado del destinatario');
afirmar(publico?.destinatarioIniciales === 'J.R.', 'Solo se publican las INICIALES del destinatario');
afirmar(publico?.piezas === 2, 'Las piezas se publican');
afirmar(publico?.historial.length === 1, 'El historial público arranca con 1 evento');

// --- 3. LA invariante: nada privado se filtró al espejo ---
const serializado = JSON.stringify(publico);
const privados = [
  ['8321234567', 'el teléfono del remitente'],
  ['33123456', 'el teléfono del destinatario'],
  ['1234 Main St', 'la dirección del remitente'],
  ['Calle Hidalgo', 'la dirección del destinatario'],
  ['Cliente frecuente', 'las notas internas'],
  ['pedro@ejemplo.com', 'el correo del remitente'],
  ['Juana Ramírez López', 'el nombre completo del destinatario'],
  ['450', 'el costo del servicio'],
] as const;

for (const [aguja, descripcion] of privados) {
  afirmar(!serializado.includes(aguja), `El espejo público NO contiene ${descripcion}`);
}

// --- 4. Lo interno sí guarda todo (es la bitácora del negocio) ---
const interno = await leerInterno(folio);
afirmar(
  interno?.notasInternas === 'Cliente frecuente. Cobrar al entregar.',
  'El documento interno SÍ conserva las notas internas',
);
afirmar(
  interno?.destinatario?.telefono === '33123456',
  'El documento interno SÍ conserva el teléfono del destinatario',
);

// --- 5. Cambiar el estatus y ver que el público lo refleja ---
await cambiarEstatus(folio, 'recolectado', {
  nota: 'Recolectamos tu paquete.',
  notaInterna: 'Lo recogió Beto en la ruta de la mañana.',
  usuario,
});

const despues = await consultarTracking(folio);

afirmar(despues?.estatus === 'recolectado', 'El tracking público refleja el nuevo estatus');
afirmar(despues?.historial.length === 2, 'El historial público tiene ahora 2 eventos');
afirmar(
  despues?.historial[1]?.nota === 'Recolectamos tu paquete.',
  'El nuevo evento trae su nota pública',
);
afirmar(
  !JSON.stringify(despues).includes('Beto'),
  'La nota INTERNA del cambio no llegó al espejo público',
);

// --- 6. Lo interno también avanzó ---
const internoDespues = await leerInterno(folio);
afirmar(internoDespues?.estatus === 'recolectado', 'El documento interno también cambió de estatus');

// --- 7. Entregar cierra el envío ---
await cambiarEstatus(folio, 'en_bodega', { nota: 'En bodega de origen.', usuario });
await cambiarEstatus(folio, 'en_transito', { nota: 'Va en camino.', usuario });
await cambiarEstatus(folio, 'en_destino', { nota: 'Llegó a Guadalajara.', usuario });
await cambiarEstatus(folio, 'en_reparto', { nota: 'Salió a reparto.', usuario });
await cambiarEstatus(folio, 'entregado', { nota: '¡Entregado!', usuario });

const final = await consultarTracking(folio);
const internoFinal = await leerInterno(folio);

afirmar(final?.estatus === 'entregado', 'El envío llega a "entregado" en el tracking público');
afirmar(final?.historial.length === 7, 'El historial público tiene los 7 eventos del flujo');
afirmar(internoFinal?.entregadoEn != null, 'Al entregar se sella la fecha de entrega (entregadoEn)');

// --- 8. Los folios no son enumerables ---
const segundo = await crearEnvio(
  {
    remitente: {
      nombre: 'Ana Ruiz', telefono: '8199999999', ciudad: 'San Antonio',
      estado: 'TX', direccion: 'Calle 1', pais: 'Estados Unidos',
    },
    destinatario: {
      nombre: 'Luis Mora', telefono: '22334455', ciudad: 'San Salvador',
      estado: 'San Salvador', direccion: 'Calle 2', pais: 'El Salvador',
    },
    paquete: { descripcion: '1 sobre', piezas: 1, pesoKg: 0.5, valorDeclarado: null, fotoUrl: null },
    servicio: { tipo: 'aereo', costo: 200, moneda: 'USD', pagado: true, formaPago: 'efectivo' },
    notasInternas: '',
    creadoPor: uid,
  },
  usuario,
);

const consecutivo1 = folio.split('-')[1];
const consecutivo2 = segundo.split('-')[1];
const sufijo1 = folio.split('-')[2];
const sufijo2 = segundo.split('-')[2];

afirmar(Number(consecutivo2) === Number(consecutivo1) + 1, 'El consecutivo del folio avanza de 1 en 1');
afirmar(sufijo1 !== sufijo2, 'El sufijo aleatorio cambia: los folios NO son adivinables');

await entorno.cleanup();

if (fallas > 0) {
  console.error(`\n❌ ${fallas} prueba(s) del flujo fallaron.\n`);
  process.exit(1);
}
console.log('\n✅ Flujo completo: todas las pruebas pasaron.\n');
process.exit(0);
