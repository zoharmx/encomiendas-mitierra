'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Lock,
  MapPin,
  Package,
  PackageX,
  Phone,
  Send,
  User,
} from 'lucide-react';
import { obtenerEnvio, obtenerHistorial } from '@/lib/consultas';
import { CambiarEstatus } from '@/components/admin/CambiarEstatus';
import { Insignia } from '@/components/ui/Insignia';
import { Tarjeta, TituloTarjeta } from '@/components/ui/Tarjeta';
import { Boton } from '@/components/ui/Boton';
import { IconoEstatus } from '@/components/ui/IconoEstatus';
import { fechaHora } from '@/lib/fechas';
import { MENSAJES, telefonoInternacional, urlTracking, urlWhatsApp } from '@/lib/config';
import type { Envio, EventoHistorial, Persona } from '@/types';

export default function DetalleEnvio() {
  const params = useParams<{ folio: string }>();
  const folio = decodeURIComponent(params.folio).toUpperCase();

  const [envio, setEnvio] = useState<Envio | null>(null);
  const [historial, setHistorial] = useState<EventoHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const [e, h] = await Promise.all([obtenerEnvio(folio), obtenerHistorial(folio)]);
      setEnvio(e);
      setHistorial(h);
    } catch {
      setError('No se pudo cargar el envío. Revisa tu conexión y recarga la página.');
    } finally {
      setCargando(false);
    }
  }, [folio]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-400">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        Cargando envío…
      </div>
    );
  }

  if (error || !envio) {
    return (
      <Tarjeta className="mx-auto max-w-lg text-center">
        <PackageX className="mx-auto mb-4 size-10 text-slate-600" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-white">
          {error ? 'Error al cargar' : 'Ese envío no existe'}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {error ?? `No hay ningún envío con el folio ${folio}.`}
        </p>
        <Link href="/admin" className="mt-6 inline-block">
          <Boton variante="secundario">Volver a envíos</Boton>
        </Link>
      </Tarjeta>
    );
  }

  const enlacePublico = urlTracking(envio.folio);
  const telefonoDestinatario = telefonoInternacional(
    envio.destinatario.telefono,
    envio.destinatario.pais,
  );

  return (
    <div className="space-y-6">
      {/* --- Encabezado --- */}
      <div>
        <Link
          href="/admin"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a envíos
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-bold text-white">{envio.folio}</h1>
          <Insignia estatus={envio.estatus} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={urlWhatsApp(
              MENSAJES.compartirTracking(envio.folio, enlacePublico),
              telefonoDestinatario,
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Boton variante="whatsapp" tamano="sm">
              <Send className="size-4" aria-hidden="true" />
              Mandar rastreo al cliente
            </Boton>
          </a>
          <a href={enlacePublico} target="_blank" rel="noopener noreferrer">
            <Boton variante="secundario" tamano="sm">
              <ExternalLink className="size-4" aria-hidden="true" />
              Ver como lo ve el cliente
            </Boton>
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* --- Columna izquierda: datos + historial --- */}
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <FichaPersona titulo="Remitente" persona={envio.remitente} />
            <FichaPersona titulo="Destinatario" persona={envio.destinatario} />
          </div>

          <Tarjeta>
            <TituloTarjeta>Paquete y servicio</TituloTarjeta>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Dato etiqueta="Contenido" valor={envio.paquete.descripcion} ancho />
              <Dato etiqueta="Piezas" valor={String(envio.paquete.piezas)} />
              <Dato etiqueta="Peso" valor={`${envio.paquete.pesoKg} kg`} />
              <Dato
                etiqueta="Valor declarado"
                valor={
                  envio.paquete.valorDeclarado
                    ? `$${envio.paquete.valorDeclarado.toLocaleString('en-US')} USD`
                    : 'No declarado'
                }
              />
              <Dato
                etiqueta="Tipo"
                valor={envio.servicio.tipo === 'aereo' ? 'Aéreo' : 'Terrestre'}
              />
              <Dato
                etiqueta="Costo"
                valor={`$${envio.servicio.costo.toLocaleString('en-US')} ${envio.servicio.moneda}`}
              />
              <Dato
                etiqueta="Pago"
                valor={
                  envio.servicio.pagado
                    ? `Pagado${envio.servicio.formaPago ? ` (${envio.servicio.formaPago})` : ''}`
                    : 'Pendiente de pago'
                }
              />
              <Dato etiqueta="Registrado" valor={fechaHora(envio.creadoEn)} />
              <Dato etiqueta="Última actualización" valor={fechaHora(envio.actualizadoEn)} />
              {envio.entregadoEn && (
                <Dato etiqueta="Entregado" valor={fechaHora(envio.entregadoEn)} />
              )}
            </dl>

            {envio.notasInternas && (
              <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
                  <Lock className="size-3" aria-hidden="true" />
                  Nota interna — el cliente no la ve
                </p>
                <p className="text-sm text-slate-300">{envio.notasInternas}</p>
              </div>
            )}
          </Tarjeta>

          <Tarjeta>
            <TituloTarjeta>Historial completo</TituloTarjeta>
            {historial.length === 0 ? (
              <p className="text-sm text-slate-500">Todavía no hay movimientos.</p>
            ) : (
              <ol className="space-y-4">
                {historial.map((evento, i) => (
                  <li key={`${evento.estatus}-${i}`} className="flex gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-400">
                      <IconoEstatus estatus={evento.estatus} className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Insignia estatus={evento.estatus} conIcono={false} />
                        <span className="text-xs text-slate-500">{fechaHora(evento.fecha)}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{evento.nota}</p>
                      {evento.notaInterna && (
                        <p className="mt-1 flex items-start gap-1.5 text-sm text-amber-300/80">
                          <Lock className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                          {evento.notaInterna}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-600">Por {evento.usuarioNombre}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Tarjeta>
        </div>

        {/* --- Columna derecha: la acción principal --- */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <CambiarEstatus
            folio={envio.folio}
            estatusActual={envio.estatus}
            onCambio={() => void cargar()}
          />
        </div>
      </div>
    </div>
  );
}

function FichaPersona({ titulo, persona }: { titulo: string; persona: Persona }) {
  return (
    <Tarjeta>
      <TituloTarjeta>{titulo}</TituloTarjeta>
      <div className="space-y-2.5 text-sm">
        <p className="flex items-start gap-2 font-medium text-white">
          <User className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
          {persona.nombre}
        </p>
        <p className="flex items-start gap-2">
          <Phone className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
          <a href={`tel:${persona.telefono}`} className="text-blue-400 hover:underline">
            {persona.telefono}
          </a>
        </p>
        <p className="flex items-start gap-2 text-slate-300">
          <MapPin className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
          <span>
            {persona.direccion}
            <br />
            <span className="text-slate-400">
              {persona.ciudad}, {persona.estado} — {persona.pais}
            </span>
          </span>
        </p>
        {persona.email && (
          <p className="flex items-start gap-2 text-slate-400">
            <Package className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
            {persona.email}
          </p>
        )}
      </div>
    </Tarjeta>
  );
}

function Dato({
  etiqueta,
  valor,
  ancho = false,
}: {
  etiqueta: string;
  valor: string;
  ancho?: boolean;
}) {
  return (
    <div className={ancho ? 'col-span-2' : ''}>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{etiqueta}</dt>
      <dd className="mt-0.5 text-slate-200">{valor}</dd>
    </div>
  );
}
