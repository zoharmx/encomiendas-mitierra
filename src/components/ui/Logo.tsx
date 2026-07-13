import Image from 'next/image';
import { NEGOCIO } from '@/lib/config';

/**
 * Logo oficial de la marca. Dos variantes, del mismo archivo fuente
 * (public/logo.png), recortadas una sola vez:
 *
 *   - "emblema" — solo el globo, para espacios compactos (favicon, badges).
 *   - "completo" — el globo + "MI TIERRA", para encabezados con espacio.
 *
 * Fondo transparente: funciona igual sobre el tema oscuro que sobre blanco.
 */
export function Logo({
  variante = 'emblema',
  className = '',
  alto = 32,
}: {
  variante?: 'emblema' | 'completo';
  className?: string;
  alto?: number;
}) {
  const esEmblema = variante === 'emblema';
  // Proporciones reales de cada recorte, para que next/image no la deforme.
  const ancho = esEmblema ? Math.round((217 / 165) * alto) : Math.round((709 / 169) * alto);

  return (
    <Image
      src={esEmblema ? '/logo-emblema.png' : '/logo.png'}
      alt={NEGOCIO.nombre}
      width={ancho}
      height={alto}
      className={className}
      priority
    />
  );
}
