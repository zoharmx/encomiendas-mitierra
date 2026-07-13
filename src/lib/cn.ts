/**
 * Une clases condicionales. Sin dependencias: `clsx` sería 1 KB para esto.
 */
export function cn(...clases: Array<string | false | null | undefined>): string {
  return clases.filter(Boolean).join(' ');
}
