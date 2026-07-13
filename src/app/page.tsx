'use client';

import { useRouter } from 'next/navigation';
import { MessageCircle, Phone } from 'lucide-react';
import { NEGOCIO, urlWhatsApp } from '@/lib/config';
import { BuscadorFolio } from '@/components/tracking/BuscadorFolio';
import { Logo } from '@/components/ui/Logo';

export default function Landing() {
  const router = useRouter();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 w-fit rounded-2xl bg-white/95 px-6 py-4 shadow-lg shadow-black/20">
          <Logo variante="completo" alto={48} />
        </div>

        {/* El logo ya dice "MI TIERRA"; el h1 completa el nombre para SEO y lectores de pantalla. */}
        <h1 className="sr-only">{NEGOCIO.nombre}</h1>
        <p className="mt-3 text-lg text-slate-400">{NEGOCIO.descripcion}</p>

        <h2 className="mt-10 mb-4 text-2xl font-semibold">
          <span className="texto-acento">{NEGOCIO.tagline}</span>
        </h2>

        <BuscadorFolio
          onBuscar={(folio) => router.push(`/tracking?folio=${encodeURIComponent(folio)}`)}
        />

        <p className="mt-4 text-sm text-slate-500">
          Tu folio viene en el comprobante que te dimos al enviar tu paquete.
        </p>

        {/* --- Contacto --- */}
        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={urlWhatsApp('Hola, quiero información sobre un envío.')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 font-semibold text-white transition hover:bg-emerald-500 sm:w-auto"
          >
            <MessageCircle className="size-5" aria-hidden="true" />
            WhatsApp {NEGOCIO.whatsappVisible}
          </a>

          <a
            href={`tel:+${NEGOCIO.telefonoAlterno}`}
            className="vidrio flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 font-semibold text-slate-200 transition hover:bg-white/10 sm:w-auto"
          >
            <Phone className="size-5" aria-hidden="true" />
            {NEGOCIO.telefonoAlternoVisible}
          </a>
        </div>
      </div>
    </main>
  );
}
