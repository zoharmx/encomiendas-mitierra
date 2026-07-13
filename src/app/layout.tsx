import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NEGOCIO } from '@/lib/config';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--fuente-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${NEGOCIO.nombre} — ${NEGOCIO.tagline}`,
    template: `%s — ${NEGOCIO.nombre}`,
  },
  description: `${NEGOCIO.descripcion} Consulta el estatus de tu envío con tu número de folio.`,
  metadataBase: new URL(NEGOCIO.sitio),
  openGraph: {
    title: `${NEGOCIO.nombre} — ${NEGOCIO.tagline}`,
    description: NEGOCIO.descripcion,
    type: 'website',
    locale: 'es_MX',
  },
  robots: {
    index: true,
    follow: true,
    // El panel y el detalle de un envío no deben aparecer en buscadores.
    nocache: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={inter.variable}>
      <body className="font-sans antialiased">
        <div className="fondo-animado" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
