/**
 * Crea el PRIMER administrador del panel, en el proyecto REAL de Firebase.
 *
 * Precrea la cuenta de Auth (sin contraseña) y su perfil de staff en
 * usuarios/{uid} con rol admin. Cuando esa persona entre con "Entrar con
 * Google" usando el mismo correo verificado, Firebase Auth enlaza el login
 * de Google a esta misma cuenta automáticamente (comportamiento por defecto
 * "una cuenta por correo"), sin que nadie tenga que copiar un UID a mano.
 *
 * Uso: node scripts/crear-primer-admin.mjs correo@ejemplo.com "Nombre Completo"
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const [, , email, nombre] = process.argv;

if (!email) {
  console.error('Uso: node scripts/crear-primer-admin.mjs correo@ejemplo.com "Nombre Completo"');
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const auth = getAuth();
const db = getFirestore();

let usuario;
try {
  usuario = await auth.getUserByEmail(email);
  console.log(`Ya existía la cuenta de Auth para ${email} (uid ${usuario.uid}).`);
} catch {
  usuario = await auth.createUser({ email, emailVerified: true });
  console.log(`Cuenta de Auth creada para ${email} (uid ${usuario.uid}).`);
}

await db.collection('usuarios').doc(usuario.uid).set({
  email,
  nombre: nombre || 'Administrador',
  rol: 'admin',
  activo: true,
});

console.log(`✅ ${email} ya es admin. Puede entrar con "Entrar con Google" usando ese correo.`);
process.exit(0);
