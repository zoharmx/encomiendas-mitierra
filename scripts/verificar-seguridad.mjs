/**
 * Verificación de seguridad. Corre con: npm run verificar:seguridad
 *
 * Comprueba las tres invariantes que, si se rompen, filtran datos de clientes.
 * No sustituye a las reglas de Firestore (esas son la defensa real); esto es
 * una red que atrapa el error humano ANTES de desplegarlo.
 *
 * Sale con código 1 si algo falla, para poder encadenarlo en CI o en un hook.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const RAIZ = process.cwd();
const SRC = join(RAIZ, 'src');

function archivos(dir) {
  const encontrados = [];
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) {
      encontrados.push(...archivos(ruta));
    } else if (/\.(ts|tsx)$/.test(entrada)) {
      encontrados.push(ruta);
    }
  }
  return encontrados;
}

const todos = archivos(SRC);
const fallas = [];

// --- 1. firebase-admin solo puede importarse desde src/app/api/ ---
const RUTA_PERMITIDA = join('src', 'app', 'api') + sep;

for (const ruta of todos) {
  const codigo = readFileSync(ruta, 'utf8');
  const rel = relative(RAIZ, ruta);

  const importaAdmin =
    /from\s+['"]firebase-admin/.test(codigo) ||
    /from\s+['"]@\/lib\/firebase-admin['"]/.test(codigo);

  // El propio módulo firebase-admin.ts es la excepción obvia: él lo define.
  const esElModulo = rel === join('src', 'lib', 'firebase-admin.ts');

  if (importaAdmin && !esElModulo && !rel.startsWith(RUTA_PERMITIDA)) {
    fallas.push(
      `${rel} importa firebase-admin fuera de src/app/api/. ` +
        `El Admin SDK se salta TODAS las reglas de seguridad: si llega al ` +
        `navegador, se filtra la base entera.`,
    );
  }

  // --- 2. Ningún componente escribe a Firestore sin pasar por lib/envios.ts ---
  const esLib = rel.startsWith(join('src', 'lib') + sep);
  const escribeDirecto = /\b(setDoc|updateDoc|deleteDoc|addDoc|writeBatch|runTransaction)\s*\(/.test(
    codigo,
  );

  if (escribeDirecto && !esLib) {
    fallas.push(
      `${rel} escribe a Firestore directamente. Toda escritura debe pasar por ` +
        `src/lib/envios.ts: es lo que garantiza que al espejo público tracking/ ` +
        `solo lleguen campos seguros (nunca teléfonos ni notas internas).`,
    );
  }
}

// --- 3. El espejo público no puede contener campos privados ---
const envios = readFileSync(join(SRC, 'lib', 'envios.ts'), 'utf8');
const proyeccionPublica = envios.slice(
  envios.indexOf('const publico'),
  envios.indexOf('batch.set(trackingRef'),
);

for (const prohibido of ['telefono', 'direccion', 'notasInternas', 'email', 'costo']) {
  if (proyeccionPublica.includes(prohibido)) {
    fallas.push(
      `src/lib/envios.ts: la proyección pública (tracking/) menciona "${prohibido}". ` +
        `El espejo público NO debe contener datos de contacto ni notas internas.`,
    );
  }
}

// --- Resultado ---
if (fallas.length > 0) {
  console.error('\n❌ Verificación de seguridad FALLIDA:\n');
  for (const falla of fallas) console.error(`   • ${falla}\n`);
  process.exit(1);
}

console.log(`\n✅ Verificación de seguridad OK (${todos.length} archivos revisados).`);
console.log('   • firebase-admin no sale de src/app/api/');
console.log('   • ningún componente escribe a Firestore directamente');
console.log('   • el espejo público no contiene datos de contacto\n');
