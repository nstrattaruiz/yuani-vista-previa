// Portada: categorías en círculos → banner → destacados → franja de pago → nuevos ingresos → explorar por categoría.
import { tienda, $, $$, esc, icono, ctx, tarjeta, tarjetasCargando, tituloSeccion, tituloPagina, reducido, atributosLink, rellenoProductos } from '../comun.js';
import { ilustracion, ilustracionDe, PASTELES } from '../ilustraciones.js';
import { pintarCalculadora } from '../calculadora-ui.js';

export async function inicio(app) {
  const { t } = ctx;
  tituloPagina();
  app.innerHTML = `
    <section class="yu-cats" aria-labelledby="cats-titulo">
      <h2 id="cats-titulo" class="${t('categorias.titulo') ? 'yu-cats__titulo' : 'yu-oculto'}">${esc(t('categorias.titulo') || 'Categorías')}</h2>
      <div class="yu-carrusel yu-carrusel--desvanece" data-carrusel>
        <button type="button" class="yu-carrusel__flecha yu-carrusel__flecha--izq" data-dir="-1" aria-label="Categorías anteriores">${icono('izq')}</button>
        <ul class="yu-carrusel__pista yu-cats__lista" id="cats">${Array.from({ length: 8 }, () => '<li class="yu-cats__item is-cargando"><span class="yu-circulo"></span><span class="yu-linea-fantasma"></span></li>').join('')}</ul>
        <button type="button" class="yu-carrusel__flecha yu-carrusel__flecha--der" data-dir="1" aria-label="Más categorías">${icono('der')}</button>
      </div>
    </section>
    ${banner()}
    <section class="yu-seccion yu-carrusel" data-carrusel aria-labelledby="dest-titulo">
      ${tituloSeccion({ etiqueta: t('destacados.etiqueta'), titulo: t('destacados.titulo'), link: '/tienda', id: 'dest-titulo', flechas: true })}
      <div class="yu-carrusel__pista yu-fila-cards" id="destacados">${tarjetasCargando(4)}</div>
    </section>
    ${franjaPago()}
    <section class="yu-seccion" aria-labelledby="nuevos-titulo" id="nuevos-seccion">
      ${tituloSeccion({ etiqueta: t('nuevos.etiqueta'), titulo: t('nuevos.titulo'), link: '/tienda?orden=newest', id: 'nuevos-titulo' })}
      <div class="yu-grilla yu-grilla--4" id="nuevos">${tarjetasCargando(8)}</div>
    </section>
    <section class="yu-seccion yu-calc-seccion" aria-labelledby="calc-titulo" id="calculadora">
      <div class="yu-calc-seccion__intro">
        <p class="yu-etiqueta-seccion">${esc(t('calc.etiqueta'))}</p>
        <h2 id="calc-titulo">${esc(t('calc.titulo'))}</h2>
        <p>${esc(t('calc.texto'))}</p>
        <span class="yu-calc-seccion__ill" aria-hidden="true">${['yeso', 'vela', 'resina'].map((n) => `<span>${ilustracion(n)}</span>`).join('')}</span>
      </div>
      <div id="calc-inicio"></div>
    </section>
    <section class="yu-seccion yu-seccion--ultima" aria-labelledby="explorar-titulo" id="explorar-seccion">
      ${tituloSeccion({ etiqueta: t('explorar.etiqueta'), titulo: t('explorar.titulo'), link: '/tienda', linkTexto: 'Ver toda la tienda', id: 'explorar-titulo' })}
      <div class="yu-explorar" id="explorar"></div>
    </section>`;
  iniciarBanner($('.yu-hero', app));
  pintarCalculadora($('#calc-inicio'), { compacta: true });

  const [cats, nuevos] = await Promise.all([
    tienda.categorias().catch(() => []),
    tienda.productos.listar({ orden: 'newest', porPagina: 24 }).catch(() => ({ items: [] })),
  ]);
  const visibles = cats.filter((c) => c.productCount && !c.parent);

  // Categorías: siempre ilustración animada (no la foto de la colección), como en la tienda original
  $('#cats').innerHTML = visibles.map((c, i) => `<li class="yu-cats__item"><a class="yu-cats__link" href="/categoria/${esc(c.handle)}" data-link>
    <span class="yu-circulo" style="--yu-bg:${PASTELES[i % PASTELES.length]}">${ilustracion(ilustracionDe(c.name))}</span><span>${esc(c.name)}</span></a></li>`).join('');
  if (!visibles.length) $('.yu-cats', app).hidden = true;

  // Destacados: los de la etiqueta del panel primero; si son menos de 6, se completa con los últimos cargados
  const etiqueta = t('destacados.etiquetaProducto');
  const marcados = etiqueta ? (await tienda.productos.listar({ etiqueta, porPagina: 12 }).catch(() => ({ items: [] }))).items : [];
  const vistos = new Set(marcados.map((p) => p.handle));
  const destacados = [...marcados, ...nuevos.items.filter((p) => !vistos.has(p.handle))].slice(0, Math.max(8, marcados.length));
  $('#destacados').innerHTML = destacados.map((p) => tarjeta(p)).join('') + rellenoProductos(destacados.length, 4, visibles);

  const usados = new Set(destacados.slice(0, 4).map((p) => p.handle));
  const recien = nuevos.items.filter((p) => !usados.has(p.handle));
  const lista = (recien.length >= 8 ? recien : nuevos.items).slice(0, 8);
  $('#nuevos').innerHTML = lista.map((p) => tarjeta(p)).join('') + rellenoProductos(lista.length, 8, visibles);

  // Explorar: como en la tienda original, una tarjeta grande y seis chicas. Si hay más de 7 categorías, cada día se
  // muestran otras 7 (sin "Nuevos ingresos" ni "Ofertas", que ya tienen su lugar); la de más productos va en grande.
  const uso = visibles.filter((c) => !/nuev|ofert/i.test(`${c.handle} ${c.name}`));
  const delDia = categoriasDelDia(uso, 7);
  $('#explorar').innerHTML = delDia.map((c, i) => `<a class="yu-explorar__tarjeta${i === 0 ? ' is-grande' : ''}" href="/categoria/${esc(c.handle)}" data-link style="--yu-bg:${PASTELES[(uso.indexOf(c) + 3) % PASTELES.length]}; --i:${i}">
      <span class="yu-explorar__texto"><strong>${esc(c.name)}</strong><small>${c.productCount} producto${c.productCount === 1 ? '' : 's'}</small></span>
      <span class="yu-explorar__ver" aria-hidden="true">${icono('der')}</span>
      <span class="yu-explorar__circulo">${ilustracion(ilustracionDe(c.name), 'yu-explorar__ill')}</span></a>`).join('');
  // Columnas: la grande + las chicas de a dos por columna; si las chicas son impares, la última ocupa toda la altura
  $('#explorar').style.setProperty('--cols', 1 + Math.ceil((delDia.length - 1) / 2));
  if (delDia.length > 1 && (delDia.length - 1) % 2) $('#explorar').lastElementChild.classList.add('is-alta');
  if (!delDia.length) $('#explorar-seccion').hidden = true;

  $$('[data-carrusel]', app).forEach((el) => iniciarCarrusel(el, { solo: el.querySelector('#cats') ? 3 : 0 }));
}

// ---------------------------------------------------------------- explorar: categorías del día
// Corre una ventana de `cuantas` categorías por la lista, un lugar por día (todos ven las mismas el mismo día).
// La de más productos queda primera (tarjeta grande).
export function categoriasDelDia(lista, cuantas, fecha = new Date()) {
  if (lista.length <= cuantas) return [...lista].sort((a, b) => b.productCount - a.productCount);
  const dia = Math.floor((fecha.getTime() - fecha.getTimezoneOffset() * 60000) / 86400000);
  const desde = dia % lista.length;
  return [...lista, ...lista].slice(desde, desde + cuantas).sort((a, b) => b.productCount - a.productCount);
}

// ---------------------------------------------------------------- banner
// Corrección del original: el contenido y los controles forman un solo bloque centrado en vertical (mismo aire arriba
// y abajo); el alto lo da la diapositiva más alta (todas en la misma celda de la grilla), así no hay saltos al pasar.
function banner() {
  const slides = ctx.t('banner.slides').filter((s) => s.titulo);
  if (!slides.length) return '';
  const COLORES = ['#FFFFFF', '#FFEDB3', '#FFE1D3'];
  return `<section class="yu-hero" aria-roledescription="carrusel" aria-label="Novedades">
    <div class="yu-hero__slides">
      ${slides.map((s, i) => {
        const tema = ['menta', 'durazno', 'sol', 'lavanda', 'cielo', 'turquesa'].includes(s.tema?.trim()) ? s.tema.trim() : 'menta';
        const ills = (s.ilustraciones || 'brillo').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 3);
        const link = s.link || '/tienda';
        const h = i === 0 ? 'h1' : 'h2';
        return `<div class="yu-hero__slide yu-tema-${tema}${i === 0 ? ' is-activa' : ''}" role="group" aria-roledescription="diapositiva" aria-label="${i + 1} de ${slides.length}"${i ? ' aria-hidden="true" inert' : ''}>
          <span class="yu-hero__manchas" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="yu-hero__chispas" aria-hidden="true"><i></i><i></i><i></i></span>
          <div class="yu-hero__texto">
            ${s.etiqueta ? `<p class="yu-hero__etiqueta" style="--d:0">${esc(s.etiqueta)}</p>` : ''}
            <${h} class="yu-hero__titulo" style="--d:1">${esc(s.titulo)}</${h}>
            ${s.texto ? `<p class="yu-hero__bajada" style="--d:2">${esc(s.texto)}</p>` : ''}
            ${s.boton ? `<a class="yu-btn yu-btn--grande yu-hero__boton" style="--d:3" href="${esc(link)}"${atributosLink(link)}>${esc(s.boton)}${icono('der')}</a>` : ''}
          </div>
          <div class="yu-hero__arte" aria-hidden="true">
            ${s.imagen
              ? `<span class="yu-hero__foto"><img src="${esc(s.imagen)}" alt="" width="1200" height="1200" loading="${i ? 'lazy' : 'eager'}"></span>
                 <span class="yu-hero__burbuja yu-hero__burbuja--flota" style="--b:#fff">${ilustracion(ills[0])}</span>`
              : ills.map((n, k) => `<span class="yu-hero__burbuja yu-hero__burbuja--${k + 1}" style="--b:${COLORES[k]}">${ilustracion(n)}</span>`).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>
    ${slides.length > 1 ? `<div class="yu-hero__controles">
      <div class="yu-hero__puntos">${slides.map((s, i) => `<button type="button" class="yu-hero__punto" data-ir="${i}" aria-label="Ver diapositiva ${i + 1}: ${esc(s.titulo)}"${i === 0 ? ' aria-current="true"' : ''}><i></i></button>`).join('')}</div>
      <button type="button" class="yu-hero__pausa" aria-label="Pausar el banner"></button>
      <button type="button" class="yu-icono-btn yu-hero__flecha" data-paso="-1" aria-label="Diapositiva anterior">${icono('izq')}</button>
      <button type="button" class="yu-icono-btn yu-hero__flecha" data-paso="1" aria-label="Diapositiva siguiente">${icono('der')}</button>
    </div>` : ''}
  </section>`;
}

function iniciarBanner(hero) {
  if (!hero) return;
  const slides = $$('.yu-hero__slide', hero);
  if (slides.length < 2) return;
  const puntos = $$('.yu-hero__punto', hero);
  const segundos = Math.min(20, Math.max(3, Number(ctx.t('banner.segundos')) || 6));
  hero.style.setProperty('--yu-hero-ms', `${segundos * 1000}ms`);
  let actual = 0;
  let timer = 0;
  let pausadoPorUsuario = reducido();
  const pausas = new Set();

  const mostrar = (n) => {
    const sig = (n + slides.length) % slides.length;
    if (sig === actual) return;
    slides[actual].classList.remove('is-activa');
    slides[actual].setAttribute('aria-hidden', 'true');
    slides[actual].inert = true;
    slides[sig].classList.add('is-activa');
    slides[sig].removeAttribute('aria-hidden');
    slides[sig].inert = false;
    puntos.forEach((p, i) => (i === sig ? p.setAttribute('aria-current', 'true') : p.removeAttribute('aria-current')));
    actual = sig;
    programar();
  };
  const programar = () => {
    clearTimeout(timer);
    const corre = !pausadoPorUsuario && !pausas.size;
    hero.classList.toggle('is-pausado', !corre);
    // Reinicia la barrita de progreso del punto activo
    puntos.forEach((p) => p.classList.remove('is-corriendo'));
    if (!corre) return;
    void hero.offsetWidth;
    puntos[actual].classList.add('is-corriendo');
    timer = setTimeout(() => mostrar(actual + 1), segundos * 1000);
  };
  const pausar = (motivo, si) => { if (si) pausas.add(motivo); else pausas.delete(motivo); programar(); };

  puntos.forEach((p) => p.addEventListener('click', () => mostrar(Number(p.dataset.ir))));
  $$('.yu-hero__flecha', hero).forEach((b) => b.addEventListener('click', () => mostrar(actual + Number(b.dataset.paso))));
  const botonPausa = $('.yu-hero__pausa', hero);
  const pintarPausa = () => {
    botonPausa.setAttribute('aria-label', pausadoPorUsuario ? 'Reproducir el banner' : 'Pausar el banner');
    botonPausa.innerHTML = pausadoPorUsuario ? '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>'
      : '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 6v12M15 6v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  };
  botonPausa.addEventListener('click', () => { pausadoPorUsuario = !pausadoPorUsuario; pintarPausa(); programar(); });
  pintarPausa();
  hero.addEventListener('mouseenter', () => pausar('mouse', true));
  hero.addEventListener('mouseleave', () => pausar('mouse', false));
  hero.addEventListener('focusin', () => pausar('foco', true));
  hero.addEventListener('focusout', (e) => { if (!hero.contains(e.relatedTarget)) pausar('foco', false); });
  // Fuera de pantalla o con la pestaña oculta no avanza
  new IntersectionObserver(([e]) => pausar('fuera', !e.isIntersecting), { threshold: 0.3 }).observe(hero);
  document.addEventListener('visibilitychange', () => pausar('oculta', document.hidden));
  // Deslizar con el dedo
  let x0 = null;
  hero.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') x0 = e.clientX; });
  hero.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 45) mostrar(actual + (dx < 0 ? 1 : -1));
  });
  hero.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') mostrar(actual + 1);
    if (e.key === 'ArrowLeft') mostrar(actual - 1);
  });
  programar();
}

// ---------------------------------------------------------------- franja: 10% pagando con transferencia o efectivo
function franjaPago() {
  const { t } = ctx;
  if (!t('aviso.titulo')) return '';
  return `<section class="yu-franja" aria-labelledby="franja-titulo">
    <span class="yu-franja__manchas" aria-hidden="true"><i></i><i></i></span>
    <span class="yu-franja__monedas" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
    <div class="yu-franja__numero" aria-hidden="true"><b>${esc(t('aviso.numero'))}</b><span>${esc(t('aviso.sufijo'))}</span></div>
    <div class="yu-franja__texto">
      ${t('aviso.etiqueta') ? `<p class="yu-etiqueta-seccion">${esc(t('aviso.etiqueta'))}</p>` : ''}
      <h2 id="franja-titulo">${esc(t('aviso.titulo'))}</h2>
      ${t('aviso.texto') ? `<p>${esc(t('aviso.texto'))}</p>` : ''}
    </div>
    <span class="yu-franja__orbita" aria-hidden="true"><span class="yu-franja__anillo"></span><span class="yu-franja__ill">${ilustracion('pago')}</span></span>
  </section>`;
}

// ---------------------------------------------------------------- carrusel horizontal (categorías y destacados)
// Flechas, arrastre con el mouse, deslizar con el dedo y bordes que se desvanecen. Con { solo: segundos } avanza solo
// (como en la tienda original): se pausa con el mouse encima, con el foco, al tocarlo, fuera de pantalla o con la
// pestaña oculta; con movimiento reducido no avanza.
export function iniciarCarrusel(el, { solo = 0 } = {}) {
  const pista = el.querySelector('.yu-carrusel__pista');
  const [izq, der] = el.querySelectorAll('.yu-carrusel__flecha');
  const suave = () => (reducido() ? 'auto' : 'smooth');
  const paso = () => { const item = pista.firstElementChild; return item ? item.getBoundingClientRect().width + parseFloat(getComputedStyle(pista).columnGap || 16) : pista.clientWidth; };
  const actualizar = () => {
    const max = pista.scrollWidth - pista.clientWidth - 2;
    el.classList.toggle('puede-izq', pista.scrollLeft > 2);
    el.classList.toggle('puede-der', pista.scrollLeft < max);
    izq.disabled = pista.scrollLeft <= 2;
    der.disabled = pista.scrollLeft >= max;
  };
  [izq, der].forEach((b) => b.addEventListener('click', () => { pista.scrollBy({ left: Number(b.dataset.dir) * pista.clientWidth * 0.85, behavior: suave() }); descanso(); }));
  pista.addEventListener('scroll', actualizar, { passive: true });
  new ResizeObserver(actualizar).observe(pista);
  actualizar();

  // Arrastrar con el mouse (con el dedo ya lo hace el navegador)
  let arrastre = null;
  pista.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    arrastre = { x: e.clientX, left: pista.scrollLeft, movio: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    const dx = e.clientX - arrastre.x;
    if (Math.abs(dx) > 5 && !arrastre.movio) { arrastre.movio = true; el.classList.add('is-arrastrando'); }
    if (arrastre.movio) pista.scrollLeft = arrastre.left - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!arrastre) return;
    const movio = arrastre.movio;
    arrastre = null;
    el.classList.remove('is-arrastrando');
    if (movio) { pista.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); }, { capture: true, once: true }); descanso(); }
  });
  pista.addEventListener('dragstart', (e) => e.preventDefault());

  // Avance solo
  if (!solo || reducido()) return;
  const pausas = new Set();
  let timer = 0;
  const programar = () => { clearInterval(timer); if (!pausas.size) timer = setInterval(avanzar, solo * 1000); };
  const pausar = (motivo, si) => { if (si) pausas.add(motivo); else pausas.delete(motivo); programar(); };
  function avanzar() {
    if (!el.isConnected) { clearInterval(timer); return; }
    const max = pista.scrollWidth - pista.clientWidth - 2;
    if (max <= 0) return;
    pista.scrollTo({ left: pista.scrollLeft >= max ? 0 : Math.min(max + 2, pista.scrollLeft + paso()), behavior: suave() });
  }
  // Después de que la persona lo usa, espera un rato antes de seguir solo
  let descansoT = 0;
  function descanso() { if (!solo || reducido()) return; pausar('uso', true); clearTimeout(descansoT); descansoT = setTimeout(() => pausar('uso', false), 8000); }
  el.addEventListener('mouseenter', () => pausar('mouse', true));
  el.addEventListener('mouseleave', () => pausar('mouse', false));
  el.addEventListener('focusin', () => pausar('foco', true));
  el.addEventListener('focusout', (e) => { if (!el.contains(e.relatedTarget)) pausar('foco', false); });
  pista.addEventListener('touchstart', descanso, { passive: true });
  new IntersectionObserver(([e]) => pausar('fuera', !e.isIntersecting), { threshold: 0.4 }).observe(el);
  document.addEventListener('visibilitychange', () => pausar('oculta', document.hidden));
  programar();
}
