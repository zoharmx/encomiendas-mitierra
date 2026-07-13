'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Package, Search, X } from 'lucide-react';
import {
  listarEnvios,
  obtenerEnvio,
  POR_PAGINA,
  type Cursor,
} from '@/lib/consultas';
import { fechaCorta } from '@/lib/fechas';
import { REGEX_FOLIO } from '@/lib/config';
import { ESTATUS_FUERA_DE_FLUJO, FLUJO_ESTATUS, type Envio, type Estatus } from '@/types';
import { etiqueta } from '@/lib/estatus';
import { Boton } from '@/components/ui/Boton';
import { Insignia } from '@/components/ui/Insignia';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { cn } from '@/lib/cn';

const TODOS_LOS_ESTATUS: Estatus[] = [...FLUJO_ESTATUS, ...ESTATUS_FUERA_DE_FLUJO];

export function TablaEnvios() {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [filtro, setFiltro] = useState<Estatus | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paginación por cursor: se guarda la pila de cursores para poder retroceder.
  const [cursores, setCursores] = useState<Cursor[]>([]);
  const [pagina, setPagina] = useState(0);
  const [hayMas, setHayMas] = useState(false);

  // Búsqueda por folio: lectura por ID, no una consulta sobre la lista.
  const [busqueda, setBusqueda] = useState('');
  const [resultado, setResultado] = useState<Envio | null | 'sin-resultado'>(null);
  const [buscando, setBuscando] = useState(false);

  const cargar = useCallback(
    async (nuevaPagina: number, nuevoFiltro: Estatus | null, pila: Cursor[]) => {
      setCargando(true);
      setError(null);
      try {
        const { envios, cursor, hayMas } = await listarEnvios({
          estatus: nuevoFiltro,
          cursor: nuevaPagina > 0 ? (pila[nuevaPagina - 1] ?? null) : null,
        });
        setEnvios(envios);
        setHayMas(hayMas);
        if (cursor) {
          setCursores((previos) => {
            const copia = previos.slice(0, nuevaPagina);
            copia[nuevaPagina] = cursor;
            return copia;
          });
        }
      } catch {
        setError('No se pudieron cargar los envíos. Revisa tu conexión y recarga la página.');
      } finally {
        setCargando(false);
      }
    },
    [],
  );

  useEffect(() => {
    void cargar(0, filtro, []);
    setPagina(0);
    setCursores([]);
  }, [filtro, cargar]);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    const folio = busqueda.trim().toUpperCase();
    if (!folio) return;

    setBuscando(true);
    try {
      const envio = await obtenerEnvio(folio);
      setResultado(envio ?? 'sin-resultado');
    } catch {
      setResultado('sin-resultado');
    } finally {
      setBuscando(false);
    }
  }

  function limpiarBusqueda() {
    setBusqueda('');
    setResultado(null);
  }

  const filas = resultado === null ? envios : resultado === 'sin-resultado' ? [] : [resultado];
  const enModoBusqueda = resultado !== null;

  return (
    <Tarjeta sinPadding>
      {/* --- Barra de filtros + búsqueda --- */}
      <div className="space-y-4 border-b border-white/10 p-4 sm:p-5">
        <form onSubmit={buscar} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value.toUpperCase())}
              placeholder="Buscar por folio: EMT-0001-K3F9"
              aria-label="Buscar por folio"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-10 text-slate-100 placeholder:text-slate-500 focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
            />
            {busqueda && (
              <button
                type="button"
                onClick={limpiarBusqueda}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <Boton type="submit" cargando={buscando} disabled={!busqueda.trim()}>
            Buscar
          </Boton>
        </form>

        {busqueda.trim() && !REGEX_FOLIO.test(busqueda.trim()) && (
          <p className="text-xs text-slate-500">
            El folio completo se ve así: EMT-0001-K3F9 (con los dos guiones).
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <ChipFiltro activo={filtro === null} onClick={() => setFiltro(null)}>
            Todos
          </ChipFiltro>
          {TODOS_LOS_ESTATUS.map((e) => (
            <ChipFiltro key={e} activo={filtro === e} onClick={() => setFiltro(e)}>
              {etiqueta(e)}
            </ChipFiltro>
          ))}
        </div>
      </div>

      {/* --- Contenido --- */}
      {error ? (
        <Vacio titulo="Error de conexión" detalle={error} />
      ) : cargando && !enModoBusqueda ? (
        <Esqueleto />
      ) : filas.length === 0 ? (
        enModoBusqueda ? (
          <Vacio
            titulo="No existe ese folio"
            detalle={`No hay ningún envío con el folio ${busqueda.trim().toUpperCase()}. Revisa que esté completo.`}
          />
        ) : (
          <Vacio
            titulo="Aún no hay envíos"
            detalle={
              filtro
                ? `Ningún envío está en estatus "${etiqueta(filtro)}".`
                : 'Registra el primer envío con el botón "Nuevo envío".'
            }
          />
        )
      ) : (
        <>
          {/* Tabla en escritorio */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-medium">Folio</th>
                  <th className="px-5 py-3 font-medium">Estatus</th>
                  <th className="px-5 py-3 font-medium">Destinatario</th>
                  <th className="px-5 py-3 font-medium">Ruta</th>
                  <th className="px-5 py-3 font-medium">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((envio) => (
                  <tr
                    key={envio.folio}
                    className="border-b border-white/5 transition last:border-0 hover:bg-white/5"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/envio/${envio.folio}`}
                        className="font-mono font-semibold text-blue-400 hover:underline"
                      >
                        {envio.folio}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Insignia estatus={envio.estatus} />
                    </td>
                    <td className="px-5 py-3 text-slate-300">{envio.destinatario.nombre}</td>
                    <td className="px-5 py-3 text-slate-400">
                      {envio.remitente.ciudad} → {envio.destinatario.ciudad}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-400">
                      {fechaCorta(envio.actualizadoEn)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tarjetas en móvil: una tabla de 5 columnas no cabe en un teléfono. */}
          <ul className="divide-y divide-white/5 md:hidden">
            {filas.map((envio) => (
              <li key={envio.folio}>
                <Link
                  href={`/admin/envio/${envio.folio}`}
                  className="block p-4 transition hover:bg-white/5"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-blue-400">{envio.folio}</span>
                    <Insignia estatus={envio.estatus} conIcono={false} />
                  </div>
                  <p className="text-sm text-slate-300">{envio.destinatario.nombre}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {envio.remitente.ciudad} → {envio.destinatario.ciudad} ·{' '}
                    {fechaCorta(envio.actualizadoEn)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {/* Paginación: se oculta durante una búsqueda por folio (siempre da 1 resultado). */}
          {!enModoBusqueda && (pagina > 0 || hayMas) && (
            <div className="flex items-center justify-between gap-4 border-t border-white/10 px-5 py-4">
              <p className="text-sm text-slate-500">
                Página {pagina + 1} · hasta {POR_PAGINA} por página
              </p>
              <div className="flex gap-2">
                <Boton
                  variante="secundario"
                  tamano="sm"
                  disabled={pagina === 0 || cargando}
                  onClick={() => {
                    const anterior = pagina - 1;
                    setPagina(anterior);
                    void cargar(anterior, filtro, cursores);
                  }}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Anterior
                </Boton>
                <Boton
                  variante="secundario"
                  tamano="sm"
                  disabled={!hayMas || cargando}
                  onClick={() => {
                    const siguiente = pagina + 1;
                    setPagina(siguiente);
                    void cargar(siguiente, filtro, cursores);
                  }}
                >
                  Siguiente
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Boton>
              </div>
            </div>
          )}
        </>
      )}
    </Tarjeta>
  );
}

function ChipFiltro({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
        activo
          ? 'border-blue-400/40 bg-blue-500/20 text-blue-200'
          : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

function Esqueleto() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />
      ))}
    </div>
  );
}

function Vacio({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div className="px-5 py-16 text-center">
      <Package className="mx-auto mb-3 size-10 text-slate-600" aria-hidden="true" />
      <p className="font-semibold text-slate-300">{titulo}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{detalle}</p>
    </div>
  );
}
