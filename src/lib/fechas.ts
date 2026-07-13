import type { Timestamp } from 'firebase/firestore';

/**
 * Formateo de fechas en español de México.
 *
 * Los Timestamp pueden llegar como null durante el instante en que un
 * serverTimestamp() todavía no se resuelve en el servidor (Firestore entrega
 * primero una versión local del documento). Por eso todo acepta null.
 */

const ZONA = 'America/Mexico_City';

function aFecha(ts: Timestamp | null | undefined): Date | null {
  if (!ts || typeof ts.toDate !== 'function') return null;
  return ts.toDate();
}

/** "12 de julio de 2026, 14:35" */
export function fechaHora(ts: Timestamp | null | undefined): string {
  const f = aFecha(ts);
  if (!f) return '—';
  return f.toLocaleString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ZONA,
  });
}

/** "12 jul, 14:35" — para tablas, donde el espacio importa. */
export function fechaCorta(ts: Timestamp | null | undefined): string {
  const f = aFecha(ts);
  if (!f) return '—';
  return f.toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ZONA,
  });
}

/** "hace 3 h" — lenguaje natural para el timeline. */
export function haceCuanto(ts: Timestamp | null | undefined): string {
  const f = aFecha(ts);
  if (!f) return '';

  const segundos = Math.round((Date.now() - f.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' });

  const escalas: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 30],
    ['month', 12],
  ];

  let valor = segundos;
  for (const [unidad, factor] of escalas) {
    if (Math.abs(valor) < factor) return rtf.format(-valor, unidad);
    valor = Math.round(valor / factor);
  }
  return rtf.format(-valor, 'year');
}
