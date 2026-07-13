'use client';

import { Check } from 'lucide-react';
import { FLUJO_ESTATUS, type Estatus } from '@/types';
import { esDeFlujo, etiqueta, indiceFlujo } from '@/lib/estatus';
import { IconoEstatus } from '@/components/ui/IconoEstatus';
import { cn } from '@/lib/cn';

/**
 * Línea de progreso con los estados del flujo.
 *
 * Los estatus fuera de flujo (incidencia, cancelado) NO se pintan aquí: se
 * muestran aparte con estilo de alerta. Cuando el envío está en uno de ellos,
 * el timeline conserva el avance que llevaba (`ultimoDelFlujo`) para que el
 * cliente siga viendo hasta dónde llegó su paquete.
 *
 * En móvil el timeline es vertical (la mayoría abre esto desde WhatsApp);
 * en escritorio, horizontal.
 */
export function TimelineEstatus({
  estatus,
  ultimoDelFlujo,
}: {
  estatus: Estatus;
  /** Último estatus del flujo por el que pasó, si el actual está fuera de flujo. */
  ultimoDelFlujo?: Estatus;
}) {
  const referencia = esDeFlujo(estatus) ? estatus : (ultimoDelFlujo ?? 'registrado');
  const actual = indiceFlujo(referencia);
  // El envío está "detenido" si su estatus actual salió del flujo: nada late.
  const detenido = !esDeFlujo(estatus);

  const total = FLUJO_ESTATUS.length - 1;
  const progreso = total > 0 ? (Math.max(actual, 0) / total) * 100 : 0;

  return (
    <div>
      {/* --- Barra de progreso --- */}
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          role="progressbar"
          aria-valuenow={Math.round(progreso)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Avance del envío"
          className={cn(
            'h-full rounded-full transition-[width] duration-700 ease-out',
            detenido
              ? 'bg-amber-500/60'
              : 'bg-gradient-to-r from-[var(--color-marca-de)] to-[var(--color-marca-a)]',
          )}
          style={{ width: `${progreso}%` }}
        />
      </div>

      <ol className="flex flex-col gap-0 sm:flex-row sm:gap-2">
        {FLUJO_ESTATUS.map((paso, i) => {
          const completado = i < actual;
          const activo = i === actual && !detenido;
          const enPausa = i === actual && detenido;
          const pendiente = i > actual;
          const ultimo = i === FLUJO_ESTATUS.length - 1;

          return (
            <li key={paso} className="flex flex-1 gap-3 sm:flex-col sm:items-center sm:gap-2">
              {/* Columna del círculo (+ línea vertical en móvil) */}
              <div className="flex flex-col items-center sm:w-full sm:flex-row">
                {/* Segmento izquierdo de la línea (solo escritorio) */}
                <span
                  className={cn(
                    'hidden h-0.5 flex-1 sm:block',
                    i === 0 ? 'opacity-0' : completado || activo || enPausa ? 'bg-emerald-500/60' : 'bg-white/10',
                  )}
                />

                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition',
                    completado && 'border-emerald-500 bg-emerald-500/20 text-emerald-300',
                    activo &&
                      'pulso border-blue-400 bg-blue-500/20 text-blue-200',
                    enPausa && 'border-amber-500 bg-amber-500/20 text-amber-300',
                    pendiente && 'border-white/15 bg-white/5 text-slate-600',
                  )}
                  aria-hidden="true"
                >
                  {completado ? (
                    <Check className="size-4" />
                  ) : (
                    <IconoEstatus estatus={paso} className="size-4" />
                  )}
                </span>

                {/* Segmento derecho (escritorio) */}
                <span
                  className={cn(
                    'hidden h-0.5 flex-1 sm:block',
                    ultimo ? 'opacity-0' : completado ? 'bg-emerald-500/60' : 'bg-white/10',
                  )}
                />

                {/* Línea vertical (móvil) */}
                {!ultimo && (
                  <span
                    className={cn(
                      'w-0.5 flex-1 sm:hidden',
                      completado ? 'bg-emerald-500/60' : 'bg-white/10',
                    )}
                  />
                )}
              </div>

              {/* Etiqueta */}
              <p
                className={cn(
                  'pb-6 text-sm sm:pb-0 sm:text-center sm:text-xs',
                  completado && 'text-slate-400',
                  activo && 'font-semibold text-white',
                  enPausa && 'font-semibold text-amber-300',
                  pendiente && 'text-slate-600',
                )}
              >
                {etiqueta(paso)}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
