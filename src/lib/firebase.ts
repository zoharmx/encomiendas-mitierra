/**
 * Firebase — SDK de cliente (navegador).
 *
 * Se usa para:
 *   - lectura pública de tracking/{folio} (sin autenticación)
 *   - login del staff y todas las operaciones del panel admin
 *
 * Las NEXT_PUBLIC_* son públicas por diseño: no son secretos. Quien protege
 * los datos son firestore.rules, no estas claves.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(config);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// --- Emuladores (solo en desarrollo local, con NEXT_PUBLIC_USE_EMULATORS=true) ---
// Se conectan una sola vez; el flag en globalThis evita reconectar con Fast Refresh.
declare global {
  var __emuladoresConectados__: boolean | undefined;
}

// Se conecta también desde Node (no solo desde el navegador): así los scripts
// de prueba pueden ejercitar el mismo lib/envios.ts que usa la app real.
if (
  process.env.NEXT_PUBLIC_USE_EMULATORS === 'true' &&
  !globalThis.__emuladoresConectados__
) {
  globalThis.__emuladoresConectados__ = true;
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}

export { app };
