// Yuan Import · web para la plataforma de Stratta Studio (Kit NS).
// Todos los datos salen de la tienda con el SDK: el cliente los cambia desde su panel.
// Rutas: /  ·  /tienda  ·  /categoria/:handle  ·  /buscar?q=  ·  /producto/:handle  ·  /favoritos  ·  /contacto
//        /legal/:tipo  ·  /checkout  ·  /pedido?pedido=  ·  /cuenta (módulo Cuentas)  ·  /resena?codigo= (módulo Reseñas)
import { tienda, $, $$, esc, icono, ctx, prepararEscalones, dinero, foto, favoritos, ir, waLink, hrefDe, atributosLink, meta, reducido, BASE, enlace, sinBase, rutaActual } from './comun.js';
import { crearTextos } from './textos.js';
import { estadoDescuento, completar } from './descuentos.js';
import { ilustracion, ilustracionDe, PASTELES } from './ilustraciones.js';
import { inicio, iniciarCarrusel } from './paginas/inicio.js';
import { catalogo } from './paginas/catalogo.js';
import { ficha } from './paginas/ficha.js';
import { checkout, pedido } from './paginas/checkout.js';
import { legal, paginaFavoritos, noEncontrada, cuenta, resena, paginaCalculadora } from './paginas/otras.js';

const app = $('#app');
let rutaVista = '';

// En la vista previa (web dentro de una carpeta) los links internos se ajustan solos a esa carpeta
if (BASE) {
  const ajustar = (raiz) => raiz.querySelectorAll?.('a[href^="/"]').forEach((a) => { const h = a.getAttribute('href'); if (h !== enlace(h)) a.setAttribute('href', enlace(h)); });
  new MutationObserver((cambios) => cambios.forEach((c) => c.addedNodes.forEach((n) => { if (n.nodeType === 1) { if (n.matches('a[href^="/"]')) ajustar(n.parentNode); ajustar(n); } }))).observe(document.body, { childList: true, subtree: true });
  ajustar(document);
}

// ---------------------------------------------------------------- arranque
async function arrancar() {
  ctx.info = await tienda.info();
  ctx.t = crearTextos(ctx.info.content?.texts);
  prepararEscalones();
  const { info } = ctx;

  // Colores del panel (Apariencia): el turquesa de la marca, la tinta y el crema
  const raiz = document.documentElement.style;
  if (info.colors.primary) raiz.setProperty('--yu-turq', info.colors.primary);
  if (info.colors.dark) raiz.setProperty('--yu-tinta', info.colors.dark);
  if (info.colors.light) raiz.setProperty('--yu-crema', info.colors.light);
  // Logo: si el panel tiene uno cargado se usa; si no, el logo "yuani" de la web
  if (info.logo) $('#marca').innerHTML = `<img src="${esc(info.logo)}" alt="${esc(info.name)}" height="40">`;
  $('#marca').setAttribute('aria-label', `${info.name}, ir al inicio`);
  if (info.favicon) $('link[rel=icon]').href = info.favicon;
  meta('og:site_name', info.name, 'property');
  meta('og:type', 'website', 'property');
  if (info.shareImage) meta('og:image', info.shareImage, 'property');
  if (info.seo.noindex) meta('robots', 'noindex, nofollow');

  if (info.modules?.accounts) {
    ctx.cliente = await tienda.cuenta.yo().catch(() => null);
    tienda.cuenta.alCambiar((c) => { ctx.cliente = c; pintarMenus(); pintarBotonCuenta(); });
    crearPopupCuenta();
    pintarBotonCuenta();
  }
  const wa = waLink();
  // WhatsApp: burbuja aparte a la derecha de la barra (compu y tablet) y un ícono más dentro de la barra en celular
  if (wa) for (const id of ['#wa-header', '#wa-burbuja']) { $(id).href = wa; $(id).hidden = false; }

  pintarMenus();
  pintarHablemos();
  pintarAnuncio();
  pintarPie();
  pintarCookies();
  pintarFavoritos();
  document.addEventListener('yu:favoritos', pintarFavoritos);

  if (ctx.escalones.length) crearBurbujaDescuentos();
  tienda.carrito.alCambiar(pintarCarrito);
  pintarCarrito(await tienda.carrito.ver().catch(() => ({ lines: [], itemCount: 0, subtotal: 0, total: 0, currency: info.currency })));
  window.addEventListener('popstate', () => { if (rutaActual() !== rutaVista) ruta(); });
  window.addEventListener('yu:ruta', () => ruta());
  ruta();
}

// ---------------------------------------------------------------- rutas
document.addEventListener('click', (e) => {
  // Anclas de la misma página ("#app"): con <base> el navegador iría a otra dirección
  const ancla = e.target.closest('a[href^="#"]');
  if (ancla && ancla.getAttribute('href').length > 1) {
    e.preventDefault();
    const destino = document.getElementById(ancla.getAttribute('href').slice(1));
    destino?.scrollIntoView({ behavior: reducido() ? 'auto' : 'smooth' });
    destino?.focus({ preventScroll: true });
    return;
  }
  const a = e.target.closest('a[data-link]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  const href = sinBase(a.getAttribute('href'));
  if (href !== rutaActual()) history.pushState(null, '', enlace(href));
  ruta();
});

async function ruta() {
  rutaVista = rutaActual();
  const [seccion, valor] = sinBase(location.pathname).split('/').filter(Boolean).map(decodeURIComponent);
  const params = new URLSearchParams(location.search);
  cerrarBuscador();
  cerrarCarrito();
  marcarNavActiva();
  window.scrollTo(0, 0);
  document.body.dataset.pagina = seccion || 'inicio';
  try {
    if (!seccion) await inicio(app);
    else if (seccion === 'tienda') await catalogo(app, { params });
    else if (seccion === 'categoria' && valor) await catalogo(app, { categoria: valor, params });
    else if (seccion === 'buscar') await catalogo(app, { buscar: params.get('q') ?? '', params });
    else if ((seccion === 'producto' || seccion === 'productos') && valor) await ficha(app, valor);
    else if (seccion === 'favoritos') await paginaFavoritos(app);
    else if (seccion === 'calculadora') paginaCalculadora(app);
    else if (seccion === 'contacto') { await inicio(app); irAlFormulario(); }
    else if (seccion === 'legal' && valor) await legal(app, valor);
    else if (seccion === 'checkout') await checkout(app);
    else if (seccion === 'pedido') await pedido(app, params.get('pedido'));
    else if (seccion === 'cuenta' && ctx.info.modules?.accounts) await cuenta(app);
    else if (seccion === 'resena' && ctx.info.modules?.reviews) await resena(app, params.get('codigo'));
    else noEncontrada(app);
  } catch (err) {
    console.error(err);
    noEncontrada(app, err.status && err.status !== 404 ? 'No pudimos cargar esta página. Probá de nuevo en un momento.' : null);
  }
  app.focus({ preventScroll: true });
  // Ancla en la dirección (/cuenta#datos): se baja hasta ahí
  if (location.hash.length > 1) requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: 'start' }));
}

// ---------------------------------------------------------------- header y menús
const MENU_BASICO = () => [
  { label: 'Tienda', kind: 'catalog', children: [] },
  { label: 'Ofertas', kind: 'category', handle: 'ofertas', children: [] },
  { label: 'Contacto', kind: 'url', url: '/contacto', children: [] },
];

function menuPrincipal() {
  const { info, cliente } = ctx;
  const base = info.menus.main.length ? info.menus.main : MENU_BASICO();
  const tiene = (r) => base.some((l) => l.url === r || l.children?.some((c) => c.url === r));
  // La calculadora de materiales siempre está a mano (si el menú del panel no la trae ya)
  return [...base, ...(!tiene('/calculadora') ? [{ label: 'Calculadora', kind: 'url', url: '/calculadora', children: [] }] : []), ...(info.modules?.accounts && !tiene('/cuenta') ? [{ label: cliente ? 'Mi cuenta' : 'Ingresar', kind: 'url', url: '/cuenta', children: [] }] : [])];
}

function pintarMenus() {
  const main = menuPrincipal();
  // Menú en línea (compu): los enlaces con hijos abren un desplegable con los círculos de categorías
  $('#nav').innerHTML = main.filter((l) => l.url !== '/cuenta').map((l, i) => {
    const href = hrefDe(l);
    if (!l.children?.length) return `<a class="yu-nav__link" href="${esc(href)}"${atributosLink(href)}>${esc(l.label)}</a>`;
    return `<div class="yu-nav__item">
      <a class="yu-nav__link" href="${esc(href)}"${atributosLink(href)}>${esc(l.label)}</a>
      <button type="button" class="yu-nav__abrir" aria-expanded="false" aria-controls="desp-${i}" aria-label="Ver las opciones de ${esc(l.label)}">${icono('abajo')}</button>
      <div class="yu-desplegable" id="desp-${i}">
        <div class="yu-carrusel yu-carrusel--desvanece" data-carrusel-desp>
          <button type="button" class="yu-carrusel__flecha yu-carrusel__flecha--izq" data-dir="-1" aria-label="Anteriores" tabindex="-1">${icono('izq')}</button>
          <div class="yu-carrusel__pista yu-desplegable__pista">${l.children.map((c, n) => { const h = hrefDe(c); return `<a href="${esc(h)}"${atributosLink(h)}><span class="yu-circulo" style="--yu-bg:${PASTELES[n % PASTELES.length]}">${ilustracion(ilustracionDe(c.label))}</span>${esc(c.label)}</a>`; }).join('')}</div>
          <button type="button" class="yu-carrusel__flecha yu-carrusel__flecha--der" data-dir="1" aria-label="Más" tabindex="-1">${icono('der')}</button>
        </div>
        <a class="yu-desplegable__todo" href="${esc(href)}"${atributosLink(href)}>Ver todo ${icono('der')}</a>
      </div>
    </div>`;
  }).join('');

  $$('#nav [data-carrusel-desp]').forEach((el) => iniciarCarrusel(el));

  // Menú grande (☰): círculos con ilustración, sin números (diseño de Yuani), subcategorías debajo
  $('#panel-nav').innerHTML = main.map((l, i) => {
    const href = hrefDe(l);
    return `<div class="yu-panel__grupo" style="--i:${i}">
      <a class="yu-panel__link" href="${esc(href)}"${atributosLink(href)}><span class="yu-circulo yu-circulo--chico" style="--yu-bg:${PASTELES[i % PASTELES.length]}">${ilustracion(ilustracionDe(l.label))}</span>${esc(l.label)}</a>
      ${l.children?.length ? `<div class="yu-panel__sub">${l.children.map((c) => { const h = hrefDe(c); return `<a href="${esc(h)}"${atributosLink(h)}>${esc(c.label)}</a>`; }).join('')}</div>` : ''}
    </div>`;
  }).join('') + `<a class="yu-panel__link yu-panel__link--fav" href="/favoritos" data-link><span class="yu-circulo yu-circulo--chico" style="--yu-bg:#FFD3CC">${icono('corazon')}</span>Favoritos</a>`;
  marcarNavActiva();
}

// Desplegables del menú en línea: con el mouse se abren al pasar; con teclado o toque, con el botón
document.addEventListener('click', (e) => {
  const b = e.target.closest('.yu-nav__abrir');
  $$('.yu-nav__item.is-open').forEach((it) => { if (!b || !it.contains(b)) { it.classList.remove('is-open'); it.querySelector('.yu-nav__abrir').setAttribute('aria-expanded', 'false'); } });
  if (!b) return;
  const it = b.closest('.yu-nav__item');
  const abierto = it.classList.toggle('is-open');
  b.setAttribute('aria-expanded', String(abierto));
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const it = $('.yu-nav__item.is-open');
  if (it) { it.classList.remove('is-open'); it.querySelector('.yu-nav__abrir').setAttribute('aria-expanded', 'false'); it.querySelector('.yu-nav__abrir').focus(); }
});
document.addEventListener('focusout', (e) => {
  const it = e.target.closest?.('.yu-nav__item');
  if (it && !it.contains(e.relatedTarget)) { it.classList.remove('is-open'); it.querySelector('.yu-nav__abrir').setAttribute('aria-expanded', 'false'); }
});

function marcarNavActiva() {
  const p = sinBase(location.pathname);
  $$('#nav .yu-nav__link, #panel-nav a').forEach((a) => {
    const h = sinBase(a.getAttribute('href'));
    const activo = h === p || (h === '/tienda' && (p.startsWith('/categoria/') || p === '/buscar'));
    a.classList.toggle('is-active', activo && (h !== '/tienda' || !$$('#nav a').some((x) => sinBase(x.getAttribute('href')) === p && x !== a)));
    if (activo) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

function pintarHablemos() {
  const c = ctx.info.contact ?? {};
  const wa = waLink();
  const redes = [['instagram', 'ig', 'Instagram'], ['facebook', 'fb', 'Facebook'], ['tiktok', '', 'TikTok'], ['youtube', '', 'YouTube'], ['x', '', 'X'], ['linkedin', '', 'LinkedIn'], ['pinterest', '', 'Pinterest']].filter(([k]) => c[k]);
  $('#hablemos').insertAdjacentHTML('beforeend', [
    wa && `<a href="${esc(wa)}" target="_blank" rel="noopener"><span class="yu-circulo-icono">${icono('wa')}</span>WhatsApp</a>`,
    c.email && `<a href="mailto:${esc(c.email)}"><span class="yu-circulo-icono">${icono('mail')}</span>${esc(c.email)}</a>`,
    c.phone && `<a href="tel:${esc(c.phone.replace(/\s/g, ''))}"><span class="yu-circulo-icono">${icono('tel')}</span>${esc(c.phone)}</a>`,
    c.location && `<p><span class="yu-circulo-icono">${icono('pin')}</span>${esc(c.location)}</p>`,
    c.hours && `<p class="yu-horario">${esc(c.hours)}</p>`,
    redes.length && `<div class="yu-panel__redes">${redes.map(([k, i, n]) => `<a href="${esc(c[k])}" target="_blank" rel="noopener">${i ? icono(i) : ''}${n}</a>`).join('')}</div>`,
  ].filter(Boolean).join(''));
  if (!$('#hablemos').querySelector('a, p:not(.ns-panel__label)')) $('#hablemos').hidden = true;
}

function pintarAnuncio() {
  const a = ctx.info.announcement;
  if (!a) return;
  const el = $('#anuncio');
  el.classList.add(`yu-anuncio--${a.style === 'floating' ? 'flotante' : 'barra'}`);
  el.innerHTML = a.link && !a.buttonText
    ? `<a href="${esc(a.link)}"${atributosLink(a.link)}>${esc(a.text)}</a>`
    : `<span>${esc(a.text)}</span>${a.buttonText && a.link ? ` <a href="${esc(a.link)}"${atributosLink(a.link)}>${esc(a.buttonText)} →</a>` : ''}`;
  if (a.style === 'floating') el.insertAdjacentHTML('beforeend', `<button type="button" class="yu-icono-btn" aria-label="Cerrar aviso">${icono('cerrar')}</button>`);
  el.querySelector('button')?.addEventListener('click', () => { el.hidden = true; });
  el.hidden = false;
  if (a.style === 'floating') return;
  // El header flotante baja lo que mide el anuncio mientras se ve arriba de todo; al bajar, vuelve a su lugar
  const raiz = document.documentElement;
  const medir = () => raiz.style.setProperty('--yu-anuncio-h', `${Math.max(0, el.offsetHeight - window.scrollY)}px`);
  new ResizeObserver(medir).observe(el);
  window.addEventListener('scroll', medir, { passive: true });
  medir();
}

function pintarFavoritos() {
  const n = favoritos.lista().length;
  $('#fav-contador').textContent = n;
  $('#fav-contador').hidden = !n;
  $$('[data-fav]').forEach((b) => b.setAttribute('aria-pressed', String(favoritos.tiene(b.dataset.fav))));
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-fav]');
  if (!b) return;
  e.preventDefault();
  const si = favoritos.cambiar(b.dataset.fav);
  b.classList.remove('is-latido'); void b.offsetWidth; if (si) b.classList.add('is-latido');
});

// ---------------------------------------------------------------- cuentas de clientes (módulo): popup
// Ingresar, crear la cuenta y "olvidé mi contraseña" en un popup; ya adentro, el popup saluda y lleva a pedidos y datos
// (/cuenta). Los links a /cuenta abren el popup si todavía no ingresó. La sesión la maneja la plataforma (cookie segura).
function pintarBotonCuenta() {
  const b = $('#abrir-cuenta');
  b.hidden = false;
  b.classList.toggle('is-adentro', !!ctx.cliente);
  b.setAttribute('aria-label', ctx.cliente ? `Mi cuenta (${ctx.cliente.name})` : 'Ingresar a tu cuenta');
}
function crearPopupCuenta() {
  document.body.insertAdjacentHTML('beforeend', `<dialog class="yu-cuenta-pop" id="cuenta-pop" aria-labelledby="cuenta-pop-titulo">
    <div class="yu-cuenta-pop__arte" aria-hidden="true">
      <span class="yu-cuenta-pop__manchas"><i></i><i></i><i></i></span>
      ${[['vela', '#FFEDB3'], ['regalo', '#fff'], ['jabon', '#E3DBFF'], ['resina', '#D6EEFF']].map(([n, b], k) => `<span class="yu-cuenta-pop__burbuja yu-cuenta-pop__burbuja--${k + 1}" style="--b:${b}">${ilustracion(n)}</span>`).join('')}
      <p class="yu-cuenta-pop__lema">Tus moldes, tus pedidos y tus favoritos, en un solo lugar.</p>
    </div>
    <div class="yu-cuenta-pop__lado">
      <button type="button" class="yu-icono-btn yu-cuenta-pop__cerrar" aria-label="Cerrar">${icono('cerrar')}</button>
      <div class="yu-cuenta-pop__cuerpo" id="cuenta-pop-cuerpo"></div>
    </div>
  </dialog>`);
  const dlg = $('#cuenta-pop');
  $('.yu-cuenta-pop__cerrar', dlg).addEventListener('click', () => dlg.close());
  // Tocando afuera de la tarjeta se cierra
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  $('#abrir-cuenta').addEventListener('click', () => abrirCuenta());
}
export function abrirCuenta(vista) {
  const dlg = $('#cuenta-pop');
  if (!dlg) return;
  pintarPopupCuenta(vista ?? (ctx.cliente ? 'adentro' : 'ingresar'));
  if (!dlg.open) dlg.showModal();
  dlg.querySelector('input')?.focus();
}
function pintarPopupCuenta(vista) {
  const cuerpo = $('#cuenta-pop-cuerpo');
  const c = ctx.cliente;
  const pestanas = (activa) => `<div class="yu-cuenta-pop__tabs" role="tablist" aria-label="Cuenta">
    <button type="button" role="tab" aria-selected="${activa === 'ingresar'}" data-vista="ingresar">Ingresar</button>
    <button type="button" role="tab" aria-selected="${activa === 'registrar'}" data-vista="registrar">Crear cuenta</button></div>`;
  const encabezado = (titulo, texto) => `<div class="yu-cuenta-pop__cab"><h2 id="cuenta-pop-titulo">${titulo}</h2>${texto ? `<p class="yu-cuenta-pop__texto">${texto}</p>` : ''}</div>`;
  if (vista === 'adentro' && c) {
    cuerpo.innerHTML = `${encabezado(`¡Hola, ${esc(c.name.split(' ')[0])}!`, esc(c.email))}
      <nav class="yu-cuenta-pop__links" aria-label="Tu cuenta">
        <a href="/cuenta" data-link>${icono('bolsa')}<span><strong>Mis pedidos</strong><small>Estado, seguimiento y volver a pedir</small></span>${icono('der')}</a>
        <a href="/cuenta#datos" data-link>${icono('usuario')}<span><strong>Mis datos</strong><small>Nombre, celular y dirección de entrega</small></span>${icono('der')}</a>
        <a href="/favoritos" data-link>${icono('corazon')}<span><strong>Favoritos</strong><small>Lo que guardaste</small></span>${icono('der')}</a>
      </nav>
      <button type="button" class="yu-btn yu-btn--borde" data-salir>Salir de mi cuenta</button>`;
  } else if (vista === 'registrar') {
    cuerpo.innerHTML = `${encabezado('Creá tu cuenta', 'Comprá más rápido, seguí tus pedidos y volvé a pedir con un toque.')}${pestanas('registrar')}
      <form class="yu-cuenta-pop__form" data-form="registrar" novalidate>
        <label class="yu-campo"><span>Nombre y apellido</span><input name="nombre" required autocomplete="name"></label>
        <label class="yu-campo"><span>Email</span><input name="email" type="email" required autocomplete="email" inputmode="email"></label>
        <label class="yu-campo"><span>Celular <small>(opcional)</small></span><input name="telefono" type="tel" autocomplete="tel" inputmode="tel"></label>
        <label class="yu-campo"><span>Contraseña <small>(8 caracteres o más)</small></span><input name="clave" type="password" required minlength="8" autocomplete="new-password"></label>
        <p class="yu-error" role="alert"></p>
        <button class="yu-btn yu-btn--grande">Crear mi cuenta</button>
      </form>`;
  } else if (vista === 'olvide') {
    cuerpo.innerHTML = `${encabezado('¿Olvidaste tu contraseña?', 'Escribí tu email y te mandamos un link para elegir una nueva.')}
      <form class="yu-cuenta-pop__form" data-form="olvide" novalidate>
        <label class="yu-campo"><span>Email</span><input name="email" type="email" required autocomplete="email" inputmode="email"></label>
        <p class="yu-error" role="alert"></p>
        <button class="yu-btn yu-btn--grande">Mandarme el link</button>
        <button type="button" class="yu-btn yu-btn--texto" data-vista="ingresar">${icono('izq')}Volver a ingresar</button>
      </form>`;
  } else {
    cuerpo.innerHTML = `${encabezado('Ingresá a tu cuenta', 'Tus datos quedan listos para la próxima compra.')}${pestanas('ingresar')}
      <form class="yu-cuenta-pop__form" data-form="ingresar" novalidate>
        <label class="yu-campo"><span>Email</span><input name="email" type="email" required autocomplete="email" inputmode="email"></label>
        <label class="yu-campo"><span>Contraseña</span><input name="clave" type="password" required autocomplete="current-password"></label>
        <button type="button" class="yu-cuenta-pop__olvide" data-vista="olvide">Olvidé mi contraseña</button>
        <p class="yu-error" role="alert"></p>
        <button class="yu-btn yu-btn--grande">Ingresar</button>
      </form>`;
  }
  cuerpo.querySelectorAll('[data-vista]').forEach((b) => b.addEventListener('click', () => { pintarPopupCuenta(b.dataset.vista); cuerpo.querySelector('input')?.focus(); }));
  cuerpo.querySelectorAll('a[data-link]').forEach((a) => a.addEventListener('click', () => $('#cuenta-pop').close()));
  cuerpo.querySelector('[data-salir]')?.addEventListener('click', async () => { await tienda.cuenta.salir(); $('#cuenta-pop').close(); window.dispatchEvent(new Event('yu:ruta')); });
  const form = cuerpo.querySelector('form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const error = form.querySelector('[role=alert]');
    error.textContent = '';
    if (!/^\S+@\S+\.\S+$/.test(d.email || '')) { error.textContent = 'Revisá el email.'; form.email.focus(); return; }
    const boton = form.querySelector('.yu-btn--grande');
    boton.disabled = true;
    boton.classList.add('is-cargando');
    try {
      if (form.dataset.form === 'ingresar') {
        if (!d.clave) throw new Error('Escribí tu contraseña.');
        await tienda.cuenta.ingresar(d.email.trim(), d.clave);
        listo();
      } else if (form.dataset.form === 'registrar') {
        if (!d.nombre?.trim()) throw new Error('Escribí tu nombre.');
        if ((d.clave ?? '').length < 8) throw new Error('La contraseña tiene que tener 8 caracteres o más.');
        const r = await tienda.cuenta.registrar({ nombre: d.nombre.trim(), email: d.email.trim(), telefono: d.telefono, clave: d.clave, volver: '/cuenta' });
        if (r.pending) mensaje('Revisá tu email', 'Ya compraste con ese email: te mandamos un link para activar tu cuenta.');
        else if (r.approval) mensaje('¡Listo!', 'Creamos tu cuenta. La tienda la tiene que aprobar: te avisamos por mail cuando puedas ingresar.');
        else listo();
      } else {
        await tienda.cuenta.olvide(d.email.trim(), '/cuenta');
        mensaje('Revisá tu email', 'Si hay una cuenta con ese email, te llega un link para elegir una contraseña nueva.');
      }
    } catch (err) {
      error.textContent = err.message;
      boton.disabled = false;
      boton.classList.remove('is-cargando');
    }
  });
  function mensaje(titulo, texto) {
    cuerpo.innerHTML = `${encabezado(titulo, texto)}<button type="button" class="yu-btn yu-btn--grande" data-cerrar>Entendido</button>`;
    cuerpo.querySelector('[data-cerrar]').addEventListener('click', () => $('#cuenta-pop').close());
  }
  function listo() {
    pintarPopupCuenta('adentro');
    // En la cuenta o el checkout se vuelve a dibujar la página con los datos del cliente
    if (/^\/(cuenta|checkout)/.test(sinBase(location.pathname))) window.dispatchEvent(new Event('yu:ruta'));
  }
}
// Los links a /cuenta abren el popup mientras no haya ingresado
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || !ctx.info?.modules?.accounts || ctx.cliente || !$('#cuenta-pop')) return;
  if (sinBase(a.getAttribute('href')).split(/[?#]/)[0] !== '/cuenta') return;
  e.preventDefault();
  e.stopImmediatePropagation();
  cerrarCarrito();
  abrirCuenta();
}, true);

// ---------------------------------------------------------------- buscador (resultados mientras escribís)
const buscador = $('#buscador');
let buscarTimer = 0;
let buscarPedido = 0;
function abrirBuscador() {
  buscador.hidden = false;
  $('#abrir-buscador').setAttribute('aria-expanded', 'true');
  document.documentElement.classList.add('yu-buscando');
  requestAnimationFrame(() => buscador.classList.add('is-open'));
  const q = $('#buscador-q');
  q.value = new URLSearchParams(location.search).get('q') ?? '';
  q.focus();
  if (!q.value) sugerenciasBuscador();
}
function cerrarBuscador() {
  if (buscador.hidden) return;
  buscador.classList.remove('is-open');
  buscador.hidden = true;
  document.documentElement.classList.remove('yu-buscando');
  $('#abrir-buscador').setAttribute('aria-expanded', 'false');
}
async function sugerenciasBuscador() {
  const cats = await tienda.categorias().catch(() => []);
  const visibles = cats.filter((c) => c.productCount && !c.parent).slice(0, 8);
  $('#buscador-resultados').innerHTML = visibles.length ? `<p class="yu-buscador__titulo">Categorías</p><div class="yu-chips">${visibles.map((c, i) => `<a class="yu-chip" href="/categoria/${esc(c.handle)}" data-link><span class="yu-circulo yu-circulo--mini" style="--yu-bg:${PASTELES[i % PASTELES.length]}">${ilustracion(ilustracionDe(c.name))}</span>${esc(c.name)}</a>`).join('')}</div>` : '';
}
$('#abrir-buscador').addEventListener('click', () => (buscador.hidden ? abrirBuscador() : cerrarBuscador()));
$('#cerrar-buscador').addEventListener('click', () => { cerrarBuscador(); $('#abrir-buscador').focus(); });
buscador.addEventListener('click', (e) => { if (e.target === buscador) cerrarBuscador(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !buscador.hidden) { cerrarBuscador(); $('#abrir-buscador').focus(); }
  // "/" abre el buscador (como en muchas tiendas), salvo escribiendo en un campo
  if (e.key === '/' && buscador.hidden && !e.target.closest('input, textarea, select, [contenteditable]')) { e.preventDefault(); abrirBuscador(); }
});
$('#buscador-q').addEventListener('input', (e) => {
  clearTimeout(buscarTimer);
  const q = e.target.value.trim();
  if (q.length < 2) { sugerenciasBuscador(); return; }
  $('#buscador-resultados').setAttribute('aria-busy', 'true');
  buscarTimer = setTimeout(async () => {
    const n = ++buscarPedido;
    try {
      const r = await tienda.productos.listar({ buscar: q, porPagina: 6 });
      if (n !== buscarPedido) return; // llegó tarde: ya se escribió otra cosa
      const lista = r.items.length ? r.items : r.suggestions ?? [];
      $('#buscador-resultados').innerHTML = lista.length ? `
        <p class="yu-buscador__titulo">${r.items.length ? `${r.total} resultado${r.total === 1 ? '' : 's'}` : '¿Quisiste decir…?'}</p>
        <ul class="yu-buscador__lista">${lista.map((p) => `<li><a href="/producto/${esc(p.handle)}" data-link>${foto(p.image, p.title, { ancho: 320, sizes: '56px' })}<span><strong>${esc(p.title)}</strong><small>${dinero(p.price, p.currency)}${p.available ? '' : ' · Sin stock'}</small></span></a></li>`).join('')}</ul>
        ${r.total > lista.length && r.items.length ? `<a class="yu-btn yu-btn--borde yu-buscador__todos" href="/buscar?q=${encodeURIComponent(q)}" data-link>Ver los ${r.total} resultados</a>` : ''}`
        : `<p class="yu-buscador__vacio">No encontramos nada con “${esc(q)}”. Probá con otra palabra, por ejemplo “vela” o “yeso”.</p>`;
    } catch { $('#buscador-resultados').innerHTML = '<p class="yu-buscador__vacio">No pudimos buscar ahora. Probá de nuevo.</p>'; }
    $('#buscador-resultados').removeAttribute('aria-busy');
  }, 220);
});
$('#buscador-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = $('#buscador-q').value.trim();
  if (q) ir(`/buscar?q=${encodeURIComponent(q)}`);
});

// ---------------------------------------------------------------- carrito (firma NS 4) + descuentos por monto
const carrito = $('#carrito');
const velo = $('#carrito-velo');
let ultimoFoco = null;
let nivelAnterior = null;
let botonTocado = null;

export function abrirCarrito() {
  if (carrito.classList.contains('is-open')) return;
  ultimoFoco = document.activeElement;
  velo.hidden = false;
  carrito.inert = false;
  carrito.setAttribute('aria-hidden', 'false');
  document.documentElement.classList.add('yu-carrito-abierto');
  pintarBurbuja(ctx.carrito);
  requestAnimationFrame(() => { velo.classList.add('is-open'); carrito.classList.add('is-open'); });
  $('#cerrar-carrito').focus({ preventScroll: true });
}
function cerrarCarrito() {
  if (!carrito.classList.contains('is-open')) return;
  carrito.classList.remove('is-open');
  velo.classList.remove('is-open');
  carrito.inert = true;
  carrito.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('yu-carrito-abierto');
  pintarBurbuja(ctx.carrito);
  setTimeout(() => { if (!carrito.classList.contains('is-open')) velo.hidden = true; }, 350);
  if (ultimoFoco?.isConnected) ultimoFoco.focus({ preventScroll: true });
}
$('#abrir-carrito').addEventListener('click', abrirCarrito);
// En celular el carrito es una hoja que sube desde abajo: se arrastra hacia abajo desde la manija o el título para cerrarlo
(() => {
  let y0 = null;
  let dy = 0;
  let t0 = 0;
  const zonas = [$('.carrito__asa'), $('.carrito__cab')];
  zonas.forEach((z) => z.addEventListener('pointerdown', (e) => {
    if (!matchMedia('(max-width: 749px)').matches || e.target.closest('button')) return;
    y0 = e.clientY; dy = 0; t0 = performance.now();
    carrito.classList.add('is-arrastrando');
    z.setPointerCapture(e.pointerId);
  }));
  zonas.forEach((z) => z.addEventListener('pointermove', (e) => {
    if (y0 === null) return;
    dy = Math.max(0, e.clientY - y0);
    carrito.style.setProperty('--arrastre', `${dy}px`);
  }));
  const soltar = () => {
    if (y0 === null) return;
    const rapido = dy / Math.max(1, performance.now() - t0) > 0.6;
    y0 = null;
    carrito.classList.remove('is-arrastrando');
    carrito.style.removeProperty('--arrastre');
    if (dy > 110 || (rapido && dy > 30)) cerrarCarrito();
  };
  zonas.forEach((z) => { z.addEventListener('pointerup', soltar); z.addEventListener('pointercancel', soltar); });
})();
$('#cerrar-carrito').addEventListener('click', cerrarCarrito);
// Se cierra tocando el fondo solo si el toque empezó en el fondo (arrastrar desde el carrito no lo cierra)
let toqueEnVelo = false;
velo.addEventListener('pointerdown', () => { toqueEnVelo = true; });
document.addEventListener('pointerup', () => { setTimeout(() => { toqueEnVelo = false; }, 0); });
velo.addEventListener('click', () => { if (toqueEnVelo) cerrarCarrito(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && carrito.classList.contains('is-open')) cerrarCarrito();
  // El foco no sale del carrito mientras está abierto
  if (e.key === 'Tab' && carrito.classList.contains('is-open')) {
    const f = $$('button:not([disabled]), a[href], input', carrito).filter((x) => x.offsetParent);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
  }
});

/** Barra de progreso hacia los descuentos por monto. compacta = versión del aviso de "agregado". */
export function progresoDescuentos(subtotal, { compacta = false } = {}) {
  const { t, escalones } = ctx;
  if (!escalones.length) return '';
  const est = estadoDescuento(subtotal, escalones);
  const mensaje = !est.siguiente ? completar(t('descuentos.maximo'), { porcentaje: est.actual.porcentaje })
    : est.actual ? `${completar(t('descuentos.logrado'), { porcentaje: est.actual.porcentaje })}. ${completar(t('descuentos.falta'), { monto: dinero(est.falta), porcentaje: est.siguiente.porcentaje })}`
      : completar(t('descuentos.falta'), { monto: dinero(est.falta), porcentaje: est.siguiente.porcentaje });
  return `<div class="yu-progreso${compacta ? ' yu-progreso--compacta' : ''}${est.actual ? ' tiene-descuento' : ''}" data-nivel="${est.actual?.porcentaje ?? 0}">
    <div class="yu-progreso__texto">${compacta ? '' : `<span class="yu-progreso__icono">${ilustracion('regalo')}</span>`}<p>${esc(mensaje)}</p></div>
    <div class="yu-progreso__barra" role="progressbar" aria-label="Progreso hacia el próximo descuento" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(est.progreso * 100)}">
      <span class="yu-progreso__relleno" style="--p:${est.progreso}"></span>
      ${est.niveles.map((n) => `<span class="yu-progreso__hito${n.logrado ? ' is-logrado' : ''}" style="--x:${n.posicion}">${icono('check')}</span>`).join('')}
    </div>
    ${compacta ? '' : `<ul class="yu-progreso__niveles">${est.niveles.map((n) => `<li class="${n.logrado ? 'is-logrado' : ''}"><b>${n.porcentaje}% OFF</b> desde ${dinero(n.monto)}</li>`).join('')}</ul>
    <p class="yu-progreso__nota">${esc(t('descuentos.nota'))}</p>`}
  </div>`;
}

function pintarCarrito(c) {
  if (!c) return;
  const anterior = ctx.carrito;
  ctx.carrito = c;
  document.dispatchEvent(new CustomEvent('yu:carrito', { detail: c }));
  pintarBurbuja(c);
  $('#contador').textContent = c.itemCount;
  $('#contador').classList.toggle('is-vacio', !c.itemCount);
  $('#abrir-carrito').setAttribute('aria-label', `Abrir carrito, ${c.itemCount} producto${c.itemCount === 1 ? '' : 's'}`);
  $('#carrito-cantidad').textContent = c.itemCount ? `(${c.itemCount})` : '';
  if (anterior && c.itemCount > anterior.itemCount) { const b = $('#abrir-carrito'); b.classList.remove('is-salto'); void b.offsetWidth; b.classList.add('is-salto'); }

  // Foco: si se estaba tocando un botón de una línea, vuelve a ese mismo botón después de redibujar
  // (el botón queda deshabilitado mientras responde la tienda y pierde el foco: se recuerda cuál era)
  const foco = document.activeElement?.closest?.('#carrito-lineas [data-accion]') ?? botonTocado;
  botonTocado = null;
  const volverA = foco ? `[data-accion="${foco.dataset.accion}"][data-variante="${foco.dataset.variante}"]` : null;

  $('#carrito-lineas').innerHTML = c.lines.length ? `<ul class="yu-lineas">${c.lines.map((l) => `
    <li class="yu-linea" data-linea="${l.line}">
      <a class="yu-linea__foto" href="/producto/${esc(l.handle)}" data-link tabindex="-1">${l.image ? foto(l.image, l.title, { ancho: 320, sizes: '72px' }) : '<span class="yu-sin-foto"></span>'}</a>
      <div class="yu-linea__info">
        <a class="yu-linea__titulo" href="/producto/${esc(l.handle)}" data-link>${esc(l.title)}</a>
        ${l.variantTitle ? `<small>${esc(l.variantTitle)}</small>` : ''}
        <div class="yu-linea__acciones">
          <div class="yu-cant yu-cant--chica">
            <button type="button" data-accion="menos" data-variante="${esc(l.variantId)}" data-linea="${l.line}" data-cant="${l.quantity - 1}" aria-label="Quitar uno de ${esc(l.title)}">${icono('menos')}</button>
            <output aria-label="Cantidad">${l.quantity}</output>
            <button type="button" data-accion="mas" data-variante="${esc(l.variantId)}" data-linea="${l.line}" data-cant="${l.quantity + 1}" aria-label="Sumar uno de ${esc(l.title)}"${l.maxQuantity !== null && l.quantity >= l.maxQuantity ? ' disabled' : ''}>${icono('mas')}</button>
          </div>
          <button type="button" class="yu-linea__quitar" data-accion="quitar" data-variante="${esc(l.variantId)}" data-linea="${l.line}" data-cant="0" aria-label="Quitar ${esc(l.title)} del carrito">${icono('tacho')}</button>
        </div>
        <p class="yu-linea__error" role="alert"></p>
      </div>
      <strong class="yu-linea__total">${dinero(l.total, c.currency)}</strong>
    </li>`).join('')}</ul>`
    : `<div class="yu-carrito-vacio"><span class="yu-circulo" style="--yu-bg:#BFEDE5">${ilustracion('regalo')}</span><p>Tu carrito está vacío.</p><a class="yu-btn" href="/tienda" data-link>Ver la tienda</a></div>`;
  if (volverA) ($(volverA, $('#carrito-lineas')) ?? $('#carrito-lineas [data-accion]') ?? $('#cerrar-carrito'))?.focus({ preventScroll: true });

  // Descuentos por monto: dentro del carrito, arriba de la lista. Al pasar de escalón, un brillo breve y el aviso.
  const prog = $('#carrito-progreso');
  if (c.lines.length) {
    const nuevo = estadoDescuento(c.subtotal, ctx.escalones).actual?.porcentaje ?? 0;
    const relleno = $('.yu-progreso__relleno', prog);
    const desde = relleno ? relleno.style.getPropertyValue('--p') : '0';
    prog.innerHTML = progresoDescuentos(c.subtotal);
    // La barra crece (o baja) desde donde estaba: transición de ancho, sin saltos
    const r = $('.yu-progreso__relleno', prog);
    if (r && !reducido()) { const hasta = r.style.getPropertyValue('--p'); r.style.setProperty('--p', desde); requestAnimationFrame(() => requestAnimationFrame(() => r.style.setProperty('--p', hasta))); }
    if (nivelAnterior !== null && nuevo > nivelAnterior) $('.yu-progreso', prog)?.classList.add('is-desbloqueado');
    nivelAnterior = nuevo;
  } else { prog.innerHTML = ''; nivelAnterior = 0; }

  const pct = Number(String(ctx.t('pago.transferencia')).replace(',', '.')) || 0;
  $('#carrito-pie').innerHTML = c.lines.length ? `
    <div class="yu-carrito__fila"><span>Subtotal</span><strong>${dinero(c.subtotal ?? c.total, c.currency)}</strong></div>
    <p class="yu-carrito__nota">${pct ? `${pct}% OFF pagando con transferencia o efectivo. ` : ''}Envío y descuentos se calculan en el siguiente paso.</p>
    <a class="yu-btn yu-btn--grande" href="/checkout" data-link id="finalizar">${icono('candado')}Finalizar compra</a>
    <button type="button" class="yu-btn yu-btn--texto" id="seguir-comprando">Seguir comprando</button>` : '';
}
$('#carrito-pie').addEventListener('click', (e) => { if (e.target.closest('#seguir-comprando')) cerrarCarrito(); });

// Cambiar cantidades: el botón queda ocupado hasta que responde la tienda (los totales vienen del servidor)
$('#carrito-lineas').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-accion]');
  if (!b || b.disabled) return;
  e.stopPropagation();
  const li = b.closest('.yu-linea');
  botonTocado = b;
  li.classList.add('is-cambiando');
  $$('button', li).forEach((x) => { x.disabled = true; });
  try {
    await tienda.carrito.cambiar(Number(b.dataset.linea), Number(b.dataset.cant));
  } catch (err) {
    li.classList.remove('is-cambiando');
    $$('button', li).forEach((x) => { x.disabled = false; });
    $('.yu-linea__error', li).textContent = err.message;
  }
});

// ---------------------------------------------------------------- burbuja de descuentos (abajo a la izquierda)
// Aparece cuando ya hay algo en el carrito y el carrito está cerrado. El regalo lleva un anillo con el progreso y una
// etiqueta con el % logrado; al tocarlo sale una solapa de vidrio menta que se llena como líquido, con el mensaje y
// los escalones. Se cierra con la X, tocando el regalo o con Esc.
function crearBurbujaDescuentos() {
  document.body.insertAdjacentHTML('beforeend', `<div class="yu-dbur" id="dbur" hidden>
    <button type="button" class="yu-dbur__regalo" aria-expanded="false" aria-controls="dbur-solapa" aria-label="Ver tus descuentos por monto">
      <svg class="yu-dbur__anillo" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="25" class="yu-dbur__pista"/><circle cx="28" cy="28" r="25" class="yu-dbur__lleno" pathLength="1"/></svg>
      <span class="yu-dbur__ill" aria-hidden="true">${ilustracion('regalo')}</span>
      <span class="yu-dbur__tag" aria-hidden="true"></span>
    </button>
    <div class="yu-dbur__solapa" id="dbur-solapa" role="region" aria-label="Descuentos por monto">
      <span class="yu-dbur__liquido" aria-hidden="true"><span class="yu-dbur__fill"><i></i><i></i><i></i><i></i></span></span>
      <div class="yu-dbur__contenido"><p class="yu-dbur__msj" aria-live="polite"></p><ul class="yu-dbur__niveles"></ul></div>
      <button type="button" class="yu-icono-btn yu-dbur__cerrar" aria-label="Ocultar descuentos">${icono('cerrar')}</button>
    </div>
  </div>`);
  const caja = $('#dbur');
  const regalo = $('.yu-dbur__regalo', caja);
  const abrir = (si) => { caja.classList.toggle('is-abierta', si); regalo.setAttribute('aria-expanded', String(si)); };
  regalo.addEventListener('click', () => abrir(!caja.classList.contains('is-abierta')));
  $('.yu-dbur__cerrar', caja).addEventListener('click', () => { abrir(false); regalo.focus(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && caja.classList.contains('is-abierta')) { abrir(false); regalo.focus(); } });
}
let nivelBurbuja = null;
function pintarBurbuja(c) {
  const caja = $('#dbur');
  if (!caja || !c) return;
  const ver = c.itemCount > 0 && !document.documentElement.classList.contains('yu-carrito-abierto');
  caja.hidden = !ver;
  if (!c.itemCount) { caja.classList.remove('is-abierta'); nivelBurbuja = null; return; }
  const { t, escalones } = ctx;
  const est = estadoDescuento(c.subtotal, escalones);
  caja.style.setProperty('--p', est.progreso.toFixed(3));
  caja.classList.toggle('tiene-progreso', est.progreso > 0 && est.progreso < 1);
  $('.yu-dbur__tag', caja).textContent = est.actual ? `${est.actual.porcentaje}%` : '';
  $('.yu-dbur__msj', caja).textContent = !est.siguiente ? completar(t('descuentos.maximo'), { porcentaje: est.actual.porcentaje })
    : completar(t('descuentos.falta'), { monto: dinero(est.falta), porcentaje: est.siguiente.porcentaje });
  $('.yu-dbur__niveles', caja).innerHTML = est.niveles.map((n) => `<li class="${n.logrado ? 'is-logrado' : ''}">${n.logrado ? icono('check') : ''}<b>${n.porcentaje}%</b> desde ${dinero(n.monto)}</li>`).join('');
  const nivel = est.actual?.porcentaje ?? 0;
  if (nivelBurbuja !== null && nivel > nivelBurbuja) { caja.classList.remove('is-premio'); void caja.offsetWidth; caja.classList.add('is-premio'); }
  nivelBurbuja = nivel;
}

// ---------------------------------------------------------------- agregar desde las tarjetas + aviso de "agregado"
document.addEventListener('click', async (e) => {
  const paso = e.target.closest('.yu-cant [data-paso]');
  if (paso) {
    const input = paso.parentElement.querySelector('input');
    const max = Number(input.max) || 99;
    input.value = Math.min(max, Math.max(1, (Number(input.value) || 1) + Number(paso.dataset.paso)));
    return;
  }
  const b = e.target.closest('[data-agregar]');
  if (!b) return;
  const caja = b.closest('[data-comprar]');
  const cant = Number(caja.querySelector('input')?.value) || 1;
  let variante = caja.dataset.comprar;
  b.disabled = true;
  b.classList.add('is-cargando');
  try {
    if (!variante) variante = (await tienda.productos.uno(caja.dataset.handle)).variants.find((v) => v.available)?.id;
    const c = await tienda.carrito.agregar(variante, cant);
    b.classList.remove('is-cargando');
    b.classList.add('is-agregado');
    b.querySelector('span').textContent = 'Agregado';
    const linea = c.lines.find((l) => l.variantId === variante);
    avisoAgregado(linea, c);
    setTimeout(() => { b.classList.remove('is-agregado'); b.querySelector('span').textContent = 'Agregar'; b.disabled = false; }, 1800);
  } catch (err) {
    b.classList.remove('is-cargando');
    b.disabled = false;
    avisoAgregado(null, null, err.message);
  }
});
document.addEventListener('change', (e) => {
  const input = e.target.closest('.yu-cant input');
  if (input) input.value = Math.min(Number(input.max) || 99, Math.max(1, Math.round(Number(input.value) || 1)));
});

let avisoTimer = 0;
/** Confirmación al agregar (el carrito no se abre solo, como pidió Nico): producto, progreso de descuentos y "Ver carrito". */
export function avisoAgregado(linea, c, error) {
  const el = $('#aviso-agregado');
  clearTimeout(avisoTimer);
  el.innerHTML = error ? `<div class="yu-aviso-flotante__caja is-error"><p>${esc(error)}</p><button type="button" class="yu-icono-btn" data-cerrar aria-label="Cerrar">${icono('cerrar')}</button></div>` : `
    <div class="yu-aviso-flotante__caja">
      <div class="yu-aviso-flotante__cab">
        ${linea?.image ? foto(linea.image, linea.title, { ancho: 320, sizes: '48px' }) : `<span class="yu-aviso-flotante__check">${icono('check')}</span>`}
        <p><strong>Agregado al carrito</strong>${linea ? `<small>${esc(linea.title)}${linea.variantTitle ? ` · ${esc(linea.variantTitle)}` : ''}</small>` : ''}</p>
        <button type="button" class="yu-icono-btn" data-cerrar aria-label="Cerrar">${icono('cerrar')}</button>
      </div>
      ${c ? progresoDescuentos(c.subtotal, { compacta: true }) : ''}
      <div class="yu-aviso-flotante__botones"><button type="button" class="yu-btn yu-btn--chico" data-ver-carrito>Ver carrito (${c?.itemCount ?? ''})</button></div>
    </div>`;
  el.classList.add('is-visible');
  const cerrar = () => el.classList.remove('is-visible');
  el.querySelector('[data-cerrar]').onclick = cerrar;
  const ver = el.querySelector('[data-ver-carrito]');
  if (ver) ver.onclick = () => { cerrar(); abrirCarrito(); };
  const programar = () => { clearTimeout(avisoTimer); avisoTimer = setTimeout(cerrar, 5000); };
  el.onmouseenter = () => clearTimeout(avisoTimer);
  el.onmouseleave = programar;
  el.onfocusin = () => clearTimeout(avisoTimer);
  programar();
}

// ---------------------------------------------------------------- contacto: el formulario del pie (no hay página aparte)
function irAlFormulario() {
  const form = $('#pie-form');
  if (!form) return;
  form.scrollIntoView({ behavior: reducido() ? 'auto' : 'smooth', block: 'center' });
  form.classList.remove('is-resaltado'); void form.offsetWidth; form.classList.add('is-resaltado');
  setTimeout(() => form.querySelector('input')?.focus({ preventScroll: true }), 500);
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || sinBase(a.getAttribute('href')).split(/[?#]/)[0] !== '/contacto') return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if (document.documentElement.classList.contains('ns-menu-open')) $('.ns-menu-btn')?.click();
  cerrarCarrito();
  irAlFormulario();
}, true);

// ---------------------------------------------------------------- pie
function pintarPie() {
  const { info, t } = ctx;
  const c = info.contact ?? {};
  const wa = waLink();
  const footer = info.menus.footer;
  const columnas = footer.length ? footer : [{ label: 'Tienda', kind: 'catalog', children: [{ label: 'Todos los productos', kind: 'catalog' }, { label: 'Favoritos', kind: 'url', url: '/favoritos' }] }];
  const redes = [['instagram', 'ig', 'Instagram'], ['facebook', 'fb', 'Facebook']].filter(([k]) => c[k]);
  const medios = t('pie.mediosPago').split(',').map((x) => x.trim()).filter(Boolean);
  const nota = t('pie.nota');
  $('#pie').innerHTML = `<div class="yu-pie__caja">
    <div class="yu-pie__arriba">
      <div class="yu-pie__marca">
        <a class="yu-logo yu-logo--pie" href="/" data-link aria-label="${esc(info.name)}, ir al inicio">${info.logo ? `<img src="${esc(info.logo)}" alt="${esc(info.name)}" height="48">` : 'yuani'}</a>
        <p>${esc(t('pie.frase'))}</p>
        <a class="yu-pie__calc" href="/calculadora" data-link>${ilustracion('yeso')}<span><strong>Calculadora de materiales</strong><small>¿Cuánto yeso, cera o resina necesito?</small></span></a>
        ${redes.length || wa ? `<div class="yu-pie__redes">${redes.map(([k, i, n]) => `<a href="${esc(c[k])}" target="_blank" rel="noopener" aria-label="${n}">${icono(i)}</a>`).join('')}${wa ? `<a href="${esc(wa)}" target="_blank" rel="noopener" aria-label="WhatsApp">${icono('wa')}</a>` : ''}</div>` : ''}
        <span class="yu-pie__deco" aria-hidden="true">${[['vela', '#FFF4D6'], ['jabon', '#E3DBFF'], ['resina', '#D6EEFF']].map(([n, bg], k) => `<span class="yu-pie__burbuja" style="--b:${bg};--k:${k}">${ilustracion(n)}</span>`).join('')}</span>
      </div>
      ${columnas.map((l) => { const href = hrefDe(l); return l.children?.length
        ? `<nav class="yu-pie__col" aria-label="${esc(l.label)}"><h2>${esc(l.label)}</h2><ul>${l.children.map((x) => { const h = hrefDe(x); return `<li><a href="${esc(h)}"${atributosLink(h)}>${esc(x.label)}</a></li>`; }).join('')}</ul></nav>`
        : `<div class="yu-pie__col"><h2><a href="${esc(href)}"${atributosLink(href)}>${esc(l.label)}</a></h2></div>`; }).join('')}
      ${c.email || c.location || c.phone || wa ? `<div class="yu-pie__col yu-pie__contacto"><h2>Contacto</h2><ul>
        ${c.location ? `<li><span class="yu-pie__icono">${icono('local')}</span><span>${esc(c.location)}</span></li>` : ''}
        ${c.email ? `<li><span class="yu-pie__icono">${icono('mail')}</span><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>` : ''}
        ${c.phone ? `<li><span class="yu-pie__icono">${icono('tel')}</span><a href="tel:${esc(c.phone.replace(/s/g, ''))}">${esc(c.phone)}</a></li>` : ''}
        ${wa ? `<li><span class="yu-pie__icono">${icono('wa')}</span><a href="${esc(wa)}" target="_blank" rel="noopener">${esc(c.whatsapp)}</a></li>` : ''}
        ${c.hours ? `<li><span class="yu-pie__icono">${icono('chat')}</span><span>${esc(c.hours)}</span></li>` : ''}</ul></div>` : ''}
    </div>
    <form class="yu-pie__form" id="pie-form" novalidate>
      <div class="yu-pie__form-intro"><h2>${esc(t('pie.formTitulo'))}</h2><p>${esc(t('pie.formTexto'))}</p></div>
      <div class="yu-pie__campos">
        <label><span class="yu-oculto">Nombre</span><input name="name" placeholder="Nombre" autocomplete="name"></label>
        <label><span class="yu-oculto">Email</span><input name="email" type="email" placeholder="Email" required autocomplete="email"></label>
        <label><span class="yu-oculto">WhatsApp</span><input name="whatsapp" type="tel" placeholder="WhatsApp" autocomplete="tel"></label>
        <label class="yu-pie__ancho"><span class="yu-oculto">Tu consulta</span><input name="message" placeholder="Tu consulta" required></label>
        <button class="yu-btn">Enviar</button>
      </div>
      <p class="yu-form-estado" role="status"></p>
    </form>
    <div class="yu-pie__abajo">
      <p>© ${new Date().getFullYear()} ${esc(info.name)}${nota ? ` · ${esc(nota)}` : ''}</p>
      ${info.legal.length ? `<nav aria-label="Legales">${info.legal.map((l) => `<a href="/legal/${l.kind}" data-link>${esc(l.title)}</a>`).join('')}</nav>` : ''}
      ${medios.length ? `<ul class="yu-pie__pagos" aria-label="Medios de pago">${medios.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}
      <a class="ns-credito" href="https://strattastudio.com" target="_blank" rel="noopener"><span class="ns-credito__punto" aria-hidden="true"></span>Tienda creada por <b>Stratta Studio</b></a>
    </div>
  </div>`;
  enviarFormulario($('#pie-form'));
}

/** Formulario de consulta → Mensajes del panel. */
export function enviarFormulario(form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const estado = form.querySelector('[role=status]');
    const d = Object.fromEntries(new FormData(form));
    form.querySelectorAll('[aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid'));
    if (!/^\S+@\S+\.\S+$/.test(d.email || '')) { form.email.setAttribute('aria-invalid', 'true'); form.email.focus(); estado.textContent = 'Escribí un email válido para poder responderte.'; return; }
    if (!d.message?.trim()) { form.message.setAttribute('aria-invalid', 'true'); form.message.focus(); estado.textContent = 'Contanos tu consulta.'; return; }
    const b = form.querySelector('button');
    b.disabled = true;
    try {
      await tienda.contacto(d);
      estado.textContent = '¡Gracias! Te respondemos a la brevedad.';
      form.reset();
    } catch (err) { estado.textContent = err.message; }
    b.disabled = false;
  });
}

// ---------------------------------------------------------------- cookies y medición
function pintarCookies() {
  const ck = ctx.info.cookies;
  const eleccion = (() => { try { return localStorage.getItem('cookies'); } catch { return null; } })();
  if (!ck || ck.mode === 'notice' || eleccion === 'todas') cargarMedicion();
  if (!ck || eleccion) return;
  const el = $('#cookies');
  const privacidad = ctx.info.legal.find((l) => l.kind === 'privacy');
  el.innerHTML = `<p>${esc(ck.text || 'Usamos cookies para que la tienda funcione y, si aceptás, para medir las visitas.')}
    ${privacidad ? ` <a href="/legal/privacy" data-link>${esc(privacidad.title)}</a>` : ''}</p>
    <div>${ck.mode === 'consent' ? `<button class="yu-btn yu-btn--chico yu-btn--borde" data-cookies="necesarias">${esc(ck.rejectText || 'Solo necesarias')}</button>` : ''}
    <button class="yu-btn yu-btn--chico" data-cookies="todas">${esc(ck.acceptText || (ck.mode === 'consent' ? 'Aceptar' : 'Entendido'))}</button></div>`;
  el.hidden = false;
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cookies]');
    if (!b) return;
    try { localStorage.setItem('cookies', b.dataset.cookies); } catch { /* sin almacenamiento */ }
    el.hidden = true;
    if (b.dataset.cookies === 'todas' && ck.mode === 'consent') cargarMedicion();
  });
}
function cargarMedicion() {
  const { ga4, metaPixel } = ctx.info.analytics ?? {};
  if (ga4 && /^G-[A-Z0-9]+$/.test(ga4)) {
    const s = document.createElement('script');
    s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${ga4}`;
    document.head.append(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', ga4);
  }
  if (metaPixel && /^\d+$/.test(metaPixel)) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', metaPixel); window.fbq('track', 'PageView');
  }
}

arrancar().catch((err) => {
  console.error(err);
  app.innerHTML = '<section class="yu-pagina yu-vacio"><h1>No pudimos abrir la tienda</h1><p>Revisá tu conexión y probá de nuevo.</p><p><button class="yu-btn" onclick="location.reload()">Reintentar</button></p></section>';
});
