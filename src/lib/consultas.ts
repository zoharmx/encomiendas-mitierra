/**
 * Lecturas del panel admin.
 *
 * Contraparte de envios.ts: allí viven las ESCRITURAS, aquí las LECTURAS.
 * Los componentes no consultan Firestore directamente; pasan por estas funciones.
 */
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ESTATUS_ACTIVOS } from '@/lib/estatus';
import type { Envio, Estatus, EventoHistorial } from '@/types';

export const POR_PAGINA = 25;

/** Cursor opaco de paginación: el último documento de la página anterior. */
export type Cursor = QueryDocumentSnapshot<DocumentData>;

export interface PaginaEnvios {
  envios: Envio[];
  /** Pásalo a listarEnvios() para pedir la siguiente página. */
  cursor: Cursor | null;
  /** false cuando ya no quedan más páginas. */
  hayMas: boolean;
}

/**
 * Lista de envíos, ordenada por actualizadoEn desc, 25 por página.
 *
 * El filtro por estatus usa el índice compuesto (estatus, actualizadoEn desc)
 * de firestore.indexes.json. Sin ese índice desplegado, Firestore rechaza la
 * consulta con un enlace para crearlo.
 */
export async function listarEnvios(opciones?: {
  estatus?: Estatus | null;
  cursor?: Cursor | null;
}): Promise<PaginaEnvios> {
  const restricciones: QueryConstraint[] = [];

  if (opciones?.estatus) {
    restricciones.push(where('estatus', '==', opciones.estatus));
  }
  restricciones.push(orderBy('actualizadoEn', 'desc'));
  if (opciones?.cursor) {
    restricciones.push(startAfter(opciones.cursor));
  }
  // Se pide uno de más para saber si hay página siguiente sin una consulta extra.
  restricciones.push(limit(POR_PAGINA + 1));

  const snap = await getDocs(query(collection(db, 'envios'), ...restricciones));

  const docs = snap.docs.slice(0, POR_PAGINA);
  return {
    envios: docs.map((d) => d.data() as Envio),
    cursor: docs.length > 0 ? (docs[docs.length - 1] ?? null) : null,
    hayMas: snap.docs.length > POR_PAGINA,
  };
}

/**
 * Busca UN envío por folio exacto.
 *
 * Es una lectura por ID (el folio es el ID del documento), no una consulta:
 * cuesta 1 lectura y no necesita índice. Por eso el buscador del panel exige
 * el folio completo en vez de hacer búsqueda parcial por nombre, que en
 * Firestore obligaría a un servicio de búsqueda externo de pago.
 */
export async function obtenerEnvio(folio: string): Promise<Envio | null> {
  const snap = await getDoc(doc(db, 'envios', folio.trim().toUpperCase()));
  return snap.exists() ? (snap.data() as Envio) : null;
}

/** Historial interno completo (incluye notas internas). Solo para el panel. */
export async function obtenerHistorial(folio: string): Promise<EventoHistorial[]> {
  const snap = await getDocs(
    query(collection(db, 'envios', folio, 'historial'), orderBy('fecha', 'desc')),
  );
  return snap.docs.map((d) => d.data() as EventoHistorial);
}

export interface Metricas {
  activos: number;
  entregadosHoy: number;
  incidencias: number;
}

/**
 * Métricas del dashboard: 3 consultas de agregación (count).
 *
 * getCountFromServer cuesta 1 lectura por consulta sin importar cuántos
 * documentos cuente. Cargar la lista entera para contarla costaría N.
 */
export async function obtenerMetricas(): Promise<Metricas> {
  const envios = collection(db, 'envios');

  const inicioDeHoy = new Date();
  inicioDeHoy.setHours(0, 0, 0, 0);

  const [activos, entregadosHoy, incidencias] = await Promise.all([
    getCountFromServer(query(envios, where('estatus', 'in', [...ESTATUS_ACTIVOS]))),
    // entregadoEn solo existe cuando el envío se entregó: basta el rango de fecha,
    // que se resuelve con el índice automático de un solo campo.
    getCountFromServer(
      query(envios, where('entregadoEn', '>=', Timestamp.fromDate(inicioDeHoy))),
    ),
    getCountFromServer(query(envios, where('estatus', '==', 'incidencia'))),
  ]);

  return {
    activos: activos.data().count,
    entregadosHoy: entregadosHoy.data().count,
    incidencias: incidencias.data().count,
  };
}
