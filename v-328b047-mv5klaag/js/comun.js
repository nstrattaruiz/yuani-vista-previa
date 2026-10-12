// Estado y piezas compartidas por todas las páginas.
import { leerEscalones } from './descuentos.js';
import { ilustracion, ilustracionDe } from './ilustraciones.js';

// En la plataforma, el SDK real. Solo en la vista previa de GitHub Pages (*.github.io), que no tiene plataforma,
// la tienda de ejemplo (js/demo, la copia el workflow): nunca se muestran datos de ejemplo en la tienda real.
export const tienda = /\.github\.io$/.test(location.hostname)
  ? (await import('./demo/sdk-demo.js')).tienda
  : (await import('/api/v1/sdk.js')).tienda;

// Carpeta donde vive la web: "" en la plataforma (dominio propio), "/<repo>" en GitHub Pages (meta yu-base del index).
// Las rutas internas se escriben siempre como en la plataforma ("/producto/x") y se ajustan con enlace().
export const BASE = (document.querySelector('meta[name="yu-base"]')?.content ?? '/').replace(/\/$/, '');
export const enlace = (ruta) => (BASE && ruta.startsWith('/') && !ruta.startsWith('//') && !ruta.startsWith(BASE + '/') ? BASE + ruta : ruta);
export const sinBase = (ruta) => (BASE && ruta.startsWith(BASE + '/') ? ruta.slice(BASE.length) : BASE && ruta === BASE ? '/' : ruta);
/** La ruta actual de la web, sin la carpeta: "/producto/x?y=1". */
export const rutaActual = () => sinBase(location.pathname) + location.search;
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const icono = (id, clase = '') => `<svg class="${clase}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
export const reducido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Lo que se carga al arrancar: datos de la tienda, textos del panel y el cliente (si hay cuentas). */
export const ctx = { info: null, t: () => '', cliente: null, carrito: null, escalones: [] };
export function prepararEscalones() { ctx.escalones = leerEscalones(ctx.t('descuentos.escalones')); }

export const dinero = (centesimos, moneda) => tienda.formatear(centesimos, moneda ?? ctx.info?.currency ?? 'UYU');

/** Texto con marcas simples del panel (*cursiva*, **negrita**, párrafos, listas con "- ") → HTML escapado. */
export function marcas(texto) {
  const linea = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
  return String(texto ?? '').split(/\n\s*\n/).map((bloque) => {
    const filas = bloque.split('\n');
    return filas.every((f) => /^\s*-\s/.test(f))
      ? `<ul>${filas.map((f) => `<li>${linea(f.replace(/^\s*-\s/, ''))}</li>`).join('')}</ul>`
      : `<p>${filas.map(linea).join('<br>')}</p>`;
  }).join('');
}

/** Foto con srcset (las imágenes de la plataforma traen varios anchos). */
export function foto(img, alt, { ancho = 640, sizes = '(max-width: 749px) 50vw, 25vw', carga = 'lazy', clase = '' } = {}) {
  if (!img) return `<span class="yu-sin-foto ${clase}" aria-hidden="true"></span>`;
  const set = img.sizes ? Object.entries(img.sizes).map(([w, u]) => `${esc(u)} ${w}w`).join(', ') : '';
  return `<img class="${clase}" src="${esc(img.sizes?.[String(ancho)] ?? img.url)}"${set ? ` srcset="${set}" sizes="${sizes}"` : ''} alt="${esc(img.alt || alt)}"${img.width ? ` width="${img.width}" height="${img.height}"` : ''} loading="${carga}" decoding="async"${carga === 'eager' ? ' fetchpriority="high"' : ''}>`;
}

// ---------------------------------------------------------------- precios
/** % de descuento por transferencia que se informa en tarjetas y ficha (0 = no se muestra). */
export const porcTransferencia = () => {
  const n = Number(String(ctx.t('pago.transferencia')).replace(',', '.'));
  return n > 0 && n < 100 ? n : 0;
};
export const ahorro = (p) => (p.compareAtPrice > p.price ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0);

/**
 * Bloque de precio. Como en la tienda original: el precio con transferencia es el grande (solo informa: el descuento
 * real lo aplica la regla de checkout de la plataforma) y el normal va chico debajo.
 */
export function precio(p, { grande = false } = {}) {
  if (p.priceHidden || p.price === null) return '<span class="yu-precio yu-precio--oculto">Ingresá para ver el precio</span>';
  const antes = p.wholesale && p.retailPrice > p.price ? p.retailPrice : p.compareAtPrice > p.price ? p.compareAtPrice : 0;
  const desde = p.priceMin && p.priceMax && p.priceMin !== p.priceMax && !grande ? 'Desde ' : '';
  const pct = p.wholesale ? 0 : porcTransferencia();
  const tachado = antes ? `<s aria-label="Antes ${dinero(antes, p.currency)}">${dinero(antes, p.currency)}</s>` : '';
  if (!pct) {
    return `<span class="yu-precio${grande ? ' yu-precio--grande' : ''}"><span class="yu-precio__fila"><b>${desde}${dinero(p.price, p.currency)}</b>${tachado}</span>${p.wholesale ? '<small class="yu-precio__otro">Precio mayorista</small>' : ''}</span>`;
  }
  const conTransf = Math.round(p.price * (1 - pct / 100));
  return `<span class="yu-precio${grande ? ' yu-precio--grande' : ''}">
    <span class="yu-precio__fila"><b>${desde}${dinero(conTransf, p.currency)}</b><span class="yu-precio__tag">${esc(ctx.t('pago.transferenciaTexto'))}</span></span>
    <small class="yu-precio__otro">${dinero(p.price, p.currency)} ${esc(ctx.t('pago.otrosTexto'))}${tachado ? ` · ${tachado}` : ''}</small>
  </span>`;
}

// ---------------------------------------------------------------- favoritos (en este navegador)
const CLAVE_FAV = 'yu:favoritos';
export const favoritos = {
  lista() { try { return JSON.parse(localStorage.getItem(CLAVE_FAV)) ?? []; } catch { return []; } },
  tiene(h) { return this.lista().includes(h); },
  cambiar(h) {
    const l = this.lista();
    const nueva = l.includes(h) ? l.filter((x) => x !== h) : [h, ...l].slice(0, 100);
    try { localStorage.setItem(CLAVE_FAV, JSON.stringify(nueva)); } catch { /* sin almacenamiento */ }
    document.dispatchEvent(new CustomEvent('yu:favoritos'));
    return nueva.includes(h);
  },
};
export const botonFavorito = (p, clase = '') => `<button type="button" class="yu-fav ${clase}" data-fav="${esc(p.handle)}" aria-pressed="${favoritos.tiene(p.handle)}" aria-label="Guardar ${esc(p.title)} en favoritos">${icono('corazon')}</button>`;

// Fondo pastel de la foto (para las fotos con fondo transparente): sale del nombre del producto, así es el mismo en
// la tarjeta y en la ficha.
const FONDOS = [['#fff8ee', '#f6ecdc'], ['#f4f0ff', '#ece5ff'], ['#eef8ff', '#e1f0ff'], ['#ecfaf6', '#dcf4ee'], ['#fff3ec', '#ffe8dc']];
export function fondoFoto(handle) {
  let h = 0;
  for (const ch of String(handle)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [a, b] = FONDOS[h % FONDOS.length];
  return `--yu-foto-a:${a};--yu-foto-b:${b}`;
}

// ---------------------------------------------------------------- tarjeta de producto (una sola para toda la web)
export function tarjeta(p, { carga = 'lazy' } = {}) {
  const pct = ahorro(p);
  const unaVariante = p.variants?.length === 1 ? p.variants[0] : null;
  const variantes = p.variantCount ?? p.variants?.length ?? 1;
  const max = unaVariante?.stock ?? 99;
  const etiqueta = !p.available ? '<span class="yu-etiqueta yu-etiqueta--agotado">Sin stock</span>'
    : pct ? `<span class="yu-etiqueta yu-etiqueta--oferta">-${pct}%</span>` : '';
  const comprar = !p.available || p.priceHidden ? ''
    : unaVariante || variantes === 1
      ? `<div class="yu-card__comprar" data-comprar="${esc(unaVariante?.id ?? '')}" data-handle="${esc(p.handle)}">
          <div class="yu-cant yu-cant--chica" data-max="${max}">
            <button type="button" data-paso="-1" aria-label="Uno menos">${icono('menos')}</button>
            <input type="number" inputmode="numeric" min="1" max="${max}" value="1" aria-label="Cantidad de ${esc(p.title)}">
            <button type="button" data-paso="1" aria-label="Uno más">${icono('mas')}</button>
          </div>
          <button type="button" class="yu-btn yu-btn--chico yu-card__agregar" data-agregar aria-label="Agregar ${esc(p.title)} al carrito">${icono('bolsa')}<span>Agregar</span></button>
        </div>`
      : `<a class="yu-btn yu-btn--chico yu-btn--borde yu-card__elegir" href="/producto/${esc(p.handle)}" data-link>Elegir opción</a>`;
  return `<article class="yu-card" style="${fondoFoto(p.handle)}">
    <a class="yu-card__foto" href="/producto/${esc(p.handle)}" data-link tabindex="-1" aria-hidden="true">${foto(p.image, p.title, { carga })}${etiqueta}</a>
    ${botonFavorito(p, 'yu-card__fav')}
    <div class="yu-card__info">
      <h3 class="yu-card__titulo"><a href="/producto/${esc(p.handle)}" data-link>${esc(p.title)}</a></h3>
      ${precio(p)}
    </div>
    ${comprar}
  </article>`;
}

/**
 * Relleno para que una sección de productos nunca quede vacía en la primera pantalla: si hay menos productos que
 * lugares, se completa con tarjetas de categorías (del mismo tamaño que una tarjeta de producto) y, si tampoco hay
 * categorías, con una tarjeta para escribirnos.
 */
export function rellenoProductos(hay, lugares, categorias = []) {
  const faltan = Math.max(0, lugares - hay);
  if (!faltan) return '';
  const pasteles = ['#FFEDB3', '#E3DBFF', '#D6EEFF', '#BFEDE5', '#FFE1D3'];
  const lista = categorias.length ? categorias : [null];
  return Array.from({ length: faltan }, (_, i) => {
    const cat = lista[i % lista.length];
    const bg = pasteles[(hay + i) % pasteles.length];
    return cat
      ? `<a class="yu-card yu-card--relleno" href="/categoria/${esc(cat.handle)}" data-link style="--yu-bg:${bg}">
          <span class="yu-card__foto">${ilustracion(ilustracionDe(cat.name), 'yu-card__ill')}</span>
          <span class="yu-card__info"><span class="yu-card__titulo">Explorá ${esc(cat.name)}</span><span class="yu-link-flecha">Ver la categoría${icono('der')}</span></span>
        </a>`
      : `<a class="yu-card yu-card--relleno" href="/contacto" data-link style="--yu-bg:${bg}">
          <span class="yu-card__foto">${ilustracion(['vela', 'jabon', 'resina', 'yeso', 'bombon', 'reposteria', 'regalo', 'nuevo'][(hay + i) % 8], 'yu-card__ill')}</span>
          <span class="yu-card__info"><span class="yu-card__titulo">Muy pronto, más moldes</span><span class="yu-link-flecha">Escribinos${icono('der')}</span></span>
        </a>`;
  }).join('');
}

/** Tarjetas fantasma mientras carga (mismo alto que las reales: no hay saltos). */
export const tarjetasCargando = (n = 8) => Array.from({ length: n }, () => `<div class="yu-card yu-card--cargando" aria-hidden="true"><span class="yu-card__foto"></span><span class="yu-linea-fantasma"></span><span class="yu-linea-fantasma yu-linea-fantasma--corta"></span></div>`).join('');

/** Encabezado de sección: etiqueta, título y, a la derecha, "Ver todos" y las flechas del carrusel (como en Shopify). */
export const tituloSeccion = ({ etiqueta, titulo, link, linkTexto = 'Ver todos', id, flechas = false }) => `
  <div class="yu-seccion__cab">
    <div>${etiqueta ? `<p class="yu-etiqueta-seccion">${esc(etiqueta)}</p>` : ''}<h2${id ? ` id="${id}"` : ''}>${esc(titulo)}</h2></div>
    <div class="yu-seccion__acciones">
      ${link ? `<a class="yu-link-flecha" href="${esc(link)}" data-link>${esc(linkTexto)}${icono('der')}</a>` : ''}
      ${flechas ? `<button type="button" class="yu-carrusel__flecha yu-carrusel__flecha--cab" data-dir="-1" aria-label="Anteriores">${icono('izq')}</button><button type="button" class="yu-carrusel__flecha yu-carrusel__flecha--cab" data-dir="1" aria-label="Siguientes">${icono('der')}</button>` : ''}
    </div>
  </div>`;

/** Ir a una ruta de la web sin recargar. */
export function ir(ruta) {
  history.pushState(null, '', enlace(ruta));
  window.dispatchEvent(new Event('yu:ruta'));
}

export function waLink(texto) {
  const c = ctx.info?.contact ?? {};
  const wa = (c.whatsapp || '').replace(/\D/g, '').replace(/^0/, '598');
  if (!wa) return null;
  const msj = texto ?? c.whatsappMessage;
  return `https://wa.me/${wa}${msj ? `?text=${encodeURIComponent(msj)}` : ''}`;
}

/** Ruta de un enlace de menú del panel. */
export const hrefDe = (l) => ({ category: `/categoria/${l.handle}`, product: `/producto/${l.handle}`, catalog: '/tienda', home: '/' })[l.kind] ?? l.url ?? '/';
export const esExterno = (u) => /^https?:/i.test(u);
export const atributosLink = (href) => (esExterno(href) ? ' target="_blank" rel="noopener"' : ' data-link');

export function meta(nombre, valor, attr = 'name') {
  let m = document.head.querySelector(`meta[${attr}="${nombre}"]`);
  if (!m) { m = document.createElement('meta'); m.setAttribute(attr, nombre); document.head.append(m); }
  m.content = valor ?? '';
}
export function tituloPagina(titulo, descripcion) {
  document.title = titulo ? `${titulo} · ${ctx.info.name}` : ctx.info.seo.title;
  meta('description', descripcion || ctx.info.seo.description || '');
  // Cada página vuelve a lo que dice el panel (el checkout y el pedido se marcan aparte como no indexables)
  meta('robots', ctx.info.seo.noindex ? 'noindex, nofollow' : 'index, follow');
  meta('og:title', document.title, 'property');
  if (descripcion) meta('og:description', descripcion, 'property');
}
