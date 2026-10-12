// Páginas chicas: legales, favoritos, 404, cuenta del cliente (módulo) y reseñas (módulo). El contacto está en el pie.
import { tienda, $, $$, esc, icono, ctx, tarjeta, tarjetasCargando, tituloPagina, tituloSeccion, favoritos, waLink, dinero, enlace } from '../comun.js';
import { ilustracion } from '../ilustraciones.js';
import { pintarCalculadora } from '../calculadora-ui.js';
import { MATERIALES, CUIDADO_MOLDES } from '../calculadora.js';
import { abrirCarrito, abrirCuenta } from '../app.js';
import { iniciarCarrusel } from './inicio.js';

export function paginaCalculadora(app) {
  tituloPagina('Calculadora de materiales', 'Cuánto yeso, cera, jabón, resina o chocolate necesitás para tu molde, con consejos y cuidado de moldes.');
  const params = new URLSearchParams(location.search);
  app.innerHTML = `<section class="yu-pagina yu-calc-pagina">
    <header class="yu-cat-cab"><div><p class="yu-etiqueta-seccion">${esc(ctx.t('calc.etiqueta'))}</p><h1>${esc(ctx.t('calc.titulo'))}</h1><p class="yu-cat-cab__desc">${esc(ctx.t('calc.texto'))}</p></div>
      <span class="yu-circulo yu-circulo--grande" style="--yu-bg:#fff">${ilustracion('yeso')}</span></header>
    <div id="calc-pagina"></div>
    <div class="yu-calc-guia yu-carrusel yu-carrusel--desvanece" data-carrusel>
      ${tituloSeccion({ titulo: 'Consejos por material', id: 'consejos-titulo', flechas: true })}
      <div class="yu-carrusel__pista yu-calc-guia__grilla" aria-labelledby="consejos-titulo">${Object.values(MATERIALES).map((m) => `<article class="yu-calc-guia__tarjeta">
        <h3><span class="yu-circulo yu-circulo--chico" style="--yu-bg:#fff">${ilustracion(m.ill)}</span>${esc(m.nombre)}</h3>
        <ul>${m.consejos.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></article>`).join('')}
        <article class="yu-calc-guia__tarjeta yu-calc-guia__tarjeta--moldes"><h3><span class="yu-circulo yu-circulo--chico" style="--yu-bg:#fff">${ilustracion('regalo')}</span>Cuidado de tus moldes</h3>
        <ul>${CUIDADO_MOLDES.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></article>
      </div>
    </div>
  </section>`;
  pintarCalculadora($('#calc-pagina'), { material: params.get('material') ?? undefined });
  // Consejos: una sola fila que avanza sola (se pausa con el mouse, el foco o al tocarla)
  iniciarCarrusel($('.yu-calc-guia', app), { solo: 5 });
}

export async function legal(app, tipo) {
  const l = await tienda.legal(tipo);
  tituloPagina(l.title);
  app.innerHTML = `<article class="yu-pagina yu-legal"><h1>${esc(l.title)}</h1><div class="yu-texto-rico">${l.html}</div></article>`;
}

export async function paginaFavoritos(app) {
  tituloPagina('Favoritos');
  const lista = favoritos.lista();
  app.innerHTML = `<section class="yu-pagina">
    <header class="yu-cat-cab"><div><p class="yu-etiqueta-seccion">Guardados en este dispositivo</p><h1>Tus favoritos</h1></div>
      <span class="yu-circulo yu-circulo--grande" style="--yu-bg:#fff">${icono('corazon', 'yu-cat-cab__corazon')}</span></header>
    <div class="yu-grilla" id="favs">${lista.length ? tarjetasCargando(Math.min(lista.length, 8)) : ''}</div>
  </section>`;
  if (!lista.length) {
    $('#favs').outerHTML = `<div class="yu-vacio"><span class="yu-circulo" style="--yu-bg:#FFD3CC">${icono('corazon')}</span><h2>Todavía no guardaste nada</h2><p>Tocá el corazón de un producto para tenerlo a mano.</p><a class="yu-btn" href="/tienda" data-link>Ver la tienda</a></div>`;
    return;
  }
  const res = await Promise.allSettled(lista.map((h) => tienda.productos.uno(h)));
  const productos = res.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  $('#favs').innerHTML = productos.map((p) => tarjeta(p)).join('') || '<p class="yu-vacio">Los productos que guardaste ya no están en la tienda.</p>';
  // Un favorito que se saca desaparece de la lista
  const quitar = () => {
    if (!app.contains($('#favs'))) { document.removeEventListener('yu:favoritos', quitar); return; }
    $$('#favs .yu-card').forEach((card) => { if (card.querySelector('[data-fav][aria-pressed="false"]')) card.remove(); });
  };
  document.addEventListener('yu:favoritos', quitar);
}

export function noEncontrada(app, mensaje) {
  tituloPagina('Página no encontrada');
  app.innerHTML = `<section class="yu-pagina yu-vacio yu-vacio--pagina">
    <span class="yu-circulo" style="--yu-bg:#E3DBFF">${ilustracion('brillo')}</span>
    <h1>${mensaje ? 'Algo no salió bien' : 'No encontramos esta página'}</h1>
    <p>${esc(mensaje ?? 'Puede que el producto ya no esté o que el link tenga un error.')}</p>
    <p class="yu-vacio__botones"><a class="yu-btn" href="/tienda" data-link>Ver la tienda</a><a class="yu-btn yu-btn--borde" href="/" data-link>Ir al inicio</a></p>
  </section>`;
}

// ---------------------------------------------------------------- cuenta del cliente (módulo Cuentas de clientes)
const ESTADO_PEDIDO = (o) => (o.status === 'cancelled' ? 'Cancelado' : o.paymentStatus !== 'paid' ? 'Pendiente de pago'
  : o.fulfillmentStatus === 'delivered' ? 'Entregado' : o.fulfillmentStatus === 'shipped' ? 'Enviado' : 'Pagado, en preparación');

export async function cuenta(app) {
  tituloPagina('Mi cuenta');
  const codigo = new URLSearchParams(location.search).get('codigo');
  const marco = (html) => { app.innerHTML = `<section class="yu-pagina yu-cuenta">${html}</section>`; };
  const enviar = (form, fn) => form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const estado = form.querySelector('[role=alert]');
    estado.textContent = '';
    form.querySelector('button').disabled = true;
    try { await fn(Object.fromEntries(new FormData(form)), estado); } catch (err) { estado.textContent = err.message; }
    form.querySelector('button').disabled = false;
  });
  const recargar = () => window.dispatchEvent(new Event('yu:ruta'));

  if (codigo) {
    marco(`<h1>Elegí tu contraseña</h1>
      <form class="yu-tarjeta-form" id="f-clave"><label class="yu-campo"><span>Contraseña nueva (8 caracteres o más)</span><input name="clave" type="password" required minlength="8" autocomplete="new-password"></label>
      <button class="yu-btn">Guardar y entrar</button><p class="yu-error" role="alert"></p></form>`);
    enviar($('#f-clave'), async (d, estado) => {
      const r = await tienda.cuenta.restablecer(codigo, d.clave);
      history.replaceState(null, '', enlace('/cuenta'));
      if (r.approval) { estado.textContent = 'Listo, guardamos tu contraseña. Tu cuenta está esperando la aprobación de la tienda: te avisamos por mail.'; return; }
      recargar();
    });
    return;
  }

  if (!ctx.cliente) {
    // Ingresar y crear la cuenta van en el popup (también desde el ícono de la barra)
    marco(`<div class="yu-vacio yu-vacio--pagina"><span class="yu-circulo" style="--yu-bg:#FFE1D3">${icono('usuario')}</span>
      <h1>Tu cuenta</h1><p>Ingresá para ver tus pedidos y comprar más rápido.</p>
      <p class="yu-vacio__botones"><button type="button" class="yu-btn" id="cuenta-ingresar">Ingresar</button><button type="button" class="yu-btn yu-btn--borde" id="cuenta-crear">Crear cuenta</button></p></div>`);
    $('#cuenta-ingresar').addEventListener('click', () => abrirCuenta('ingresar'));
    $('#cuenta-crear').addEventListener('click', () => abrirCuenta('registrar'));
    abrirCuenta();
    return;
  }

  const c = ctx.cliente;
  const pedidos = await tienda.cuenta.pedidos();
  marco(`<h1>Hola, ${esc(c.name.split(' ')[0])}</h1>
    <h2>Mis pedidos</h2>
    ${pedidos.length ? `<div class="yu-cuenta__lista">${pedidos.map((o) => `
      <div class="yu-cuenta__item">
        <${o.token ? `a href="/pedido?pedido=${encodeURIComponent(o.token)}" data-link` : 'div'} class="yu-cuenta__pedido"><strong>Pedido #${o.number} · ${dinero(o.totalCents, o.currency)}</strong>
          <span>${new Date(o.createdAt).toLocaleDateString('es-UY')} · ${ESTADO_PEDIDO(o)}</span>
          <small>${o.lines.map((l) => `${l.quantity} × ${esc(l.title)}`).join(', ')}</small></${o.token ? 'a' : 'div'}>
        <button class="yu-btn yu-btn--chico yu-btn--borde" data-repetir="${o.number}">Volver a pedir</button>
      </div>`).join('')}</div>` : '<p class="yu-vacio">Todavía no hiciste pedidos.</p>'}
    <h2 id="datos">Mis datos</h2>
    <form class="yu-tarjeta-form" id="f-datos">
      <div class="yu-campos-2"><label class="yu-campo"><span>Nombre y apellido</span><input name="nombre" required value="${esc(c.name)}" autocomplete="name"></label>
      <label class="yu-campo"><span>Celular</span><input name="telefono" value="${esc(c.phone ?? '')}" autocomplete="tel"></label></div>
      <label class="yu-campo"><span>Dirección</span><input name="direccion" value="${esc(c.address ?? '')}" autocomplete="street-address"></label>
      <label class="yu-campo"><span>Ciudad</span><input name="ciudad" value="${esc(c.city ?? '')}" autocomplete="address-level2"></label>
      <button class="yu-btn yu-btn--borde">Guardar</button><p class="yu-error" role="alert"></p>
    </form>
    <p><button class="yu-btn yu-btn--texto" id="salir">Salir de mi cuenta</button></p>`);
  enviar($('#f-datos'), async (d, estado) => { ctx.cliente = await tienda.cuenta.actualizar(d); estado.textContent = 'Datos guardados.'; });
  $$('[data-repetir]').forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true;
    const r = await tienda.cuenta.repetir(pedidos.find((o) => String(o.number) === b.dataset.repetir)).catch((e) => ({ error: e.message }));
    b.disabled = false;
    if (r.error) { b.insertAdjacentHTML('afterend', `<p class="yu-error">${esc(r.error)}</p>`); return; }
    if (r.faltantes?.length) b.insertAdjacentHTML('afterend', `<p class="yu-error">Ya no están disponibles: ${esc(r.faltantes.join(', '))}</p>`);
    if (r.agregados) abrirCarrito();
  }));
  $('#salir').addEventListener('click', async () => { await tienda.cuenta.salir(); recargar(); });
}

// ---------------------------------------------------------------- reseñas (módulo Reseñas): llega desde el mail con ?codigo=
export async function resena(app, codigo) {
  tituloPagina('Tu opinión');
  let datos;
  try { datos = await tienda.resenas.pendientes(codigo); } catch {
    app.innerHTML = '<section class="yu-pagina yu-vacio yu-vacio--pagina"><h1>Ese link ya no sirve</h1><p><a class="yu-btn" href="/" data-link>Ir a la tienda</a></p></section>';
    return;
  }
  const estrellas = (n) => `<span class="yu-estrellas" aria-label="${n} de 5 estrellas">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`;
  app.innerHTML = `<section class="yu-pagina yu-cuenta">
    <h1>${datos.name ? `${esc(datos.name)}, ` : ''}¿qué te pareció tu compra?</h1>
    <p class="yu-checkout__nota">Pedido #${datos.order}. Tu opinión se publica con tu nombre de pila.</p>
    ${datos.products.map((p) => p.reviewed
      ? `<div class="yu-tarjeta-form"><h2>${esc(p.title)}</h2><p>${estrellas(p.rating)} ¡Gracias por tu opinión!</p></div>`
      : `<form class="yu-tarjeta-form" data-producto="${esc(p.productId)}"><h2>${esc(p.title)}</h2>
          <fieldset class="yu-estrellas-form"><legend>Tu calificación</legend>
            ${[5, 4, 3, 2, 1].map((n) => `<label><input type="radio" name="estrellas" value="${n}" required> ${'★'.repeat(n)}</label>`).join('')}</fieldset>
          <label class="yu-campo"><span>En pocas palabras <small>(opcional)</small></span><input name="titulo" maxlength="120"></label>
          <label class="yu-campo"><span>Contanos más <small>(opcional)</small></span><textarea name="texto" maxlength="2000"></textarea></label>
          <button class="yu-btn">Enviar mi opinión</button><p class="yu-error" role="alert"></p></form>`).join('')}
  </section>`;
  $$('form[data-producto]', app).forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    f.querySelector('button').disabled = true;
    try {
      const r = await tienda.resenas.enviar(codigo, { producto: f.dataset.producto, estrellas: Number(d.estrellas), titulo: d.titulo, texto: d.texto });
      f.outerHTML = `<div class="yu-tarjeta-form"><h2>${f.querySelector('h2').innerHTML}</h2><p>${estrellas(Number(d.estrellas))} ¡Gracias! ${r.published ? 'Tu opinión ya está publicada.' : 'La vamos a publicar en breve.'}</p></div>`;
    } catch (err) { f.querySelector('[role=alert]').textContent = err.message; f.querySelector('button').disabled = false; }
  }));
}
