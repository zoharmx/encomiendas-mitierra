/**
 * Da de alta (o actualiza) a un miembro del personal en el proyecto REAL.
 *
 * Uso: node scripts/dar-de-alta-staff.mjs correo@ejemplo.com "Nombre" admin|operador
 *
 * La cuenta de Auth debe existir ya (la persona entró al menos una vez con
 * Google o email/password); este script solo crea/actualiza su perfil de
 * staff en usuarios/{uid}, que es lo que le da acceso al panel.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const [, , email, nombre, rol] = process.argv;

if (!email || !nombre || !['admin', 'operador'].includes(rol ?? '')) {
  console.error('Uso: node scripts/dar-de-alta-staff.mjs correo@ejemplo.com "Nombre" admin|operador');
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replaceAll('\\n', '\n');

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

const usuario = await getAuth().getUserByEmail(email);
await getFirestore().collection('usuarios').doc(usuario.uid).set({
  email,
  nombre,
  rol,
  activo: true,
});

console.log(`✅ ${email} (${nombre}) ya es "${rol}" y tiene acceso al panel.`);
process.exit(0);
