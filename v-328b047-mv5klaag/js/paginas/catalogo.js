// Catálogo: toda la tienda (/tienda), una categoría (/categoria/:handle) o una búsqueda (/buscar?q=).
// Barra con búsqueda, cantidad, orden y "solo con stock"; chips de categorías; filtros que vienen de la tienda (facets);
// "Cargar más" sin recargar. El estado queda en la dirección (?orden=&disp=1&q=) para compartir o volver atrás.
import { tienda, $, esc, icono, tarjeta, tarjetasCargando, tituloPagina, enlace, rutaActual, rellenoProductos } from '../comun.js';
import { iniciarCarrusel } from './inicio.js';
import { ilustracion, ilustracionDe, PASTELES } from '../ilustraciones.js';

const POR_PAGINA = 24;
const ORDENES = [['', 'Más relevantes'], ['newest', 'Más nuevos'], ['price-asc', 'Menor precio'], ['price-desc', 'Mayor precio'], ['title-asc', 'Nombre (A-Z)']];

export async function catalogo(app, { categoria = null, buscar = null, params }) {
  const estado = {
    categoria, buscar: buscar ?? params.get('q') ?? '', orden: params.get('orden') ?? '', disp: params.get('disp') === '1',
    marca: params.get('marca') ?? '', atributos: {}, pagina: 1,
  };
  for (const [k, v] of params) if (k.startsWith('f.')) estado.atributos[k.slice(2)] = v;

  const cats = await tienda.categorias().catch(() => []);
  const actual = cats.find((c) => c.handle === categoria);
  if (categoria && !actual) { const e = new Error('404'); e.status = 404; throw e; }
  const madre = actual?.parent ? cats.find((c) => c.handle === actual.parent) : null;
  const principales = cats.filter((c) => c.productCount && !c.parent);
  const hijas = actual ? cats.filter((c) => c.parent === (actual.parent ?? actual.handle) && c.productCount) : [];
  const titulo = actual ? actual.name : estado.buscar ? `Resultados para “${estado.buscar}”` : 'Tienda';
  tituloPagina(actual?.name ?? (estado.buscar ? `Buscar: ${estado.buscar}` : 'Tienda'), actual?.description || null);

  const nIll = actual ? ilustracionDe(actual.name) : estado.buscar ? 'brillo' : 'nuevo';
  app.innerHTML = `
    <div class="yu-pagina yu-catalogo">
      <nav class="yu-migas" aria-label="Estás en"><ol>
        <li><a href="/" data-link>Inicio</a></li>
        ${actual || estado.buscar ? '<li><a href="/tienda" data-link>Tienda</a></li>' : ''}
        ${madre ? `<li><a href="/categoria/${esc(madre.handle)}" data-link>${esc(madre.name)}</a></li>` : ''}
        <li aria-current="page">${esc(actual?.name ?? (estado.buscar ? 'Búsqueda' : 'Tienda'))}</li>
      </ol></nav>
      <header class="yu-cat-cab">
        <div>
          <p class="yu-etiqueta-seccion">${actual ? 'Categoría' : estado.buscar ? 'Búsqueda' : 'Todos los productos'}</p>
          <h1>${esc(titulo)}</h1>
          ${actual?.description ? `<p class="yu-cat-cab__desc">${esc(actual.description)}</p>` : ''}
        </div>
        <span class="yu-circulo yu-circulo--grande" style="--yu-bg:#fff">${ilustracion(nIll)}</span>
      </header>

      <div class="yu-barra-cat" id="barra-cat">
        <form class="yu-barra-cat__buscar" role="search" id="cat-buscar">
          ${icono('buscar')}
          <input type="search" name="q" value="${esc(estado.buscar)}" placeholder="${actual ? `Buscar en ${esc(actual.name)}…` : 'Buscar moldes, insumos…'}" aria-label="Buscar en el catálogo">
        </form>
        <p class="yu-barra-cat__total" id="cat-total" aria-live="polite"></p>
        <label class="yu-interruptor"><input type="checkbox" id="cat-disp"${estado.disp ? ' checked' : ''}><span aria-hidden="true"></span>Solo con stock</label>
        <label class="yu-select"><span class="yu-oculto">Ordenar por</span>
          <select id="cat-orden">${ORDENES.map(([v, n]) => `<option value="${v}"${v === estado.orden ? ' selected' : ''}>${n}</option>`).join('')}</select>${icono('abajo')}
        </label>
      </div>

      ${principales.length ? `<div class="yu-carrusel yu-carrusel--desvanece yu-cats-tienda" data-carrusel>
        <button type="button" class="yu-carrusel__flecha yu-carrusel__flecha--izq" data-dir="-1" aria-label="Categorías anteriores">${icono('izq')}</button>
        <nav class="yu-carrusel__pista yu-chips yu-chips--cats" aria-label="Categorías">
        <a class="yu-chip" href="/tienda" data-link${!categoria ? ' aria-current="page"' : ''}>Todo</a>
        ${principales.map((c, i) => `<a class="yu-chip" href="/categoria/${esc(c.handle)}" data-link${c.handle === categoria || c.handle === madre?.handle ? ' aria-current="page"' : ''}><span class="yu-circulo yu-circulo--mini" style="--yu-bg:${PASTELES[i % PASTELES.length]}">${ilustracion(ilustracionDe(c.name))}</span>${esc(c.name)}</a>`).join('')}
      </nav>
        <button type="button" class="yu-carrusel__flecha yu-carrusel__flecha--der" data-dir="1" aria-label="Más categorías">${icono('der')}</button>
      </div>` : ''}
      ${hijas.length ? `<nav class="yu-chips yu-chips--sub" aria-label="Subcategorías">${hijas.map((c) => `<a class="yu-chip yu-chip--sub" href="/categoria/${esc(c.handle)}" data-link${c.handle === categoria ? ' aria-current="page"' : ''}>${esc(c.name)}</a>`).join('')}</nav>` : ''}
      <div class="yu-filtros" id="cat-filtros" hidden></div>

      <div class="yu-grilla yu-grilla--catalogo" id="cat-grilla" aria-live="polite" aria-busy="true">${tarjetasCargando(8)}</div>
      <div class="yu-mas" id="cat-mas"></div>
    </div>`;

  const grilla = $('#cat-grilla');
  const conservarUrl = () => {
    const p = new URLSearchParams();
    if (estado.buscar) p.set('q', estado.buscar);
    if (estado.orden) p.set('orden', estado.orden);
    if (estado.disp) p.set('disp', '1');
    if (estado.marca) p.set('marca', estado.marca);
    for (const [k, v] of Object.entries(estado.atributos)) p.set(`f.${k}`, v);
    const base = categoria ? `/categoria/${categoria}` : estado.buscar ? '/buscar' : '/tienda';
    const url = base + (p.size ? `?${p}` : '');
    if (url !== rutaActual()) history.replaceState(null, '', enlace(url));
  };

  let pedidoN = 0;
  async function cargar({ agregar = false } = {}) {
    const n = ++pedidoN;
    if (!agregar) { estado.pagina = 1; grilla.setAttribute('aria-busy', 'true'); grilla.classList.add('is-cargando'); }
    const boton = $('#cat-mas button');
    if (agregar && boton) { boton.disabled = true; boton.classList.add('is-cargando'); }
    let r;
    try {
      r = await tienda.productos.listar({
        categoria, buscar: estado.buscar || undefined, orden: estado.orden || undefined, soloDisponibles: estado.disp,
        marca: estado.marca || undefined, atributos: estado.atributos, pagina: estado.pagina, porPagina: POR_PAGINA,
      });
    } catch (err) {
      if (n !== pedidoN) return;
      grilla.classList.remove('is-cargando');
      grilla.removeAttribute('aria-busy');
      grilla.innerHTML = `<div class="yu-vacio"><p>No pudimos cargar los productos. ${esc(err.message)}</p><button class="yu-btn yu-btn--borde" id="reintentar">Reintentar</button></div>`;
      $('#reintentar').addEventListener('click', () => cargar());
      return;
    }
    if (n !== pedidoN) return; // llegó una respuesta vieja
    grilla.classList.remove('is-cargando');
    grilla.removeAttribute('aria-busy');
    $('#cat-total').textContent = `${r.total} producto${r.total === 1 ? '' : 's'}`;
    pintarFiltros(r.facets);

    if (!r.items.length) {
      const sugeridos = r.suggestions ?? [];
      const filtrando = estado.disp || estado.marca || Object.keys(estado.atributos).length;
      const otras = principales.filter((c) => c.handle !== categoria);
      grilla.innerHTML = `<div class="yu-vacio">
        <span class="yu-circulo" style="--yu-bg:#FFE1D3">${ilustracion('brillo')}</span>
        <h2>${estado.buscar ? `No encontramos “${esc(estado.buscar)}”` : filtrando ? 'No hay productos con estos filtros' : 'Muy pronto vas a ver los productos acá'}</h2>
        <p>${filtrando ? 'Probá sacando algún filtro.' : estado.buscar ? 'Probá con otra palabra o mirá las categorías.' : 'Estamos cargando el catálogo. Mientras tanto, escribinos y te ayudamos a encontrar tu molde.'}</p>
        ${estado.disp || estado.marca || Object.keys(estado.atributos).length || estado.buscar ? '<button class="yu-btn yu-btn--borde" id="limpiar">Limpiar búsqueda y filtros</button>' : ''}
      </div>
      ${sugeridos.length ? `<div class="yu-sugeridos"><h2>¿Quisiste decir…?</h2><div class="yu-grilla">${sugeridos.map((p) => tarjeta(p)).join('')}</div></div>`
        : otras.length ? `<div class="yu-sugeridos"><h2>Seguí explorando</h2><div class="yu-grilla">${rellenoProductos(0, Math.min(4, otras.length), otras)}</div></div>` : ''}`;
      $('#limpiar')?.addEventListener('click', () => {
        Object.assign(estado, { buscar: categoria ? '' : estado.buscar, disp: false, marca: '', atributos: {} });
        $('#cat-disp').checked = false;
        if (categoria) $('#cat-buscar').q.value = '';
        if (!categoria && estado.buscar) { history.replaceState(null, '', enlace('/tienda')); estado.buscar = ''; $('#cat-buscar').q.value = ''; }
        conservarUrl(); cargar();
      });
      $('#cat-mas').innerHTML = '';
      return;
    }
    const html = r.items.map((p, i) => tarjeta(p, { carga: !agregar && i < 4 ? 'eager' : 'lazy' })).join('');
    if (agregar) {
      grilla.insertAdjacentHTML('beforeend', html);
      // El foco va a la primera tarjeta nueva (teclado y lectores de pantalla no pierden el lugar)
      grilla.children[(estado.pagina - 1) * POR_PAGINA]?.querySelector('a[data-link]:not([tabindex])')?.focus({ preventScroll: true });
    } else grilla.innerHTML = html;
    const mostrados = Math.min(r.total, estado.pagina * POR_PAGINA);
    $('#cat-mas').innerHTML = r.page < r.pages
      ? `<p>Mostrando ${mostrados} de ${r.total}</p><div class="yu-mas__barra" aria-hidden="true"><span style="width:${(mostrados / r.total) * 100}%"></span></div><button class="yu-btn yu-btn--borde" type="button">Cargar más productos</button>`
      : r.total > POR_PAGINA ? `<p>Viste los ${r.total} productos</p>` : '';
    $('#cat-mas button')?.addEventListener('click', () => { estado.pagina += 1; cargar({ agregar: true }); });
  }

  // Filtros por marca y características: solo si la tienda los tiene cargados en estos productos
  function pintarFiltros(facets) {
    const caja = $('#cat-filtros');
    const marcas = facets?.vendors?.length > 1 ? facets.vendors : [];
    const atributos = (facets?.attributes ?? []).filter((a) => a.values.length > 1 || estado.atributos[a.name]);
    if (!marcas.length && !atributos.length) { caja.hidden = true; return; }
    const sel = (nombre, valores, elegido, clave) => `<label class="yu-select yu-select--filtro"><span>${esc(nombre)}</span>
      <select data-filtro="${esc(clave)}"><option value="">Todos</option>${valores.map((v) => `<option value="${esc(v.value)}"${v.value === elegido ? ' selected' : ''}>${esc(v.value)} (${v.count})</option>`).join('')}</select>${icono('abajo')}</label>`;
    caja.innerHTML = (marcas.length ? sel('Marca', marcas, estado.marca, ':marca') : '') + atributos.map((a) => sel(a.name, a.values, estado.atributos[a.name], a.name)).join('');
    caja.hidden = false;
  }
  $('#cat-filtros').addEventListener('change', (e) => {
    const s = e.target.closest('[data-filtro]');
    if (!s) return;
    if (s.dataset.filtro === ':marca') estado.marca = s.value;
    else if (s.value) estado.atributos[s.dataset.filtro] = s.value; else delete estado.atributos[s.dataset.filtro];
    conservarUrl(); cargar();
  });

  $('#cat-orden').addEventListener('change', (e) => { estado.orden = e.target.value; conservarUrl(); cargar(); });
  $('#cat-disp').addEventListener('change', (e) => { estado.disp = e.target.checked; conservarUrl(); cargar(); });
  let t = 0;
  const form = $('#cat-buscar');
  form.q.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => { estado.buscar = form.q.value.trim(); conservarUrl(); cargar(); }, 350);
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); clearTimeout(t); estado.buscar = form.q.value.trim(); conservarUrl(); cargar(); });

  // La barra queda fija debajo del header al bajar: una clase para darle sombra solo cuando está pegada
  const barra = $('#barra-cat');
  const centinela = document.createElement('div');
  barra.before(centinela);
  new IntersectionObserver(([e]) => barra.classList.toggle('is-pegada', !e.isIntersecting), { rootMargin: '-90px 0px 0px 0px' }).observe(centinela);

  // Categorías: slider con flechas si no entran todas; el chip activo queda a la vista
  const cs = $('.yu-cats-tienda');
  if (cs) {
    iniciarCarrusel(cs);
    const activo = $('.yu-chips--cats [aria-current]');
    if (activo) cs.querySelector('.yu-carrusel__pista').scrollLeft = activo.offsetLeft - 60;
  }
  window.scrollTo(0, 0);
  await cargar();
}
