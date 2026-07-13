'use client';

/**
 * Rastreo público. No requiere autenticación.
 *
 * La consulta va DIRECTA a Firestore (consultarTracking → 1 lectura por folio),
 * protegida por firestore.rules: `allow get: if true` pero `allow list: if esStaff()`,
 * o sea que nadie puede enumerar la colección para cosechar datos.
 *
 * ── Rate limiting ──────────────────────────────────────────────────────────
 * No hay, y en v1 no hace falta: no existe un endpoint propio que abusar, y la
 * cuota gratuita de Firestore (50 mil lecturas/día) está muy por encima del
 * tráfico real. El folio lleva sufijo aleatorio, así que la fuerza bruta tampoco
 * es rentable.
 *
 * Si algún día se mete la consulta detrás de una API route (por ejemplo para
 * cachear o para registrar métricas), el limitador va AHÍ: en esa route, por IP,
 * antes de tocar Firestore. Este componente seguiría igual, solo cambiaría
 * consultarTracking() por un fetch a la route.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageCircle, PackageSearch, Phone, WifiOff } from 'lucide-react';
import { consultarTracking } from '@/lib/envios';
import { esDeFlujo } from '@/lib/estatus';
import { MENSAJES, NEGOCIO, urlWhatsApp } from '@/lib/config';
import { BuscadorFolio } from '@/components/tracking/BuscadorFolio';
import { TarjetaEnvio } from '@/components/tracking/TarjetaEnvio';
import { TimelineEstatus } from '@/components/tracking/TimelineEstatus';
import { HistorialMovimientos } from '@/components/tracking/HistorialMovimientos';
import { ModalCompartir } from '@/components/tracking/ModalCompartir';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Boton } from '@/components/ui/Boton';
import { Logo } from '@/components/ui/Logo';
import type { Estatus, TrackingPublico } from '@/types';

type Estado =
  | { tipo: 'inicial' }
  | { tipo: 'cargando' }
  | { tipo: 'encontrado'; envio: TrackingPublico }
  | { tipo: 'no-encontrado'; folio: string }
  | { tipo: 'error' };

function Rastreo() {
  const router = useRouter();
  const parametros = useSearchParams();
  const folioUrl = parametros.get('folio')?.trim().toUpperCase() ?? '';

  const [estado, setEstado] = useState<Estado>({ tipo: 'inicial' });
  const [compartiendo, setCompartiendo] = useState(false);

  const consultar = useCallback(async (folio: string) => {
    setEstado({ tipo: 'cargando' });
    try {
      const envio = await consultarTracking(folio);
      setEstado(envio ? { tipo: 'encontrado', envio } : { tipo: 'no-encontrado', folio });
    } catch {
      setEstado({ tipo: 'error' });
    }
  }, []);

  // Los enlaces compartidos (?folio=…) deben abrir ya resueltos, sin un clic más.
  useEffect(() => {
    if (folioUrl) void consultar(folioUrl);
    else setEstado({ tipo: 'inicial' });
  }, [folioUrl, consultar]);

  /** Buscar = cambiar la URL. Así el resultado es enlazable y el "atrás" funciona. */
  function buscar(folio: string) {
    router.push(`/tracking?folio=${encodeURIComponent(folio)}`);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 py-8 sm:py-12">
      <header className="mb-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-white"
        >
          <Logo variante="emblema" alto={20} />
          {NEGOCIO.nombreCorto}
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Rastrea tu <span className="texto-acento">envío</span>
        </h1>
        <p className="mt-2 text-slate-400">Escribe el folio que te dimos al enviar tu paquete.</p>
      </header>

      <div className="mb-8">
        <BuscadorFolio
          valorInicial={folioUrl}
          onBuscar={buscar}
          cargando={estado.tipo === 'cargando'}
          autoFocus={!folioUrl}
        />
      </div>

      {estado.tipo === 'cargando' && <Esqueleto />}

      {estado.tipo === 'encontrado' && (
        <div className="space-y-6">
          <TarjetaEnvio envio={estado.envio} onCompartir={() => setCompartiendo(true)} />

          <Tarjeta>
            <TimelineEstatus
              estatus={estado.envio.estatus}
              ultimoDelFlujo={ultimoEstatusDeFlujo(estado.envio)}
            />
          </Tarjeta>

          <HistorialMovimientos historial={estado.envio.historial} />

          <p className="text-center text-sm text-slate-500">
            ¿Alguna duda con tu envío?{' '}
            <a
              href={urlWhatsApp(`Hola, tengo una duda sobre mi envío ${estado.envio.folio}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-400 hover:underline"
            >
              Escríbenos por WhatsApp
            </a>
          </p>
        </div>
      )}

      {estado.tipo === 'no-encontrado' && <NoEncontrado folio={estado.folio} />}
      {estado.tipo === 'error' && <ErrorDeRed onReintentar={() => void consultar(folioUrl)} />}

      {compartiendo && estado.tipo === 'encontrado' && (
        <ModalCompartir folio={estado.envio.folio} onCerrar={() => setCompartiendo(false)} />
      )}
    </main>
  );
}

/**
 * Último estatus del flujo por el que pasó el envío.
 *
 * Sirve para que, si ahora está en incidencia, el timeline no se reinicie: el
 * cliente sigue viendo hasta dónde llegó su paquete antes del contratiempo.
 */
function ultimoEstatusDeFlujo(envio: TrackingPublico): Estatus | undefined {
  for (let i = envio.historial.length - 1; i >= 0; i--) {
    const estatus = envio.historial[i]?.estatus;
    if (estatus && esDeFlujo(estatus)) return estatus;
  }
  return undefined;
}

function Esqueleto() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Consultando tu envío">
      <div className="h-56 animate-pulse rounded-2xl bg-white/5" />
      <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
      <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
    </div>
  );
}

function NoEncontrado({ folio }: { folio: string }) {
  return (
    <Tarjeta className="text-center">
      <PackageSearch className="mx-auto mb-4 size-12 text-slate-600" aria-hidden="true" />
      <h2 className="text-lg font-bold text-white">No encontramos ese folio</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
        No hay ningún envío con el folio{' '}
        <span className="font-mono text-slate-300">{folio}</span>. Revisa que esté completo y sin
        letras de más. Si acabas de enviar tu paquete, puede tardar unos minutos en aparecer.
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <a
          href={urlWhatsApp(MENSAJES.folioNoEncontrado(folio))}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Boton variante="whatsapp" tamano="lg" anchoCompleto>
            <MessageCircle className="size-5" aria-hidden="true" />
            Escríbenos por WhatsApp
          </Boton>
        </a>
        <a href={`tel:+${NEGOCIO.whatsapp}`}>
          <Boton variante="secundario" tamano="lg" anchoCompleto>
            <Phone className="size-5" aria-hidden="true" />
            {NEGOCIO.whatsappVisible}
          </Boton>
        </a>
      </div>
    </Tarjeta>
  );
}

function ErrorDeRed({ onReintentar }: { onReintentar: () => void }) {
  return (
    <Tarjeta className="text-center">
      <WifiOff className="mx-auto mb-4 size-12 text-slate-600" aria-hidden="true" />
      <h2 className="text-lg font-bold text-white">No pudimos consultar tu envío</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
        Puede ser tu conexión a internet. Revisa que tengas señal e intenta otra vez.
      </p>
      <Boton variante="secundario" tamano="lg" className="mt-6" onClick={onReintentar}>
        Intentar de nuevo
      </Boton>
    </Tarjeta>
  );
}

export default function PaginaTracking() {
  return (
    // useSearchParams exige un límite de Suspense en el App Router.
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Rastreo />
    </Suspense>
  );
}
