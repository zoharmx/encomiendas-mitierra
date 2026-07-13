import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const [, , email] = process.argv;
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replaceAll('\\n', '\n');

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

try {
  const usuario = await getAuth().getUserByEmail(email);
  console.log(`Existe en Auth: uid=${usuario.uid}, proveedores=${usuario.providerData.map(p => p.providerId).join(',')}`);
} catch {
  console.log('NO existe ninguna cuenta de Auth con ese correo todavía.');
}
process.exit(0);
