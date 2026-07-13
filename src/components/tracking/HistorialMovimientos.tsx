'use client';

import { fechaHora } from '@/lib/fechas';
import { etiqueta } from '@/lib/estatus';
import { IconoEstatus } from '@/components/ui/IconoEstatus';
import { Tarjeta, TituloTarjeta } from '@/components/ui/Tarjeta';
import type { EventoPublico } from '@/types';

/**
 * Movimientos del envío, del más reciente al más viejo.
 *
 * Solo muestra la nota pública: el espejo tracking/ no contiene notas internas
 * (ver src/lib/envios.ts), así que aquí no hay nada privado que filtrar.
 */
export function HistorialMovimientos({ historial }: { historial: EventoPublico[] }) {
  if (historial.length === 0) return null;

  // El array llega en orden cronológico; se invierte una copia para no mutarlo.
  const recientesPrimero = [...historial].reverse();

  return (
    <Tarjeta>
      <TituloTarjeta>Movimientos</TituloTarjeta>

      <ol className="space-y-1">
        {recientesPrimero.map((evento, i) => {
          const esUltimo = i === recientesPrimero.length - 1;

          return (
            <li key={`${evento.estatus}-${i}`} className="flex gap-3">
              {/* Riel: ícono + línea de conexión */}
              <div className="flex flex-col items-center">
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                    i === 0
                      ? 'bg-blue-500/20 text-blue-200'
                      : 'bg-white/5 text-slate-500'
                  }`}
                >
                  <IconoEstatus estatus={evento.estatus} className="size-4" />
                </span>
                {!esUltimo && <span className="w-px flex-1 bg-white/10" />}
              </div>

              <div className={`min-w-0 flex-1 ${esUltimo ? 'pb-0' : 'pb-5'}`}>
                <p
                  className={`text-sm font-semibold ${
                    i === 0 ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {etiqueta(evento.estatus)}
                </p>
                <p className="text-xs text-slate-500">{fechaHora(evento.fecha)}</p>
                {evento.nota && <p className="mt-1 text-sm text-slate-400">{evento.nota}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </Tarjeta>
  );
}
