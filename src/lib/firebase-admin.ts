/**
 * Firebase Admin SDK — SOLO servidor.
 *
 * ⚠ Este archivo únicamente puede importarse desde src/app/api/**.
 *    Nunca desde un componente, ni desde middleware.ts (el middleware corre en
 *    el runtime Edge, donde el Admin SDK de Node no funciona).
 *
 * Usa una service account con privilegios totales: si llegara al bundle del
 * cliente, se filtraría la base entera. El script `npm run verificar:seguridad`
 * (ver README) comprueba que nadie fuera de app/api/ lo importe.
 */
import 'server-only';

import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

function credenciales() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // En .env la llave va en una sola línea con "\n" literales: hay que restituirlos.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Faltan credenciales de firebase-admin. Define FIREBASE_PROJECT_ID, ' +
        'FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en .env.local (ver .env.example).',
    );
  }

  return cert({ projectId, clientEmail, privateKey });
}

/**
 * Inicialización PEREZOSA, a propósito.
 *
 * Si el SDK se inicializara al importar el módulo, `next build` reventaría al
 * recolectar los datos de la ruta: durante el build no hay credenciales (ni
 * debe haberlas: no son secretos de compilación, son secretos de ejecución).
 * Así el arranque solo ocurre cuando alguien hace login de verdad.
 */
export function authAdmin(): Auth {
  const app = getApps().length ? getApp() : initializeApp({ credential: credenciales() });
  return getAuth(app);
}
