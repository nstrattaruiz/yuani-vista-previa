// Checkout en tres pasos (Datos → Envío → Pago) sobre el checkout real de la plataforma:
// precios, stock, cupones, envíos y la regla por medio de pago los calcula SIEMPRE la tienda (tienda.checkout.cotizar
// y confirmar). La web solo junta los datos, muestra lo que vuelve y elige el mejor cupón:
//  - el del escalón de "descuentos por monto" que corresponde al subtotal (se aplica solo), o
//  - el que escribió el cliente (PRIMERACOMPRA…). Los cupones no se suman: se queda el que deja el total más bajo.
// Pago online (Mercado Pago, PayPal): la plataforma devuelve payUrl y el pago se hace en la pasarela.
import { tienda, $, $$, esc, icono, ctx, dinero, foto, ir, tituloPagina, waLink, meta, fondoFoto } from '../comun.js';
import { estadoDescuento } from '../descuentos.js';

const DEPARTAMENTOS = ['Montevideo', 'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores', 'Florida', 'Lavalleja', 'Maldonado', 'Paysandú', 'Río Negro', 'Rivera', 'Rocha', 'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres'];
const PASOS = ['Datos', 'Envío', 'Pago'];
const PASOS_DETALLE = ['Contacto', 'Entrega o retiro', 'Medio de pago y confirmación'];
const CLAVE = 'yu:checkout';

// Borrador del formulario en esta pestaña (si recarga o vuelve atrás no pierde lo escrito). Al comprar se limpian
// el cupón y la nota; los datos de contacto y la dirección quedan para no pedirlos de nuevo en otra compra.
const borrador = {
  leer() { try { return JSON.parse(sessionStorage.getItem(CLAVE)) ?? {}; } catch { return {}; } },
  guardar(d) { try { sessionStorage.setItem(CLAVE, JSON.stringify(d)); } catch { /* sin almacenamiento */ } },
  despuesDeComprar(d) { this.guardar({ ...d, cupon: '', nota: '' }); },
};

export async function checkout(app) {
  const { info, t, cliente } = ctx;
  tituloPagina(t('checkout.titulo'));
  noIndexar();
  const [carro, op] = await Promise.all([tienda.carrito.ver(), tienda.checkout.opciones()]);
  if (!carro.lines.length) {
    app.innerHTML = `<section class="yu-pagina yu-vacio yu-vacio--pagina"><span class="yu-circulo" style="--yu-bg:#BFEDE5">${icono('bolsa')}</span><h1>Tu carrito está vacío</h1><p>Elegí tus moldes y volvé acá para terminar la compra.</p><a class="yu-btn" href="/tienda" data-link>Ver la tienda</a></section>`;
    return;
  }
  if (!op.payments.length) {
    const wa = waLink('¡Hola! Quiero hacer un pedido');
    app.innerHTML = `<section class="yu-pagina yu-vacio yu-vacio--pagina"><h1>Todavía no se puede pagar online</h1><p>Escribinos y coordinamos tu pedido.</p>${wa ? `<a class="yu-btn" href="${esc(wa)}" target="_blank" rel="noopener">${icono('wa')}Escribir por WhatsApp</a>` : '<a class="yu-btn" href="/contacto" data-link>Contacto</a>'}</section>`;
    return;
  }

  // ------------------------------------------------ estado
  const d = {
    email: cliente?.email ?? '', nombre: '', apellido: '', telefono: cliente?.phone ?? '', nacimiento: '',
    envio: op.shipping[0]?.id ?? '', direccion: cliente?.address ?? '', apto: '', departamento: 'Montevideo', ciudad: cliente?.city ?? '', cp: '',
    pago: op.payments[0].method, cupon: '', nota: '', horario: '',
    ...borrador.leer(),
  };
  if (cliente?.name && !d.nombre) { const [n, ...a] = cliente.name.split(' '); d.nombre = n; d.apellido = a.join(' '); }
  if (!op.shipping.some((e) => e.id === d.envio)) d.envio = op.shipping[0]?.id ?? '';
  if (!op.payments.some((p) => p.method === d.pago)) d.pago = op.payments[0].method;
  const envioDe = (id) => op.shipping.find((e) => e.id === id);
  const conDireccion = () => op.shipping.length && !envioDe(d.envio)?.pickup;
  const esRetiro = () => !!envioDe(d.envio)?.pickup;
  const horarios = (t('checkout.horarios') ?? []).filter(Boolean);

  const errores = {
    1: () => ({
      email: !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim()) && (d.email.trim() ? 'Revisá el email: le falta algo (ej.: nombre@gmail.com).' : 'Escribí tu email: ahí te mandamos la confirmación.'),
      nombre: !d.nombre.trim() && 'Escribí tu nombre.',
      apellido: !d.apellido.trim() && 'Escribí tu apellido.',
      telefono: d.telefono.replace(/\D/g, '').length < 8 && 'Escribí un teléfono o celular para coordinar la entrega (8 números o más).',
    }),
    2: () => ({
      envio: op.shipping.length && !envioDe(d.envio) && 'Elegí cómo te llega el pedido.',
      direccion: conDireccion() && d.direccion.trim().length < 4 && 'Escribí la calle y el número.',
      ciudad: conDireccion() && !d.ciudad.trim() && 'Escribí la ciudad o localidad.',
      departamento: conDireccion() && !d.departamento && 'Elegí el departamento.',
    }),
    3: () => ({ pago: !op.payments.some((p) => p.method === d.pago) && 'Elegí cómo pagás.' }),
  };
  const valido = (n) => !Object.values(errores[n]()).some(Boolean);

  // Paso pedido en la dirección (?paso=2): no se puede saltear uno incompleto
  let paso = Math.min(3, Math.max(1, Number(new URLSearchParams(location.search).get('paso')) || 1));
  for (let n = 1; n < paso; n++) if (!valido(n)) { paso = n; break; }

  app.innerHTML = `
    <div class="yu-pagina yu-checkout">
      <div class="yu-checkout__cab">
        <p class="yu-etiqueta-seccion">Paso ${paso} de ${PASOS.length} · ${PASOS[paso - 1]}</p>
        <h1>${esc(t('checkout.titulo'))}</h1>
        <ol class="yu-pasos" aria-label="Pasos de la compra" style="--avance:${(paso - 1) / (PASOS.length - 1)}">
          ${PASOS.map((nombre, i) => {
            const n = i + 1;
            const estado = n < paso ? 'hecho' : n === paso ? 'actual' : 'falta';
            const dentro = `<span class="yu-pasos__num">${n < paso ? icono('check') : n}</span><span class="yu-pasos__texto"><strong>${nombre}</strong><small>${PASOS_DETALLE[i]}</small></span>`;
            return `<li class="yu-pasos__paso is-${estado}"${n === paso ? ' aria-current="step"' : ''}>
              ${n < paso ? `<a href="/checkout?paso=${n}" data-link>${dentro}<span class="yu-oculto"> (completo, volver a editar)</span></a>` : `<span class="yu-pasos__caja">${dentro}</span>`}
            </li>`;
          }).join('')}
        </ol>
      </div>
      <div class="yu-checkout__cuerpo">
        <form class="yu-checkout__form" id="compra" novalidate></form>
        <aside class="yu-resumen" id="resumen" aria-label="Resumen del pedido">
          <button type="button" class="yu-resumen__toggle" id="resumen-toggle" aria-expanded="false" aria-controls="resumen-cuerpo">
            ${icono('bolsa')}<span>Ver resumen</span><strong id="resumen-total-chico"></strong>${icono('abajo')}
          </button>
          <div class="yu-resumen__cuerpo" id="resumen-cuerpo"></div>
          <details class="yu-cupon"${d.cupon ? ' open' : ''}><summary>${icono('regalo')}¿Tenés un cupón de descuento?${icono('abajo')}</summary>
            <div class="yu-cupon__fila"><label class="yu-oculto" for="cupon">Código del cupón</label><input id="cupon" value="${esc(d.cupon)}" placeholder="Ej.: PRIMERACOMPRA" autocomplete="off" autocapitalize="characters" spellcheck="false"><button type="button" class="yu-btn yu-btn--borde" id="aplicar">Aplicar</button></div>
            <p class="yu-cupon__estado" id="cupon-estado" role="status"></p>
          </details>
        </aside>
      </div>
    </div>`;

  const form = $('#compra');
  const campo = (nombre, etiqueta, { tipo = 'text', auto = '', extra = '', ayuda = '', opcional = false } = {}) => `
    <label class="yu-campo" data-campo="${nombre}"><span>${etiqueta}${opcional ? ' <small>(opcional)</small>' : ''}</span>
      <input name="${nombre}" type="${tipo}" value="${esc(d[nombre])}"${auto ? ` autocomplete="${auto}"` : ''}${opcional ? '' : ' required aria-required="true"'} aria-describedby="err-${nombre}${ayuda ? ` ayuda-${nombre}` : ''}" ${extra}>
      ${ayuda ? `<small class="yu-campo__ayuda" id="ayuda-${nombre}">${ayuda}</small>` : ''}
      <small class="yu-campo__error" id="err-${nombre}"></small>
    </label>`;
  const radio = (name, value, titulo, detalle, derecha = '', extra = '') => `
    <label class="yu-radio"><input type="radio" name="${name}" value="${esc(value)}"${d[name] === value ? ' checked' : ''}>
      <span class="yu-radio__marca" aria-hidden="true"></span>
      <span class="yu-radio__texto"><strong>${esc(titulo)}</strong>${detalle ? `<small>${esc(detalle)}</small>` : ''}${extra}</span>
      ${derecha ? `<span class="yu-radio__der">${derecha}</span>` : ''}</label>`;
  const precioEnvio = (e) => (e.priceCents ? dinero(e.priceCents, op.currency) : 'Gratis');

  // ------------------------------------------------ pasos
  const pasos = {
    1: () => `<fieldset class="yu-paso"><legend><span class="yu-paso__num">1</span>Tus datos</legend>
      ${info.modules?.accounts && !cliente ? '<p class="yu-checkout__nota">¿Ya tenés cuenta? <a href="/cuenta" data-link>Ingresá</a> y completamos tus datos.</p>' : ''}
      ${campo('email', 'Email', { tipo: 'email', auto: 'email', ayuda: 'Te mandamos la confirmación y el seguimiento del pedido.', extra: 'inputmode="email" spellcheck="false"' })}
      <div class="yu-campos-2">${campo('nombre', 'Nombre', { auto: 'given-name' })}${campo('apellido', 'Apellido', { auto: 'family-name' })}</div>
      ${campo('telefono', 'Celular o teléfono', { tipo: 'tel', auto: 'tel', ayuda: 'Para coordinar la entrega por WhatsApp.', extra: 'inputmode="tel"' })}
      ${info.modules?.birthday && !cliente?.birthDate ? campo('nacimiento', 'Fecha de nacimiento', { tipo: 'date', auto: 'bday', opcional: true, ayuda: 'Te mandamos un regalo el día de tu cumpleaños.', extra: `min="1900-01-01" max="${new Date().toISOString().slice(0, 10)}"` }) : ''}
    </fieldset>`,
    2: () => `<fieldset class="yu-paso"><legend><span class="yu-paso__num">2</span>¿Cómo te llega?</legend>
      ${op.shipping.length ? `<div class="yu-radios" role="radiogroup" aria-label="Forma de entrega" data-campo="envio">${op.shipping.map((e) => radio('envio', e.id, e.name, [e.description, e.freeOverCents ? `Gratis desde ${dinero(e.freeOverCents, op.currency)}` : ''].filter(Boolean).join(' · '), precioEnvio(e))).join('')}<small class="yu-campo__error" id="err-envio"></small></div>`
        : '<p class="yu-checkout__nota">Coordinamos la entrega con vos después de la compra.</p>'}
      ${horarios.length ? `<div class="yu-retiro" id="retiro"${esRetiro() ? '' : ' hidden'}>
        <h3>¿En qué horario pasás a retirar?</h3>
        <div class="yu-horarios" role="radiogroup" aria-label="Horario de retiro" data-campo="horario">
          ${horarios.map((h) => `<label class="yu-horario"><input type="radio" name="horario" value="${esc(h)}"${d.horario === h ? ' checked' : ''}><span>${esc(h)}</span></label>`).join('')}
        </div>
        <small class="yu-campo__ayuda">Opcional: te confirmamos el día por WhatsApp.</small>
      </div>` : ''}
      <div class="yu-direccion" id="direccion"${conDireccion() ? '' : ' hidden'}>
        <h3>Dirección de entrega</h3>
        ${campo('direccion', 'Calle y número', { auto: 'address-line1' })}
        <div class="yu-campos-2">${campo('apto', 'Apartamento, piso o casa', { auto: 'address-line2', opcional: true })}${campo('cp', 'Código postal', { auto: 'postal-code', opcional: true, extra: 'inputmode="numeric" maxlength="5"' })}</div>
        <div class="yu-campos-2">
          <label class="yu-campo" data-campo="departamento"><span>Departamento</span>
            <span class="yu-select yu-select--campo"><select name="departamento" autocomplete="address-level1" aria-describedby="err-departamento">${DEPARTAMENTOS.map((x) => `<option${x === d.departamento ? ' selected' : ''}>${x}</option>`).join('')}</select>${icono('abajo')}</span>
            <small class="yu-campo__error" id="err-departamento"></small></label>
          ${campo('ciudad', 'Ciudad o localidad', { auto: 'address-level2' })}
        </div>
      </div>
      <label class="yu-campo"><span>Nota para el pedido <small>(opcional)</small></span><textarea name="nota" rows="2" placeholder="Indicaciones para la entrega, horario, etc.">${esc(d.nota)}</textarea></label>
    </fieldset>`,
    3: () => `<fieldset class="yu-paso"><legend><span class="yu-paso__num">3</span>¿Cómo pagás?</legend>
      <div class="yu-radios" role="radiogroup" aria-label="Medio de pago" data-campo="pago" id="medios">${op.payments.map((p) => radio('pago', p.method, p.label, p.online ? 'Pagás online de forma segura' : p.method === 'bank_transfer' ? 'Te pasamos los datos al confirmar' : p.method === 'cash' ? 'Al retirar o al recibir' : '', '', `<em class="yu-radio__ahorro" data-ahorro="${esc(p.method)}"></em>`)).join('')}<small class="yu-campo__error" id="err-pago"></small></div>
      <div class="yu-revision">
        <h3>Revisá tu pedido</h3>
        <dl>
          <div><dt>Contacto</dt><dd>${esc(`${d.nombre} ${d.apellido}`.trim())} · ${esc(d.email)} · ${esc(d.telefono)}</dd><a href="/checkout?paso=1" data-link>Cambiar</a></div>
          <div><dt>Entrega</dt><dd>${esc(envioDe(d.envio)?.name ?? 'A coordinar')}${conDireccion() ? ` · ${esc(direccionCompleta(d))}` : ''}${esRetiro() && d.horario ? ` · Horario: ${esc(d.horario)}` : ''}</dd><a href="/checkout?paso=2" data-link>Cambiar</a></div>
        </dl>
      </div>
    </fieldset>`,
  };

  form.innerHTML = `${pasos[paso]()}
    <p class="yu-error yu-checkout__error" id="error" role="alert"></p>
    <div class="yu-checkout__botones">
      ${paso > 1 ? `<a class="yu-btn yu-btn--texto" href="/checkout?paso=${paso - 1}" data-link>${icono('izq')}Volver</a>` : '<a class="yu-btn yu-btn--texto" href="/tienda" data-link>' + icono('izq') + 'Seguir comprando</a>'}
      <button class="yu-btn yu-btn--grande" id="seguir">${paso < 3 ? `Continuar a ${PASOS[paso].toLowerCase()}${icono('der')}` : `${icono('candado')}<span id="confirmar-texto">Confirmar pedido</span>`}</button>
    </div>
    ${paso === 3 ? `<p class="yu-checkout__seguridad">${icono('candado')}${esc(t('checkout.seguridad'))}</p>` : ''}`;

  // ------------------------------------------------ campos
  const leer = () => {
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === 'radio') { if (el.checked) d[el.name] = el.value; } else d[el.name] = el.value;
    }
    borrador.guardar(d);
  };
  const mostrarErrores = (n, enfocar) => {
    const errs = errores[n]();
    let primero = null;
    for (const [k, msg] of Object.entries(errs)) {
      const caja = form.querySelector(`[data-campo="${k}"]`);
      if (!caja) continue;
      const input = caja.querySelector('input, select');
      caja.classList.toggle('is-error', !!msg);
      if (input && input.type !== 'radio') input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      const e = $(`#err-${k}`);
      if (e) e.textContent = msg || '';
      if (msg && !primero) primero = input;
    }
    if (enfocar && primero) { primero.focus(); primero.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    return !primero;
  };
  // Los errores aparecen al salir del campo (no mientras se escribe) y se van apenas se corrige
  form.addEventListener('focusout', (e) => {
    if (!e.target.name) return;
    leer();
    const msg = errores[paso]()[e.target.name];
    const caja = e.target.closest('[data-campo]');
    if (caja && e.target.value) { caja.classList.toggle('is-error', !!msg); e.target.setAttribute('aria-invalid', msg ? 'true' : 'false'); ($(`#err-${e.target.name}`) ?? {}).textContent = msg || ''; }
    if (e.target.name === 'email' && info.modules?.abandonedCarts && !msg) tienda.checkout.contacto({ email: d.email.trim(), nombre: `${d.nombre} ${d.apellido}`.trim(), volver: '/checkout' });
  });
  form.addEventListener('input', (e) => {
    leer();
    const caja = e.target.closest('[data-campo].is-error');
    if (caja && !errores[paso]()[e.target.name]) { caja.classList.remove('is-error'); e.target.setAttribute('aria-invalid', 'false'); ($(`#err-${e.target.name}`) ?? {}).textContent = ''; }
  });
  form.addEventListener('change', (e) => {
    leer();
    if (e.target.name === 'envio') { $('#direccion').hidden = !conDireccion(); if ($('#retiro')) $('#retiro').hidden = !esRetiro(); cotizar(); }
    if (e.target.name === 'pago') cotizar();
  });

  // ------------------------------------------------ resumen (totales de la tienda)
  const escalonPara = (subtotal) => estadoDescuento(subtotal, ctx.escalones).actual;
  let cuponElegido = null;
  let pedidoN = 0;
  async function cotizar({ avisarCupon = false } = {}) {
    const n = ++pedidoN;
    const cuerpo = $('#resumen-cuerpo');
    cuerpo.setAttribute('aria-busy', 'true');
    const metodo = op.payments.some((p) => p.method === d.pago) ? d.pago : op.payments[0].method;
    const envio = paso >= 2 || d.envio ? (envioDe(d.envio) ? d.envio : null) : null;
    const auto = escalonPara(carro.subtotal)?.cupon || null;
    const propio = d.cupon.trim().toUpperCase() || null;
    const candidatos = [...new Set([propio, auto, null])];
    const intentos = await Promise.allSettled(candidatos.map((cupon) => tienda.checkout.cotizar({ metodoPago: metodo, envio, cupon })));
    // Llegó tarde (se cotizó otra cosa o ya se salió del checkout)
    if (n !== pedidoN || !form.isConnected) return;
    cuerpo.removeAttribute('aria-busy');
    const ok = intentos.map((r, i) => ({ cupon: candidatos[i], r })).filter((x) => x.r.status === 'fulfilled');
    if (!ok.length) {
      const msg = intentos.find((x) => x.status === 'rejected')?.reason?.message ?? 'No pudimos calcular el total.';
      $('#error').textContent = msg;
      return;
    }
    $('#error').textContent = '';
    const mejor = ok.reduce((a, b) => (b.r.value.totalCents < a.r.value.totalCents ? b : a));
    cuponElegido = mejor.cupon;
    const q = mejor.r.value;
    const fallo = (c) => intentos[candidatos.indexOf(c)]?.status === 'rejected' ? intentos[candidatos.indexOf(c)].reason.message : null;
    // Avisos del cupón: el que escribió no sirve, o hay otro descuento que le conviene más
    const estadoCupon = $('#cupon-estado');
    if (estadoCupon) {
      estadoCupon.className = 'yu-cupon__estado';
      if (propio && fallo(propio)) { estadoCupon.textContent = fallo(propio); estadoCupon.classList.add('is-error'); }
      else if (propio && cuponElegido === propio) { estadoCupon.textContent = `Cupón ${propio} aplicado.`; estadoCupon.classList.add('is-ok'); }
      else if (propio && cuponElegido && cuponElegido !== propio) { estadoCupon.textContent = `Tu cupón ${propio} es válido, pero el descuento por monto te conviene más: dejamos el mejor (no se suman).`; }
      else estadoCupon.textContent = '';
      if (avisarCupon) estadoCupon.focus?.();
    }
    if (auto && fallo(auto)) console.warn(`[descuentos] El cupón ${auto} del escalón no se pudo aplicar: ${fallo(auto)}. Revisá que exista en el panel (Descuentos) con la misma compra mínima.`);
    pintarResumen(q, { auto, autoFallo: !!(auto && fallo(auto)) });
    // Cuánto se ahorra con cada medio de pago (regla de checkout de la tienda)
    if (paso === 3) ahorroPorMedio(envio, cuponElegido);
  }

  let ahorroN = 0;
  async function ahorroPorMedio(envio, cupon) {
    const n = ++ahorroN;
    const res = await Promise.allSettled(op.payments.map((p) => tienda.checkout.cotizar({ metodoPago: p.method, envio, cupon })));
    if (n !== ahorroN || !form.isConnected) return;
    res.forEach((r, i) => {
      const el = form.querySelector(`[data-ahorro="${op.payments[i].method}"]`);
      if (!el) return;
      const a = r.status === 'fulfilled' ? r.value.paymentAdjustCents : 0;
      el.textContent = a < 0 ? `Ahorrás ${dinero(-a, op.currency)}` : a > 0 ? `Recargo ${dinero(a, op.currency)}` : '';
    });
  }

  function pintarResumen(q, { auto, autoFallo }) {
    const lineasPorVariante = new Map(carro.lines.map((l) => [l.variantId, l]));
    const esc2 = escalonPara(q.subtotalCents);
    const etiquetaCupon = q.coupon && auto && q.coupon === auto && esc2 ? `Descuento por monto (${esc2.porcentaje}% OFF)` : q.coupon ? `Cupón ${q.coupon}` : '';
    $('#resumen-cuerpo').innerHTML = `
      <h2 class="yu-resumen__titulo">Tu pedido <small>${carro.itemCount} producto${carro.itemCount === 1 ? '' : 's'}</small></h2>
      <ul class="yu-resumen__lineas">${q.lines.map((l) => { const c = lineasPorVariante.get(l.variantId); return `<li>
        <span class="yu-resumen__foto" style="${fondoFoto(c?.handle ?? l.title)}">${c?.image ? foto(c.image, l.title, { ancho: 320, sizes: '56px' }) : '<span class="yu-sin-foto"></span>'}<b>${l.quantity}</b></span>
        <span class="yu-resumen__nombre">${esc(l.title)}${l.variantTitle ? `<small>${esc(l.variantTitle)}</small>` : ''}</span>
        <strong>${dinero(l.totalCents, q.currency)}</strong></li>`; }).join('')}</ul>
      <dl class="yu-resumen__totales">
        <div><dt>Subtotal</dt><dd>${dinero(q.subtotalCents, q.currency)}</dd></div>
        ${q.discountCents ? `<div class="is-descuento"><dt>${esc(etiquetaCupon)}</dt><dd>− ${dinero(q.discountCents, q.currency)}</dd></div>` : ''}
        <div><dt>${esc(q.shippingMethod ?? 'Envío')}</dt><dd>${q.shippingMethod ? (q.shippingCents ? dinero(q.shippingCents, q.currency) : 'Gratis') : '<small>Se elige en el paso 2</small>'}</dd></div>
        ${q.paymentAdjustCents ? `<div class="${q.paymentAdjustCents < 0 ? 'is-descuento' : ''}"><dt>${esc(q.paymentAdjustLabel || 'Ajuste por medio de pago')}</dt><dd>${q.paymentAdjustCents < 0 ? '− ' : '+ '}${dinero(Math.abs(q.paymentAdjustCents), q.currency)}</dd></div>` : ''}
        <div class="yu-resumen__total"><dt>Total</dt><dd>${dinero(q.totalCents, q.currency)}</dd></div>
        ${q.taxCents && q.pricesIncludeTax ? `<div class="yu-resumen__iva"><dt>IVA incluido</dt><dd>${dinero(q.taxCents, q.currency)}</dd></div>` : ''}
      </dl>
      ${autoFallo ? '<p class="yu-resumen__aviso">El descuento por monto no se pudo aplicar solo. Escribinos y lo resolvemos antes de pagar.</p>' : ''}
      ${!q.discountCents && ctx.escalones.length && estadoDescuento(q.subtotalCents, ctx.escalones).siguiente ? `<p class="yu-resumen__pista">${icono('regalo')}Te faltan ${dinero(estadoDescuento(q.subtotalCents, ctx.escalones).falta)} para el ${estadoDescuento(q.subtotalCents, ctx.escalones).siguiente.porcentaje}% OFF. <a href="/tienda" data-link>Seguir comprando</a></p>` : ''}`;
    $('#resumen-total-chico').textContent = dinero(q.totalCents, q.currency);
    const boton = $('#confirmar-texto');
    if (boton) {
      const online = op.payments.find((p) => p.method === d.pago)?.online;
      boton.textContent = `${online ? 'Pagar' : 'Confirmar pedido'} · ${dinero(q.totalCents, q.currency)}`;
    }
  }

  $('#resumen-toggle').addEventListener('click', (e) => {
    const abierto = e.currentTarget.getAttribute('aria-expanded') !== 'true';
    e.currentTarget.setAttribute('aria-expanded', String(abierto));
    $('#resumen').classList.toggle('is-abierto', abierto);
    $('span', e.currentTarget).textContent = abierto ? 'Ocultar resumen' : 'Ver resumen';
  });
  const aplicarCupon = () => { d.cupon = $('#cupon').value.trim(); borrador.guardar(d); cotizar({ avisarCupon: true }); };
  $('#aplicar').addEventListener('click', aplicarCupon);
  $('#cupon').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); aplicarCupon(); } });

  // ------------------------------------------------ avanzar / confirmar
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    leer();
    if (!mostrarErrores(paso, true)) { $('#error').textContent = 'Revisá los campos marcados.'; return; }
    $('#error').textContent = '';
    if (paso < 3) { ir(`/checkout?paso=${paso + 1}`); return; }
    const b = $('#seguir');
    b.disabled = true;
    b.classList.add('is-cargando');
    try {
      const r = await tienda.checkout.confirmar({
        metodoPago: d.pago, envio: envioDe(d.envio) ? d.envio : null, cupon: cuponElegido,
        direccion: conDireccion() ? direccionCompleta(d) : esRetiro() && d.horario ? `Retiro · Horario: ${d.horario}` : null,
        nota: [esRetiro() && d.horario ? `Horario de retiro: ${d.horario}` : '', d.nota.trim()].filter(Boolean).join('\n') || null,
        cliente: { nombre: `${d.nombre.trim()} ${d.apellido.trim()}`.trim(), email: d.email.trim(), telefono: d.telefono.trim(), nacimiento: d.nacimiento || null },
        volver: '/pedido',
      });
      borrador.despuesDeComprar(d);
      if (r.payUrl) { location.href = r.payUrl; return; }
      ir(`/pedido?pedido=${encodeURIComponent(r.token)}`);
    } catch (err) {
      b.disabled = false;
      b.classList.remove('is-cargando');
      $('#error').textContent = err.message;
      // Cupón de un solo uso que ya se usó: se saca y queda el mejor descuento que sí corresponde (revisá el total)
      if (/solo uso/i.test(err.message) && d.cupon) {
        d.cupon = '';
        if ($('#cupon')) $('#cupon').value = '';
        borrador.guardar(d);
        $('#error').textContent = `${err.message}. Lo sacamos: revisá el total y confirmá de nuevo.`;
      }
      $('#error').scrollIntoView({ block: 'center', behavior: 'smooth' });
      cotizar(); // por si cambió el stock, un precio o el cupón
    }
  });

  // En el paso actual, el primer campo vacío queda listo para escribir (en compu)
  if (matchMedia('(min-width: 990px)').matches) $$('input:not([type=radio])', form).find((x) => !x.value)?.focus({ preventScroll: true });
  cotizar();
}

const direccionCompleta = (d) => [d.direccion.trim(), d.apto.trim(), d.ciudad.trim(), d.departamento, d.cp.trim() && `CP ${d.cp.trim()}`].filter(Boolean).join(', ');
// El checkout y los pedidos no se indexan
const noIndexar = () => meta('robots', 'noindex, nofollow');

// ---------------------------------------------------------------- página del pedido (?pedido=<token>)
const ESTADO_ENVIO = { ready: 'Preparando el envío', in_transit: 'En camino', delivered: 'Entregado', returned: 'Devuelto' };

export async function pedido(app, token) {
  if (!token) { const e = new Error('404'); e.status = 404; throw e; }
  const o = await tienda.checkout.pedido(token);
  tituloPagina(`Pedido #${o.number}`);
  noIndexar();
  const pagado = o.paymentStatus === 'paid';
  const cancelado = o.status === 'cancelled';
  const wa = waLink(`¡Hola! Hice el pedido #${o.number}`);
  app.innerHTML = `<section class="yu-pagina yu-pedido">
    <div class="yu-pedido__cab ${cancelado ? 'is-cancelado' : pagado ? 'is-pagado' : 'is-pendiente'}">
      <span class="yu-pedido__icono">${icono(cancelado ? 'cerrar' : 'check')}</span>
      <h1>${cancelado ? 'Pedido cancelado' : pagado ? '¡Gracias por tu compra!' : '¡Recibimos tu pedido!'}</h1>
      <p>Pedido <strong>#${o.number}</strong> · ${esc(o.paymentLabel ?? '')} · ${cancelado ? 'cancelado' : pagado ? 'pagado' : 'pendiente de pago'}</p>
    </div>
    ${o.instructions && !cancelado && !pagado ? `<div class="yu-pedido__instrucciones"><h2>Cómo pagar</h2><p>${esc(o.instructions).replace(/\n/g, '<br>')}</p></div>` : ''}
    ${o.payUrl && !pagado && !cancelado ? `<p><a class="yu-btn yu-btn--grande" href="${esc(o.payUrl)}">${icono('candado')}Pagar ahora</a></p>` : ''}
    ${o.expiresAt && !pagado && !cancelado ? `<p class="yu-checkout__nota">Tenés tiempo para pagar hasta el ${new Date(o.expiresAt).toLocaleString('es-UY', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}. Después el pedido se cancela solo.</p>` : ''}
    <div class="yu-resumen yu-resumen--pedido">
      <ul class="yu-resumen__lineas">${o.lines.map((l) => `<li><span class="yu-resumen__nombre">${l.quantity} × ${esc(l.title)}${l.variantTitle ? `<small>${esc(l.variantTitle)}</small>` : ''}</span><strong>${dinero(l.totalCents, o.currency)}</strong></li>`).join('')}</ul>
      <dl class="yu-resumen__totales">
        ${o.subtotalCents ? `<div><dt>Subtotal</dt><dd>${dinero(o.subtotalCents, o.currency)}</dd></div>` : ''}
        ${o.discountCents ? `<div class="is-descuento"><dt>Descuento${o.coupon ? ` (${esc(o.coupon)})` : ''}</dt><dd>− ${dinero(o.discountCents, o.currency)}</dd></div>` : ''}
        ${o.shippingMethod ? `<div><dt>${esc(o.shippingMethod)}</dt><dd>${o.shippingCents ? dinero(o.shippingCents, o.currency) : 'Gratis'}</dd></div>` : ''}
        ${o.paymentAdjustCents ? `<div class="${o.paymentAdjustCents < 0 ? 'is-descuento' : ''}"><dt>${esc(o.paymentAdjustLabel || 'Ajuste por medio de pago')}</dt><dd>${o.paymentAdjustCents < 0 ? '− ' : '+ '}${dinero(Math.abs(o.paymentAdjustCents), o.currency)}</dd></div>` : ''}
        <div class="yu-resumen__total"><dt>Total</dt><dd>${dinero(o.totalCents, o.currency)}</dd></div>
      </dl>
    </div>
    ${o.shipments?.length ? `<div class="yu-pedido__envio"><h2>Tu envío</h2>${o.shipments.map((s) => `<p>${esc(s.carrier)} · ${ESTADO_ENVIO[s.status] ?? ''}${s.trackingNumber ? ` · Guía <b>${esc(s.trackingNumber)}</b>` : ''}${s.trackingUrl ? ` <a href="${esc(s.trackingUrl)}" target="_blank" rel="noopener">Seguir mi envío</a>` : ''}</p>`).join('')}</div>` : ''}
    <p class="yu-checkout__nota">Te escribimos a <strong>${esc(o.customerEmail || '')}</strong> con las novedades de tu pedido.</p>
    <p class="yu-pedido__botones"><a class="yu-btn yu-btn--borde" href="/tienda" data-link>Seguir mirando</a>${wa ? `<a class="yu-btn yu-btn--texto" href="${esc(wa)}" target="_blank" rel="noopener">${icono('wa')}Consultar por WhatsApp</a>` : ''}</p>
  </section>`;
}
