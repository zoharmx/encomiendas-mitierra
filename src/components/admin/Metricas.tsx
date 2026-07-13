'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Truck } from 'lucide-react';
import { obtenerMetricas, type Metricas as Datos } from '@/lib/consultas';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { cn } from '@/lib/cn';

const TARJETAS = [
  {
    clave: 'activos',
    etiqueta: 'Envíos activos',
    icono: Truck,
    color: 'text-blue-300 bg-blue-500/15',
  },
  {
    clave: 'entregadosHoy',
    etiqueta: 'Entregados hoy',
    icono: CheckCircle,
    color: 'text-emerald-300 bg-emerald-500/15',
  },
  {
    clave: 'incidencias',
    etiqueta: 'Incidencias abiertas',
    icono: AlertTriangle,
    color: 'text-amber-300 bg-amber-500/15',
  },
] as const satisfies ReadonlyArray<{
  clave: keyof Datos;
  etiqueta: string;
  icono: typeof Truck;
  color: string;
}>;

export function Metricas() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vigente = true;
    obtenerMetricas()
      .then((m) => vigente && setDatos(m))
      .catch(() => vigente && setError(true));
    return () => {
      vigente = false;
    };
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {TARJETAS.map(({ clave, etiqueta, icono: Icono, color }) => (
        <Tarjeta key={clave} className="flex items-center gap-4">
          <span className={cn('flex size-11 items-center justify-center rounded-xl', color)}>
            <Icono className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm text-slate-400">{etiqueta}</p>
            {datos ? (
              <p className="text-2xl font-bold text-white">{datos[clave]}</p>
            ) : error ? (
              <p className="text-2xl font-bold text-slate-600">—</p>
            ) : (
              <div className="mt-1 h-7 w-10 animate-pulse rounded bg-white/10" />
            )}
          </div>
        </Tarjeta>
      ))}
    </div>
  );
}
