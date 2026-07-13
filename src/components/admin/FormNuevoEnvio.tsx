'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, PackagePlus, PartyPopper, Send } from 'lucide-react';
import { crearEnvio } from '@/lib/envios';
import { useSesion } from '@/lib/auth-context';
import {
  ESTADOS_EEUU,
  MENSAJES,
  PAISES_DESTINO,
  telefonoInternacional,
  urlTracking,
  urlWhatsApp,
} from '@/lib/config';
import { Boton } from '@/components/ui/Boton';
import { Input, Select, Textarea } from '@/components/ui/Campo';
import { Tarjeta, TituloTarjeta } from '@/components/ui/Tarjeta';

/** Solo los dígitos: el operador puede escribir "81 1234 5678" y sigue siendo válido. */
const soloDigitos = (v: string) => v.replace(/\D/g, '');

interface Formulario {
  remNombre: string;
  remTelefono: string;
  remEmail: string;
  remCiudad: string;
  remEstado: string;
  remDireccion: string;

  desNombre: string;
  desTelefono: string;
  desPais: string;
  desEmail: string;
  desCiudad: string;
  desEstado: string;
  desDireccion: string;

  descripcion: string;
  piezas: string;
  pesoKg: string;
  valorDeclarado: string;

  tipo: 'terrestre' | 'aereo';
  costo: string;
  pagado: string;
  formaPago: string;

  notasInternas: string;
}

const VACIO: Formulario = {
  remNombre: '', remTelefono: '', remEmail: '', remCiudad: '', remEstado: '', remDireccion: '',
  desNombre: '', desTelefono: '', desPais: '', desEmail: '', desCiudad: '', desEstado: '', desDireccion: '',
  descripcion: '', piezas: '1', pesoKg: '', valorDeclarado: '',
  tipo: 'terrestre', costo: '', pagado: 'no', formaPago: '',
  notasInternas: '',
};

type Errores = Partial<Record<keyof Formulario, string>>;

function validar(f: Formulario): Errores {
  const e: Errores = {};
  const requerido = 'Este dato es obligatorio.';

  if (!f.remNombre.trim()) e.remNombre = requerido;
  // El remitente siempre se recolecta en EE. UU.: el teléfono es de 10 dígitos.
  if (soloDigitos(f.remTelefono).length !== 10) {
    e.remTelefono = 'El teléfono debe tener 10 dígitos.';
  }
  if (!f.remCiudad.trim()) e.remCiudad = requerido;
  if (!f.remEstado.trim()) e.remEstado = requerido;
  if (!f.remDireccion.trim()) e.remDireccion = requerido;

  if (!f.desNombre.trim()) e.desNombre = requerido;
  // El destinatario puede estar en EE. UU./México (10 dígitos) o Centroamérica
  // (7-8 dígitos, según el país): se acepta un rango en vez de un número fijo.
  const digitosDestino = soloDigitos(f.desTelefono).length;
  if (digitosDestino < 7 || digitosDestino > 10) {
    e.desTelefono = 'Revisa el teléfono: debe tener entre 7 y 10 dígitos.';
  }
  if (!f.desPais) e.desPais = requerido;
  if (!f.desCiudad.trim()) e.desCiudad = requerido;
  if (!f.desEstado.trim()) e.desEstado = requerido;
  if (!f.desDireccion.trim()) e.desDireccion = requerido;

  if (!f.descripcion.trim()) e.descripcion = requerido;

  const piezas = Number(f.piezas);
  if (!Number.isInteger(piezas) || piezas < 1) e.piezas = 'Debe ser un número entero de 1 o más.';

  const peso = Number(f.pesoKg);
  if (!f.pesoKg.trim() || Number.isNaN(peso) || peso <= 0) e.pesoKg = 'Escribe el peso en kilos.';

  const costo = Number(f.costo);
  if (!f.costo.trim() || Number.isNaN(costo) || costo < 0) e.costo = 'Escribe el costo del envío.';

  if (f.valorDeclarado.trim() && Number.isNaN(Number(f.valorDeclarado))) {
    e.valorDeclarado = 'Debe ser un número.';
  }

  return e;
}

export function FormNuevoEnvio() {
  const { usuarioActual } = useSesion();
  const [f, setF] = useState<Formulario>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [folioCreado, setFolioCreado] = useState<string | null>(null);

  function set<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
    setF((previo) => ({ ...previo, [campo]: valor }));
    // El error se limpia al corregir, no al re-enviar: menos frustrante.
    setErrores((previos) => ({ ...previos, [campo]: undefined }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioActual) return;

    const nuevos = validar(f);
    if (Object.keys(nuevos).length > 0) {
      setErrores(nuevos);
      setErrorGeneral('Revisa los campos marcados en rojo.');
      // Lleva al operador al primer campo con problema.
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }

    setErrores({});
    setErrorGeneral(null);
    setGuardando(true);

    try {
      const folio = await crearEnvio(
        {
          remitente: {
            nombre: f.remNombre.trim(),
            telefono: soloDigitos(f.remTelefono),
            email: f.remEmail.trim(),
            ciudad: f.remCiudad.trim(),
            estado: f.remEstado.trim().toUpperCase(),
            direccion: f.remDireccion.trim(),
            // El remitente siempre se recolecta en EE. UU.
            pais: 'Estados Unidos',
          },
          destinatario: {
            nombre: f.desNombre.trim(),
            telefono: soloDigitos(f.desTelefono),
            email: f.desEmail.trim(),
            ciudad: f.desCiudad.trim(),
            estado: f.desEstado.trim(),
            direccion: f.desDireccion.trim(),
            pais: f.desPais,
          },
          paquete: {
            descripcion: f.descripcion.trim(),
            piezas: Number(f.piezas),
            pesoKg: Number(f.pesoKg),
            valorDeclarado: f.valorDeclarado.trim() ? Number(f.valorDeclarado) : null,
            fotoUrl: null,
          },
          servicio: {
            tipo: f.tipo,
            costo: Number(f.costo),
            moneda: 'USD',
            pagado: f.pagado === 'si',
            formaPago: f.formaPago.trim() || null,
          },
          notasInternas: f.notasInternas.trim(),
          creadoPor: usuarioActual.uid,
        },
        usuarioActual,
      );

      setFolioCreado(folio);
    } catch {
      setErrorGeneral(
        'No se pudo guardar el envío. Revisa tu conexión e intenta de nuevo. ' +
          'Si el problema sigue, avisa al administrador.',
      );
      setGuardando(false);
    }
  }

  if (folioCreado) {
    return (
      <Exito
        folio={folioCreado}
        telefonoCliente={soloDigitos(f.desTelefono)}
        paisCliente={f.desPais}
        onOtro={() => {
          setF(VACIO);
          setFolioCreado(null);
          setGuardando(false);
        }}
      />
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-6" noValidate>
      <Tarjeta>
        <TituloTarjeta>1. Quién envía (remitente)</TituloTarjeta>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="remNombre" etiqueta="Nombre completo" required
            value={f.remNombre} onChange={(e) => set('remNombre', e.target.value)}
            error={errores.remNombre} autoComplete="off"
          />
          <Input
            id="remTelefono" etiqueta="Teléfono" required inputMode="tel"
            placeholder="10 dígitos" value={f.remTelefono}
            onChange={(e) => set('remTelefono', e.target.value)} error={errores.remTelefono}
          />
          <Input
            id="remCiudad" etiqueta="Ciudad" required
            value={f.remCiudad} onChange={(e) => set('remCiudad', e.target.value)}
            error={errores.remCiudad}
          />
          <SelectEstado
            id="remEstado" value={f.remEstado}
            onChange={(v) => set('remEstado', v)} error={errores.remEstado}
          />
          <div className="sm:col-span-2">
            <Input
              id="remDireccion" etiqueta="Dirección de recolección" required
              value={f.remDireccion} onChange={(e) => set('remDireccion', e.target.value)}
              error={errores.remDireccion}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              id="remEmail" etiqueta="Correo (opcional)" type="email"
              value={f.remEmail} onChange={(e) => set('remEmail', e.target.value)}
            />
          </div>
        </div>
      </Tarjeta>

      <Tarjeta>
        <TituloTarjeta>2. Quién recibe (destinatario)</TituloTarjeta>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="desNombre" etiqueta="Nombre completo" required
            value={f.desNombre} onChange={(e) => set('desNombre', e.target.value)}
            error={errores.desNombre} ayuda="En el rastreo público solo se muestran sus iniciales."
            autoComplete="off"
          />
          <Select
            id="desPais" etiqueta="País" required value={f.desPais}
            onChange={(e) => set('desPais', e.target.value)} error={errores.desPais}
            ayuda="Determina el código con el que se le escribe por WhatsApp."
          >
            <option value="">Elige un país…</option>
            {PAISES_DESTINO.map((p) => (
              <option key={p.nombre} value={p.nombre}>
                {p.nombre}
              </option>
            ))}
          </Select>
          <Input
            id="desTelefono" etiqueta="Teléfono" required inputMode="tel"
            placeholder="Sin código de país" value={f.desTelefono}
            onChange={(e) => set('desTelefono', e.target.value)} error={errores.desTelefono}
            ayuda="Sirve para mandarle el enlace de rastreo por WhatsApp."
          />
          <Input
            id="desCiudad" etiqueta="Ciudad" required
            value={f.desCiudad} onChange={(e) => set('desCiudad', e.target.value)}
            error={errores.desCiudad}
          />
          <Input
            id="desEstado" etiqueta="Estado / Provincia / Departamento" required
            value={f.desEstado} onChange={(e) => set('desEstado', e.target.value)}
            error={errores.desEstado}
          />
          <div className="sm:col-span-2">
            <Input
              id="desDireccion" etiqueta="Dirección de entrega" required
              value={f.desDireccion} onChange={(e) => set('desDireccion', e.target.value)}
              error={errores.desDireccion}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              id="desEmail" etiqueta="Correo (opcional)" type="email"
              value={f.desEmail} onChange={(e) => set('desEmail', e.target.value)}
            />
          </div>
        </div>
      </Tarjeta>

      <Tarjeta>
        <TituloTarjeta>3. El paquete</TituloTarjeta>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              id="descripcion" etiqueta="¿Qué contiene?" required
              placeholder="2 cajas de ropa" value={f.descripcion}
              onChange={(e) => set('descripcion', e.target.value)} error={errores.descripcion}
            />
          </div>
          <Input
            id="piezas" etiqueta="Piezas" required type="number" min={1} step={1}
            value={f.piezas} onChange={(e) => set('piezas', e.target.value)}
            error={errores.piezas}
          />
          <Input
            id="pesoKg" etiqueta="Peso (kg)" required type="number" min={0} step="0.1"
            value={f.pesoKg} onChange={(e) => set('pesoKg', e.target.value)}
            error={errores.pesoKg}
          />
          <div className="sm:col-span-2">
            <Input
              id="valorDeclarado" etiqueta="Valor declarado (opcional)" type="number" min={0}
              value={f.valorDeclarado} onChange={(e) => set('valorDeclarado', e.target.value)}
              error={errores.valorDeclarado} ayuda="En dólares. Déjalo vacío si no se declara."
            />
          </div>
        </div>
      </Tarjeta>

      <Tarjeta>
        <TituloTarjeta>4. El servicio</TituloTarjeta>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="tipo" etiqueta="Tipo de envío" required value={f.tipo}
            onChange={(e) => set('tipo', e.target.value as 'terrestre' | 'aereo')}
          >
            <option value="terrestre">Terrestre</option>
            <option value="aereo">Aéreo</option>
          </Select>
          <Input
            id="costo" etiqueta="Costo (USD)" required type="number" min={0} step="0.01"
            value={f.costo} onChange={(e) => set('costo', e.target.value)} error={errores.costo}
          />
          <Select
            id="pagado" etiqueta="¿Ya pagó?" required value={f.pagado}
            onChange={(e) => set('pagado', e.target.value)}
          >
            <option value="no">No, paga al entregar</option>
            <option value="si">Sí, ya está pagado</option>
          </Select>
          <Input
            id="formaPago" etiqueta="Forma de pago (opcional)"
            placeholder="Efectivo, transferencia…" value={f.formaPago}
            onChange={(e) => set('formaPago', e.target.value)}
          />
          <div className="sm:col-span-2">
            <Textarea
              id="notasInternas" etiqueta="Notas internas (opcional)"
              placeholder="Cliente frecuente. Entregar después de las 6pm."
              value={f.notasInternas} onChange={(e) => set('notasInternas', e.target.value)}
              ayuda="Solo las ve el personal. El cliente NUNCA ve esto."
            />
          </div>
        </div>
      </Tarjeta>

      {errorGeneral && (
        <p
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
        >
          {errorGeneral}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/admin" className="sm:w-auto">
          <Boton type="button" variante="secundario" tamano="lg" anchoCompleto>
            Cancelar
          </Boton>
        </Link>
        <Boton type="submit" tamano="lg" cargando={guardando} disabled={!usuarioActual}>
          {!guardando && <PackagePlus className="size-5" aria-hidden="true" />}
          Registrar envío
        </Boton>
      </div>
    </form>
  );
}

function SelectEstado({
  id,
  value,
  onChange,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <Select
      id={id}
      etiqueta="Estado"
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
    >
      <option value="">Elige un estado…</option>
      {ESTADOS_EEUU.map((e) => (
        <option key={e} value={e}>
          {e}
        </option>
      ))}
    </Select>
  );
}

/** Pantalla de confirmación: el folio en grande y las dos acciones que siguen. */
function Exito({
  folio,
  telefonoCliente,
  paisCliente,
  onOtro,
}: {
  folio: string;
  telefonoCliente: string;
  paisCliente: string;
  onOtro: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const enlace = urlTracking(folio);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(folio);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles (o http sin localhost): el folio está a la vista.
    }
  }

  const destino = telefonoInternacional(telefonoCliente, paisCliente);

  return (
    <Tarjeta className="text-center">
      <PartyPopper className="mx-auto mb-4 size-10 text-emerald-400" aria-hidden="true" />
      <h2 className="text-lg font-semibold text-white">Envío registrado</h2>
      <p className="mt-1 text-sm text-slate-400">Este es el folio del cliente:</p>

      <p className="my-6 select-all break-all font-mono text-3xl font-bold sm:text-4xl">
        <span className="texto-acento">{folio}</span>
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Boton variante="secundario" tamano="lg" onClick={copiar}>
          {copiado ? (
            <Check className="size-5 text-emerald-400" aria-hidden="true" />
          ) : (
            <Copy className="size-5" aria-hidden="true" />
          )}
          {copiado ? 'Copiado' : 'Copiar folio'}
        </Boton>

        <a
          href={urlWhatsApp(MENSAJES.compartirTracking(folio, enlace), destino)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Boton variante="whatsapp" tamano="lg" anchoCompleto>
            <Send className="size-5" aria-hidden="true" />
            Enviar al cliente por WhatsApp
          </Boton>
        </a>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 border-t border-white/10 pt-6 sm:flex-row">
        <Boton variante="fantasma" onClick={onOtro}>
          Registrar otro envío
        </Boton>
        <Link href={`/admin/envio/${folio}`}>
          <Boton variante="fantasma" anchoCompleto>
            Ver el envío
          </Boton>
        </Link>
      </div>
    </Tarjeta>
  );
}
