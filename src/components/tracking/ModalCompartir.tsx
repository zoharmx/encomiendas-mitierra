'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { Check, Copy, Send, X } from 'lucide-react';
import { MENSAJES, urlTracking, urlWhatsApp } from '@/lib/config';
import { Boton } from '@/components/ui/Boton';

/**
 * Modal para compartir el rastreo: QR + copiar enlace + WhatsApp.
 *
 * El QR se genera localmente con la librería `qrcode` (nada sale a internet:
 * los servicios tipo "api.qrserver.com" verían todos los folios de los clientes).
 */
export function ModalCompartir({ folio, onCerrar }: { folio: string; onCerrar: () => void }) {
  const [qr, setQr] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const dialogo = useRef<HTMLDivElement>(null);
  const enlace = urlTracking(folio);

  useEffect(() => {
    QRCode.toDataURL(enlace, {
      width: 512,
      margin: 2,
      // Fondo blanco a propósito: un QR oscuro no lo lee la mitad de los lectores.
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [enlace]);

  // Cerrar con Escape y bloquear el scroll del fondo.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alTeclear);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogo.current?.focus();

    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onCerrar]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el enlace se ve completo abajo del QR.
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-compartir"
        tabIndex={-1}
        className="vidrio w-full max-w-sm rounded-3xl p-6 shadow-2xl outline-none"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="titulo-compartir" className="text-lg font-bold text-white">
            Compartir rastreo
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mb-5 flex justify-center">
          {qr ? (
            <Image
              src={qr}
              alt={`Código QR del rastreo del folio ${folio}`}
              width={200}
              height={200}
              unoptimized
              className="rounded-2xl bg-white p-2"
            />
          ) : (
            <div className="size-[200px] animate-pulse rounded-2xl bg-white/10" />
          )}
        </div>

        <p className="mb-1 text-center font-mono text-sm font-semibold text-white">{folio}</p>
        <p className="mb-5 break-all text-center text-xs text-slate-500">{enlace}</p>

        <div className="space-y-2">
          <Boton variante="secundario" tamano="lg" anchoCompleto onClick={copiar}>
            {copiado ? (
              <Check className="size-5 text-emerald-400" aria-hidden="true" />
            ) : (
              <Copy className="size-5" aria-hidden="true" />
            )}
            {copiado ? 'Enlace copiado' : 'Copiar enlace'}
          </Boton>

          <a
            href={urlWhatsApp(MENSAJES.compartirTracking(folio, enlace), '')}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Boton variante="whatsapp" tamano="lg" anchoCompleto>
              <Send className="size-5" aria-hidden="true" />
              Compartir por WhatsApp
            </Boton>
          </a>
        </div>
      </div>
    </div>
  );
}
