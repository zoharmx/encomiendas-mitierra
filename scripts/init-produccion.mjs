/**
 * Inicializa contadores/folios en el proyecto REAL de Firebase (no el emulador).
 * Se corre una sola vez, en la puesta en marcha. Ver docs/PUESTA-EN-MARCHA.md.
 *
 * Uso: node scripts/init-produccion.mjs
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('Faltan FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY en el entorno.');
  process.exit(1);
}

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

const ref = db.collection('contadores').doc('folios');
const snap = await ref.get();

if (snap.exists) {
  console.log('contadores/folios ya existe:', snap.data());
} else {
  await ref.set({ ultimo: 0 });
  console.log('✅ Creado contadores/folios = { ultimo: 0 }');
}

process.exit(0);
