import {
  doc, collection, getDoc, writeBatch, runTransaction,
  serverTimestamp, Timestamp, arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Envio, Estatus, EventoHistorial, TrackingPublico, Persona,
} from '../types';

// ============================================================
// 1. Generación de folio: EMT-2607-K3F9
//    Consecutivo (transacción) + sufijo aleatorio (anti-enumeración).
// ============================================================
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin O/0/I/1 (confusión al dictar)

function sufijoAleatorio(largo = 4): string {
  const bytes = crypto.getRandomValues(new Uint8Array(largo));
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join('');
}

export async function generarFolio(): Promise<string> {
  const ref = doc(db, 'contadores', 'folios');

  const consecutivo = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const ultimo = snap.exists() ? (snap.data().ultimo as number) : 0;
    const siguiente = ultimo + 1;
    tx.set(ref, { ultimo: siguiente }, { merge: true });
    return siguiente;
  });

  return `EMT-${String(consecutivo).padStart(4, '0')}-${sufijoAleatorio()}`;
}

// ============================================================
// 2. Proyección pública: qué SÍ se expone.
//    Todo lo que no esté aquí, no sale. Punto.
// ============================================================
function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() + '.')
    .join('');
}

function ubicacion(p: Persona): string {
  return `${p.ciudad}, ${p.estado}`;
}

// ============================================================
// 3. Crear envío — escribe interno + espejo público + primer evento.
//    Batch: los tres o ninguno.
// ============================================================
export async function crearEnvio(
  datos: Omit<Envio, 'folio' | 'estatus' | 'creadoEn' | 'actualizadoEn' | 'entregadoEn'>,
  usuario: { uid: string; nombre: string },
): Promise<string> {
  const folio = await generarFolio();
  const batch = writeBatch(db);

  const envioRef = doc(db, 'envios', folio);
  const trackingRef = doc(db, 'tracking', folio);
  const eventoRef = doc(collection(db, 'envios', folio, 'historial'));

  const ahora = serverTimestamp();
  const nota = 'Envío registrado en el sistema.';

  // --- Interno (todo) ---
  batch.set(envioRef, {
    ...datos,
    folio,
    estatus: 'registrado' as Estatus,
    creadoEn: ahora,
    actualizadoEn: ahora,
    entregadoEn: null,
    creadoPor: usuario.uid,
  });

  // --- Historial interno ---
  batch.set(eventoRef, {
    estatus: 'registrado',
    fecha: ahora,
    nota,
    notaInterna: '',
    usuarioId: usuario.uid,
    usuarioNombre: usuario.nombre,
  } satisfies Omit<EventoHistorial, 'fecha'> & { fecha: unknown });

  // --- Espejo público (SOLO campos seguros) ---
  const publico: Omit<TrackingPublico, 'creadoEn' | 'actualizadoEn' | 'historial'> & {
    creadoEn: unknown; actualizadoEn: unknown; historial: unknown[];
  } = {
    folio,
    estatus: 'registrado',
    creadoEn: ahora,
    actualizadoEn: ahora,
    origen: ubicacion(datos.remitente),
    destino: ubicacion(datos.destinatario),
    destinatarioIniciales: iniciales(datos.destinatario.nombre),
    piezas: datos.paquete.piezas,
    // El array no admite serverTimestamp() dentro: se usa la hora del cliente.
    historial: [{ estatus: 'registrado', fecha: Timestamp.now(), nota }],
  };
  batch.set(trackingRef, publico);

  await batch.commit();
  return folio;
}

// ============================================================
// 4. Cambiar estatus — LA operación central del sistema.
//    Actualiza: envío + evento de historial + espejo público. Atómico.
// ============================================================
export async function cambiarEstatus(
  folio: string,
  nuevoEstatus: Estatus,
  opciones: {
    nota: string;            // visible al cliente
    notaInterna?: string;    // privada
    usuario: { uid: string; nombre: string };
  },
): Promise<void> {
  const { nota, notaInterna = '', usuario } = opciones;

  const envioRef = doc(db, 'envios', folio);
  const trackingRef = doc(db, 'tracking', folio);
  const eventoRef = doc(collection(db, 'envios', folio, 'historial'));

  const snap = await getDoc(envioRef);
  if (!snap.exists()) throw new Error(`El envío ${folio} no existe.`);

  const ahora = serverTimestamp();
  const ahoraTs = Timestamp.now(); // para el array del espejo
  const batch = writeBatch(db);

  batch.update(envioRef, {
    estatus: nuevoEstatus,
    actualizadoEn: ahora,
    ...(nuevoEstatus === 'entregado' ? { entregadoEn: ahora } : {}),
  });

  batch.set(eventoRef, {
    estatus: nuevoEstatus,
    fecha: ahora,
    nota,
    notaInterna,
    usuarioId: usuario.uid,
    usuarioNombre: usuario.nombre,
  });

  batch.update(trackingRef, {
    estatus: nuevoEstatus,
    actualizadoEn: ahora,
    historial: arrayUnion({ estatus: nuevoEstatus, fecha: ahoraTs, nota }),
  });

  await batch.commit();
}

// ============================================================
// 5. Consulta pública — 1 sola lectura (historial embebido).
//    No requiere autenticación.
// ============================================================
export async function consultarTracking(
  folio: string,
): Promise<TrackingPublico | null> {
  const snap = await getDoc(doc(db, 'tracking', folio.trim().toUpperCase()));
  return snap.exists() ? (snap.data() as TrackingPublico) : null;
}
