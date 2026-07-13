'use client';

import { AlertTriangle, ArrowRight, Boxes, Share2, User, XCircle } from 'lucide-react';
import { esDeFlujo, etiqueta } from '@/lib/estatus';
import { fechaHora, haceCuanto } from '@/lib/fechas';
import { IconoEstatus } from '@/components/ui/IconoEstatus';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Boton } from '@/components/ui/Boton';
import { NEGOCIO, urlWhatsApp } from '@/lib/config';
import { cn } from '@/lib/cn';
import type { TrackingPublico } from '@/types';

export function TarjetaEnvio({
  envio,
  onCompartir,
}: {
  envio: TrackingPublico;
  onCompartir: () => void;
}) {
  const fueraDeFlujo = !esDeFlujo(envio.estatus);
  const cancelado = envio.estatus === 'cancelado';

  return (
    <Tarjeta>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Folio</p>
          <p className="select-all font-mono text-xl font-bold text-white">{envio.folio}</p>
        </div>

        <Boton variante="secundario" tamano="sm" onClick={onCompartir}>
          <Share2 className="size-4" aria-hidden="true" />
          Compartir
        </Boton>
      </div>

      {/* --- Estatus actual, destacado --- */}
      <div
        className={cn(
          'mt-5 flex items-center gap-4 rounded-2xl border p-4',
          fueraDeFlujo
            ? cancelado
              ? 'border-rose-500/30 bg-rose-500/10'
              : 'border-amber-500/30 bg-amber-500/10'
            : 'border-blue-500/25 bg-blue-500/10',
        )}
      >
        <span
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-xl',
            fueraDeFlujo
              ? cancelado
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-amber-500/20 text-amber-300'
              : 'bg-blue-500/20 text-blue-200',
          )}
        >
          <IconoEstatus estatus={envio.estatus} className="size-6" />
        </span>

        <div className="min-w-0">
          <p
            className={cn(
              'text-lg font-bold',
              fueraDeFlujo ? (cancelado ? 'text-rose-200' : 'text-amber-200') : 'text-white',
            )}
          >
            {etiqueta(envio.estatus)}
          </p>
          <p className="text-sm text-slate-400">
            Actualizado {haceCuanto(envio.actualizadoEn)} · {fechaHora(envio.actualizadoEn)}
          </p>
        </div>
      </div>

      {/* --- Alerta fuera de flujo: incidencia / cancelado --- */}
      {fueraDeFlujo && (
        <div
          role="alert"
          className={cn(
            'mt-4 flex items-start gap-3 rounded-xl border p-4 text-sm',
            cancelado
              ? 'border-rose-500/25 bg-rose-500/5 text-rose-200'
              : 'border-amber-500/25 bg-amber-500/5 text-amber-200',
          )}
        >
          {cancelado ? (
            <XCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          )}
          <div>
            <p className="font-semibold">
              {cancelado ? 'Este envío fue cancelado' : 'Tu envío tiene una incidencia'}
            </p>
            <p className="mt-1 opacity-90">
              {cancelado
                ? 'Si no esperabas esta cancelación, escríbenos y lo revisamos.'
                : 'Estamos resolviéndola. Si quieres detalles ahora, escríbenos por WhatsApp.'}
            </p>
            <a
              href={urlWhatsApp(
                `Hola, tengo una consulta sobre mi envío ${envio.folio}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-semibold underline underline-offset-2"
            >
              Escribir al {NEGOCIO.whatsappVisible}
            </a>
          </div>
        </div>
      )}

      {/* --- Ruta y datos --- */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-xs uppercase tracking-wider text-slate-500">Ruta</p>
          <p className="flex flex-wrap items-center gap-2 font-medium text-slate-200">
            {envio.origen}
            <ArrowRight className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
            {envio.destino}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:col-span-1">
          <div>
            <p className="mb-1.5 text-xs uppercase tracking-wider text-slate-500">Piezas</p>
            <p className="flex items-center gap-1.5 font-medium text-slate-200">
              <Boxes className="size-4 text-slate-500" aria-hidden="true" />
              {envio.piezas}
            </p>
          </div>
          <div>
            <p className="mb-1.5 text-xs uppercase tracking-wider text-slate-500">Recibe</p>
            <p className="flex items-center gap-1.5 font-medium text-slate-200">
              <User className="size-4 text-slate-500" aria-hidden="true" />
              {envio.destinatarioIniciales}
            </p>
          </div>
        </div>
      </div>
    </Tarjeta>
  );
}
