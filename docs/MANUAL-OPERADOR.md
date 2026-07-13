# Manual del panel — Encomiendas Mi Tierra

Guía para el personal del negocio. No necesitas saber nada de computación:
son tres pantallas y dos botones.

---

## Entrar

Abre **encomiendasmitierra.com/login** y escribe tu correo y tu contraseña.

Si te dice *"Correo o contraseña incorrectos"*, revisa que no tengas activado
Bloq Mayús. Si te dice *"Tu cuenta no tiene acceso al panel"*, la cuenta existe
pero todavía no te dan permisos: avísale al administrador.

La sesión dura **5 días**. Después te vuelve a pedir la contraseña.

> 🔒 No compartas tu cuenta. Cada movimiento que hagas queda firmado con tu nombre
> en el historial del envío. Si hay un reclamo de un cliente, ese historial es la
> prueba de lo que pasó y cuándo.

---

## Registrar un envío nuevo

Botón azul **"Nuevo envío"**, arriba a la derecha.

El formulario tiene cuatro partes:

1. **Quién envía** — nombre, teléfono (10 dígitos), ciudad, estado y dirección de
   recolección.
2. **Quién recibe** — lo mismo, del destinatario. El teléfono sirve para mandarle
   el enlace de rastreo por WhatsApp.
3. **El paquete** — qué contiene, cuántas piezas y cuánto pesa.
4. **El servicio** — terrestre o aéreo, cuánto cuesta, y si ya pagó.

Los campos con **\*** son obligatorios. Si algo falta, al guardar se marca en rojo
y la pantalla te lleva solita al primer campo con problema.

**No inventes el folio: el sistema lo genera solo** al guardar.

### Al guardar

Aparece el folio en grande, tipo `EMT-0007-K3F9`, con dos botones:

- **Copiar folio** — para pegarlo donde lo necesites.
- **Enviar al cliente por WhatsApp** — abre WhatsApp con el mensaje ya escrito y el
  enlace de rastreo. Solo le das enviar.

> 💡 Mándale siempre el enlace por WhatsApp. Es la forma más rápida de que deje de
> hablar por teléfono a preguntar dónde va su paquete: lo ve él mismo.

---

## Mover un envío de estatus

Es lo que más vas a hacer. Son dos clics.

1. En la lista, haz clic en el **folio** del envío.
2. A la derecha está el recuadro **"Cambiar estatus"**.
3. Elige el nuevo estatus en la lista.
4. La **nota para el cliente** se llena sola con un texto sugerido. Puedes dejarla
   así o escribir la tuya.
5. **Confirmar cambio**.

Listo. El cliente ya lo ve en su página de rastreo.

### Los estatus, en orden

```
Envío registrado → Recolectado → En bodega de origen → En tránsito
                 → En ciudad destino → En reparto → Entregado
```

El sistema **solo te ofrece el siguiente paso**, para que no te equivoques de orden.
Además siempre puedes marcar:

- **Incidencia** — algo salió mal (dirección incompleta, el cliente no estaba, el
  paquete se retrasó). El cliente ve un aviso amarillo y un botón para escribirte.
  Desde una incidencia puedes retomar el flujo en el punto donde estaba el paquete.
- **Cancelado** — el envío no se hace. Es **definitivo**: un envío cancelado ya no
  se puede mover.

**"Entregado" también es definitivo.** Una vez entregado, el envío se cierra.

### Las dos notas: cuál ve el cliente y cuál no

| Campo | ¿Lo ve el cliente? |
|---|---|
| **Nota para el cliente** | **SÍ.** Aparece en su página de rastreo. |
| **Nota interna** | **NO. Nunca.** Solo la ve el personal, en este panel. |

Escribe en la nota interna lo que necesites: *"no contestó el teléfono"*, *"cobrar
$200 al entregar"*, *"el cliente es especial, tratar con calma"*. **El cliente no
puede verla, ni aunque quiera.** El sistema está construido para que esa información
ni siquiera salga de la computadora del negocio.

---

## Buscar un envío

**Por folio** — pega el folio completo en la barra de búsqueda. Tiene que ir
completo, con los dos guiones: `EMT-0007-K3F9`.

**Por estatus** — los botones redondos de abajo ("Todos", "En tránsito",
"Incidencia"…) filtran la lista.

La lista siempre muestra primero **lo que se movió más recientemente**.

---

## Los números de arriba

- **Envíos activos** — los que están en camino (todo lo que no se ha entregado).
- **Entregados hoy** — cuántos se cerraron hoy.
- **Incidencias abiertas** — **los que necesitan que alguien haga algo.**
  Si este número no es cero, ahí está tu pendiente del día.

---

## Preguntas frecuentes

**Un cliente dice que su folio no aparece.**
Que revise que lo escribió completo (`EMT-0007-K3F9`, con los dos guiones). Si aún
así no sale, búscalo tú en el panel: puede que se haya tecleado mal al registrarlo.

**Me equivoqué de estatus.**
No se puede deshacer: el historial es una bitácora y no se borra, a propósito. Lo
correcto es avanzar al estatus real y explicarlo en la nota. Si es grave, marca
**Incidencia** con una nota clara y avísale al administrador.

**¿Puedo borrar un envío?**
No, y es mejor así. Si un envío no se va a hacer, márcalo como **Cancelado**. Así
queda el registro de qué pasó.

**Se me olvidó la contraseña.**
Pídele al administrador que te la restablezca desde la consola de Firebase.

**¿Qué pasa si se me va el internet a media captura?**
El envío no se guarda a medias: o se guarda completo, o no se guarda. Te aparece un
mensaje de error y puedes volver a intentar sin miedo a duplicar nada.
