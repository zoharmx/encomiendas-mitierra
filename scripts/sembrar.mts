/**
 * Siembra el emulador con datos de ejemplo para poder trastear con la app.
 *
 * Crea el admin, el contador de folios y unos envíos en distintos estatus.
 * Se corre con el emulador YA levantado (`npm run emu` en otra terminal):
 *
 *   npm run sembrar
 *
 * Nunca apunta a producción: exige que el proyecto sea `demo-*`, que es el
 * prefijo que Firebase reserva para emuladores.
 */
process.env.NEXT_PUBLIC_USE_EMULATORS = 'true';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'demo-mitierra';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'clave-falsa-para-el-emulador';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'demo-mitierra.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'demo-mitierra.firebasestorage.app';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '000000000000';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:000000000000:web:0000000000000000000000';

import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import type { Estatus } from '../src/types/index.js';

const CORREO = 'admin@mitierra.mx';
const CONTRASENA = 'prueba1234';

const entorno = await initializeTestEnvironment({
  projectId: 'demo-mitierra',
  firestore: { host: '127.0.0.1', port: 8080 },
});

const { auth } = await import('../src/lib/firebase');

// Si ya existe (por una siembra anterior), simplemente se inicia sesión.
let uid: string;
try {
  const credencial = await createUserWithEmailAndPassword(auth, CORREO, CONTRASENA);
  uid = credencial.user.uid;
} catch {
  const credencial = await signInWithEmailAndPassword(auth, CORREO, CONTRASENA);
  uid = credencial.user.uid;
}

await entorno.withSecurityRulesDisabled(async (contexto) => {
  const db = contexto.firestore();
  await setDoc(doc(db, 'usuarios', uid), {
    email: CORREO,
    nombre: 'Dueña del Negocio',
    rol: 'admin',
    activo: true,
  });
  await setDoc(doc(db, 'contadores', 'folios'), { ultimo: 0 }, { merge: true });
});

const usuario = { uid, nombre: 'Dueña del Negocio' };
const { crearEnvio, cambiarEstatus } = await import('../src/lib/envios');

const EJEMPLOS: Array<{
  destinatario: string;
  origen: [string, string];
  destino: [string, string];
  paisDestino: string;
  descripcion: string;
  piezas: number;
  hasta: Estatus[];
}> = [
  {
    destinatario: 'Juana Ramírez López',
    origen: ['Houston', 'TX'],
    destino: ['Guadalajara', 'Jalisco'],
    paisDestino: 'México',
    descripcion: '2 cajas de ropa',
    piezas: 2,
    hasta: ['recolectado', 'en_bodega', 'en_transito'],
  },
  {
    destinatario: 'Carlos Mendoza',
    origen: ['Miami', 'FL'],
    destino: ['Ciudad de Guatemala', 'Guatemala'],
    paisDestino: 'Guatemala',
    descripcion: '1 caja con utensilios de cocina',
    piezas: 1,
    hasta: ['recolectado', 'en_bodega', 'en_transito', 'en_destino', 'en_reparto', 'entregado'],
  },
  {
    destinatario: 'Rosa Elena Vidal',
    origen: ['Los Angeles', 'CA'],
    destino: ['Tegucigalpa', 'Francisco Morazán'],
    paisDestino: 'Honduras',
    descripcion: '3 cajas de regalos',
    piezas: 3,
    hasta: ['recolectado', 'en_bodega', 'incidencia'],
  },
  {
    destinatario: 'Miguel Ángel Torres',
    origen: ['San Antonio', 'TX'],
    destino: ['San José', 'San José'],
    paisDestino: 'Costa Rica',
    descripcion: '1 sobre con documentos',
    piezas: 1,
    hasta: [],
  },
];

const NOTAS: Record<string, string> = {
  recolectado: 'Recolectamos tu paquete.',
  en_bodega: 'Tu paquete está en nuestra bodega de origen.',
  en_transito: 'Tu paquete va en camino a la ciudad destino.',
  en_destino: 'Tu paquete llegó a la ciudad destino.',
  en_reparto: 'Tu paquete salió a reparto. Hoy lo recibes.',
  entregado: 'Paquete entregado. ¡Gracias por confiar en nosotros!',
  incidencia: 'Hubo un contratiempo con tu envío. Te contactamos en breve.',
};

console.log('\n🌱 Sembrando el emulador…\n');

for (const ej of EJEMPLOS) {
  const folio = await crearEnvio(
    {
      remitente: {
        nombre: 'Pedro Salinas',
        telefono: '8321234567',
        email: 'pedro@ejemplo.com',
        ciudad: ej.origen[0],
        estado: ej.origen[1],
        direccion: '1234 Main St, Suite 2',
        pais: 'Estados Unidos',
      },
      destinatario: {
        nombre: ej.destinatario,
        telefono: '33123456',
        email: '',
        ciudad: ej.destino[0],
        estado: ej.destino[1],
        direccion: 'Calle Hidalgo 567, Col. Americana',
        pais: ej.paisDestino,
      },
      paquete: {
        descripcion: ej.descripcion,
        piezas: ej.piezas,
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

  for (const estatus of ej.hasta) {
    await cambiarEstatus(folio, estatus, {
      nota: NOTAS[estatus] ?? 'Actualización del envío.',
      notaInterna: estatus === 'incidencia' ? 'Dirección incompleta. Llamar al cliente.' : '',
      usuario,
    });
  }

  const ultimo = ej.hasta.at(-1) ?? 'registrado';
  console.log(`   ${folio}  →  ${ultimo}  (${ej.destinatario})`);
}

await entorno.cleanup();

console.log(`\n✅ Listo. Entra al panel con:\n`);
console.log(`   correo:     ${CORREO}`);
console.log(`   contraseña: ${CONTRASENA}\n`);
process.exit(0);
