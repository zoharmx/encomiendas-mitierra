/**
 * Lógica del catálogo de estatus.
 *
 * El catálogo (los nombres, etiquetas e íconos) vive en src/types/index.ts —
 * ÚNICA fuente de verdad. Aquí solo van las funciones que lo interpretan.
 * Cambiar el flujo del negocio = editar FLUJO_ESTATUS, no tocar este archivo.
 */
import {
  ESTATUS_FUERA_DE_FLUJO,
  ESTATUS_META,
  FLUJO_ESTATUS,
  type Estatus,
  type EstatusFlujo,
} from '@/types';

/** ¿El estatus forma parte del flujo lineal (registrado → … → entregado)? */
export function esDeFlujo(estatus: Estatus): estatus is EstatusFlujo {
  return (FLUJO_ESTATUS as readonly string[]).includes(estatus);
}

/** Posición en el flujo, o -1 si está fuera de él (incidencia / cancelado). */
export function indiceFlujo(estatus: Estatus): number {
  return (FLUJO_ESTATUS as readonly string[]).indexOf(estatus);
}

/** Estatus terminales: ya no admiten cambios de estatus posteriores. */
export const ESTATUS_FINALES: readonly Estatus[] = ['entregado', 'cancelado'];

export function esFinal(estatus: Estatus): boolean {
  return ESTATUS_FINALES.includes(estatus);
}

/** Estatus "activos": el envío sigue en curso. Los usa la métrica del dashboard. */
export const ESTATUS_ACTIVOS: readonly Estatus[] = FLUJO_ESTATUS.filter(
  (e) => e !== 'entregado',
);

/**
 * Transiciones que el panel ofrece desde un estatus dado.
 *
 * Regla del negocio (deliberadamente simple):
 *   - desde un estatus del flujo → el SIGUIENTE del flujo, + incidencia + cancelado
 *   - desde `incidencia`         → se puede retomar el flujo en cualquier punto,
 *     porque una incidencia se resuelve volviendo a donde estaba el paquete
 *   - desde `entregado` o `cancelado` → ninguna (son finales)
 *
 * Nunca se ofrece retroceder en el flujo: el historial es la bitácora del
 * negocio y debe leerse hacia adelante.
 */
export function transicionesValidas(actual: Estatus): Estatus[] {
  if (esFinal(actual)) return [];

  if (actual === 'incidencia') {
    return [...FLUJO_ESTATUS, 'cancelado'];
  }

  const siguiente = FLUJO_ESTATUS[indiceFlujo(actual) + 1];
  return [...(siguiente ? [siguiente] : []), ...ESTATUS_FUERA_DE_FLUJO];
}

/** Etiqueta legible para el cliente. */
export function etiqueta(estatus: Estatus): string {
  return ESTATUS_META[estatus].etiqueta;
}

/** Clases de color por estatus. Centralizadas para que la UI sea consistente. */
export function colorEstatus(estatus: Estatus): string {
  if (estatus === 'entregado') {
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  }
  if (estatus === 'incidencia') {
    return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  }
  if (estatus === 'cancelado') {
    return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  }
  if (estatus === 'registrado') {
    return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  }
  return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
}
