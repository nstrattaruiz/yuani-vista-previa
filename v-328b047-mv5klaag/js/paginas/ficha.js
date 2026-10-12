// Ficha de producto: galería protagonista con fondo pastel y miniaturas abajo en carrusel, precio con
// transferencia, disponibilidad (solo "hay / no hay", nunca cantidades), variantes que actualizan precio, foto y stock,
// cantidad limitada al stock, indicador discreto de descuentos por monto, beneficios, acordeón y "Combiná con".
import { tienda, $, $$, esc, icono, ctx, foto, precio, ahorro, botonFavorito, tarjeta, tituloSeccion, tituloPagina, marcas, dinero, waLink, reducido, meta, enlace, fondoFoto, ir } from '../comun.js';
import { estadoDescuento, completar } from '../descuentos.js';
import { ilustracion, ilustracionDe } from '../ilustraciones.js';
import { avisoAgregado } from '../app.js';
import { iniciarCarrusel } from './inicio.js';
import { abrirCalculadora } from '../calculadora-ui.js';
import { leerMedidas, materialDe } from '../calculadora.js';

export async function ficha(app, handle) {
  const p = await tienda.productos.uno(handle);
  const { t } = ctx;
  const resumen = String(p.description ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 155);
  tituloPagina(p.title, resumen);
  if (p.image) meta('og:image', p.image.url, 'property');
  meta('og:type', 'product', 'property');

  const cats = await tienda.categorias().catch(() => []);
  const temporada = /navid|hallow|pascu|ofert|nuev|insum/i;
  const cat = cats.find((c) => p.categories?.includes(c.handle) && !temporada.test(c.handle)) ?? cats.find((c) => p.categories?.includes(c.handle));
  const elegido = [...(p.variants.find((v) => v.available)?.options ?? p.variants[0]?.options ?? [])];
  const conOpciones = p.options.length && !(p.variants.length === 1 && !p.variants[0].title);
  const fotos = p.images.length ? p.images : [null];
  const beneficios = t('ficha.beneficios').filter((b) => b.titulo);
  const ICONOS = { camion: 'camion', local: 'local', chat: 'chat', tarjeta: 'tarjeta', regalo: 'regalo', hoja: 'hoja' };
  const sku = p.variants.find((v) => v.sku)?.sku;
  const atributos = Object.entries(p.attributes ?? {});
  const wa = waLink(`¡Hola! Tengo una consulta sobre ${p.title}`);
  // "Combiná con": lo que cargó la tienda; si no hay, otros productos de la misma categoría o los últimos cargados
  let relacionados = p.related ?? [];
  if (!relacionados.length) {
    const otros = await tienda.productos.listar({ categoria: cat?.handle, porPagina: 12 }).catch(() => ({ items: [] }));
    relacionados = otros.items.filter((x) => x.handle !== p.handle);
    if (relacionados.length < 4) relacionados = [...relacionados, ...((await tienda.productos.listar({ orden: 'newest', porPagina: 12 }).catch(() => ({ items: [] }))).items)].filter((x, i, a) => x.handle !== p.handle && a.findIndex((y) => y.handle === x.handle) === i);
    relacionados = relacionados.slice(0, 10);
  }

  app.innerHTML = `
    <div class="yu-pagina yu-ficha-pagina">
      <nav class="yu-migas" aria-label="Estás en"><ol>
        <li><a href="/" data-link>Inicio</a></li>
        ${cat ? `<li><a href="/categoria/${esc(cat.handle)}" data-link>${esc(cat.name)}</a></li>` : '<li><a href="/tienda" data-link>Tienda</a></li>'}
        <li aria-current="page">${esc(p.title)}</li>
      </ol></nav>
      <div class="yu-ficha">
        <div class="yu-galeria" id="galeria" style="${fondoFoto(p.handle)}">
          <div class="yu-galeria__escenario">
            <div class="yu-galeria__pista" id="pista" tabindex="0" aria-label="Fotos de ${esc(p.title)}">${fotos.map((f, i) => `<figure class="yu-galeria__foto" data-indice="${i}">${f ? `<button type="button" class="yu-galeria__zoom" data-zoom="${i}" aria-label="Ampliar foto ${i + 1}">${foto(f, p.title, { ancho: 1024, sizes: '(max-width: 989px) 100vw, 50vw', carga: i === 0 ? 'eager' : 'lazy' })}</button>` : '<span class="yu-sin-foto"></span>'}</figure>`).join('')}</div>
            ${ahorro(p) ? `<span class="yu-etiqueta yu-etiqueta--oferta yu-galeria__etiqueta" id="ficha-ahorro">-${ahorro(p)}%</span>` : ''}
            ${fotos.length > 1 ? `<div class="yu-galeria__puntos" aria-hidden="true">${fotos.map((_, i) => `<span class="${i === 0 ? 'is-activo' : ''}"></span>`).join('')}</div>
              <button type="button" class="yu-icono-btn yu-galeria__flecha yu-galeria__flecha--izq" data-mover="-1" aria-label="Foto anterior">${icono('izq')}</button>
              <button type="button" class="yu-icono-btn yu-galeria__flecha yu-galeria__flecha--der" data-mover="1" aria-label="Foto siguiente">${icono('der')}</button>` : ''}
          </div>
          ${fotos.length > 1 ? `<div class="yu-carrusel yu-galeria__tira" data-carrusel>
            <button type="button" class="yu-carrusel__flecha yu-carrusel__flecha--izq" data-dir="-1" aria-label="Fotos anteriores">${icono('izq')}</button>
            <div class="yu-carrusel__pista yu-galeria__minis" role="tablist" aria-label="Fotos de ${esc(p.title)}">${fotos.map((f, i) => `<button type="button" class="yu-galeria__mini" role="tab" data-foto="${i}" aria-selected="${i === 0}" aria-label="Foto ${i + 1} de ${fotos.length}">${foto(f, p.title, { ancho: 320, sizes: '96px' })}</button>`).join('')}</div>
            <button type="button" class="yu-carrusel__flecha yu-carrusel__flecha--der" data-dir="1" aria-label="Más fotos">${icono('der')}</button>
          </div>` : ''}
        </div>

        <div class="yu-ficha__info">
          <div class="yu-ficha__cab">
            <h1>${esc(p.title)}</h1>
            ${botonFavorito(p, 'yu-ficha__fav')}
          </div>
          <div id="ficha-precio">${precio(p, { grande: true })}</div>
          <p class="yu-dispo" id="ficha-dispo"></p>
          ${p.description ? `<div class="yu-texto-rico yu-ficha__desc">${p.description}</div>` : ''}
          ${conOpciones ? p.options.map((o, i) => `
            <fieldset class="yu-opcion"><legend>${esc(o.name)}: <b data-elegido="${i}">${esc(elegido[i] ?? '')}</b></legend>
              <div class="yu-opcion__valores" data-opcion="${i}">${o.values.map((v) => (o.colors?.[v]
                ? `<button type="button" class="yu-muestra" style="--color:${esc(o.colors[v])}" aria-label="${esc(v)}" aria-pressed="${v === elegido[i]}" data-valor="${esc(v)}"></button>`
                : `<button type="button" aria-pressed="${v === elegido[i]}" data-valor="${esc(v)}">${esc(v)}</button>`)).join('')}</div>
            </fieldset>`).join('') : ''}
          ${p.multiple > 1 ? `<p class="yu-ficha__nota">Se vende de a ${p.multiple} unidades.</p>` : ''}
          <div class="yu-ficha__comprar" id="comprar">
            <div class="yu-cant" id="ficha-cant">
              <button type="button" data-paso="-1" aria-label="Uno menos">${icono('menos')}</button>
              <input type="number" inputmode="numeric" min="1" value="1" aria-label="Cantidad">
              <button type="button" data-paso="1" aria-label="Uno más">${icono('mas')}</button>
            </div>
            <button class="yu-btn yu-btn--grande yu-ficha__agregar" id="agregar" type="button">${icono('bolsa')}<span>Agregar al carrito</span></button>
            <button class="yu-btn yu-btn--grande yu-btn--tinta yu-ficha__ya" id="comprar-ya" type="button">Comprar ahora</button>
          </div>
          <p class="yu-error" id="ficha-error" role="alert"></p>
          <form class="yu-avisame" id="avisame" hidden novalidate>
            <p><strong>Avisame cuando vuelva</strong><small>Te escribimos apenas tengamos stock.</small></p>
            <div class="yu-avisame__fila"><input name="email" type="email" placeholder="Tu email" required autocomplete="email" aria-label="Tu email" value="${esc(ctx.cliente?.email ?? '')}"><button class="yu-btn yu-btn--borde">Avisarme</button></div>
            <p class="yu-form-estado" role="status"></p>
          </form>
          ${beneficios.length ? `<ul class="yu-beneficios">${beneficios.map((b) => {
            const linkChat = b.icono === 'chat' && wa;
            return `<li><span class="yu-circulo-icono">${icono(ICONOS[b.icono] ?? 'check')}</span><span>${linkChat ? `<a href="${esc(wa)}" target="_blank" rel="noopener"><strong>${esc(b.titulo)}</strong></a>` : `<strong>${esc(b.titulo)}</strong>`}${b.texto ? `<small>${esc(b.texto)}</small>` : ''}</span></li>`;
          }).join('')}</ul>` : ''}

          ${ctx.escalones.length ? `<div class="yu-promo">
            <span class="yu-promo__ill">${icono('regalo')}</span>
            <div><strong>${esc(t('descuentos.titulo'))}</strong>
              <p>${ctx.escalones.map((e) => `${e.porcentaje}% OFF desde ${dinero(e.monto)}`).join(' · ')}</p>
              <p class="yu-ficha__descuento" id="ficha-descuento" aria-live="polite"></p>
            </div>
          </div>` : ''}

          <div class="yu-acordeon">
            ${sku || atributos.length ? `<details open><summary>Especificaciones${icono('mas')}</summary><dl class="yu-specs">
              ${sku ? `<div><dt>Referencia</dt><dd id="ficha-sku">${esc(sku)}</dd></div>` : ''}
              ${atributos.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
              ${!p.attributes?.Material && t('ficha.material') ? `<div><dt>Material</dt><dd>${esc(t('ficha.material'))}</dd></div>` : ''}
            </dl></details>` : ''}
            ${t('ficha.envios') ? `<details><summary>Envíos y retiros${icono('mas')}</summary><div class="yu-texto-rico">${marcas(t('ficha.envios'))}</div></details>` : ''}
            ${t('ficha.cuidados') ? `<details><summary>Cuidado de tus moldes${icono('mas')}</summary><div class="yu-texto-rico">${marcas(t('ficha.cuidados'))}</div></details>` : ''}
            ${p.faq?.length ? p.faq.map((f) => `<details><summary>${esc(f.q)}${icono('mas')}</summary><div class="yu-texto-rico"><p>${esc(f.a)}</p></div></details>`).join('') : ''}
            <button type="button" class="yu-ficha__calc" id="ficha-calc">¿Cuánto material necesito? <small>Calculadora</small>${icono('der')}</button>
          </div>
        </div>
      </div>

      ${relacionados.length ? `<section class="yu-seccion yu-carrusel" data-carrusel aria-labelledby="rel-titulo">
        ${tituloSeccion({ etiqueta: 'Para tu próxima creación', titulo: 'Combiná con', id: 'rel-titulo', flechas: true })}
        <div class="yu-carrusel__pista yu-fila-cards">${relacionados.map((r) => tarjeta(r)).join('')}</div>
      </section>` : ''}
    </div>

    <div class="yu-compra-fija" id="compra-fija" aria-hidden="true" inert style="${fondoFoto(p.handle)}">
      <span class="yu-compra-fija__foto">${p.image ? foto(p.image, p.title, { ancho: 320, sizes: '52px' }) : ''}</span>
      <div class="yu-compra-fija__texto"><strong>${esc(p.title)}</strong><span><b id="fija-precio"></b> <small id="fija-variante"></small></span></div>
      <button type="button" class="yu-btn yu-btn--borde yu-compra-fija__ya" id="fija-ya">Comprar ahora</button>
      <button type="button" class="yu-btn" id="fija-agregar">${icono('bolsa')}<span>Agregar</span></button>
    </div>

    <div class="yu-ficha-fondo" aria-hidden="true">${[cat?.name ?? '', 'brillo', 'regalo', p.title, 'nuevo', 'vela'].map((n, i) => `<span style="--k:${i}">${ilustracion(ilustracionDe(n) === 'brillo' && i ? ['jabon', 'resina', 'yeso', 'bombon', 'vela', 'regalo'][i] : ilustracionDe(n))}</span>`).join('')}</div>

    <dialog class="yu-lupa" id="lupa" aria-label="Foto ampliada">
      <button type="button" class="yu-icono-btn yu-lupa__cerrar" aria-label="Cerrar">${icono('cerrar')}</button>
      <div class="yu-lupa__foto" id="lupa-foto"></div>
    </dialog>`;

  datosEstructurados(p);
  $$('[data-carrusel]', app).forEach((el) => iniciarCarrusel(el));

  // ------------------------------------------------ galería
  const pista = $('#pista');
  let fotoActual = 0;
  const irAFoto = (i, suave = true) => {
    const fig = pista.children[i];
    if (!fig) return;
    pista.scrollTo({ left: fig.offsetLeft, behavior: suave && !reducido() ? 'smooth' : 'auto' });
  };
  const marcarFoto = (i) => {
    fotoActual = i;
    $$('.yu-galeria__mini').forEach((b, n) => {
      b.setAttribute('aria-selected', String(n === i));
      if (n === i) { const tira = b.parentElement; tira.scrollTo({ left: b.offsetLeft - tira.clientWidth / 2 + b.clientWidth / 2, behavior: reducido() ? 'auto' : 'smooth' }); }
    });
    $$('.yu-galeria__puntos span').forEach((s, n) => s.classList.toggle('is-activo', n === i));
  };
  pista.addEventListener('scroll', () => {
    const i = Math.round(pista.scrollLeft / pista.clientWidth);
    if (i !== fotoActual) marcarFoto(i);
  }, { passive: true });
  $$('.yu-galeria__mini').forEach((b) => b.addEventListener('click', () => { irAFoto(Number(b.dataset.foto)); marcarFoto(Number(b.dataset.foto)); }));
  $$('[data-mover]').forEach((b) => b.addEventListener('click', () => irAFoto((fotoActual + Number(b.dataset.mover) + fotos.length) % fotos.length)));
  pista.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') irAFoto(Math.min(fotos.length - 1, fotoActual + 1));
    if (e.key === 'ArrowLeft') irAFoto(Math.max(0, fotoActual - 1));
  });
  // Lupa: foto grande sobre crema, se cierra con Esc, la X o tocando afuera
  const lupa = $('#lupa');
  pista.addEventListener('click', (e) => {
    const b = e.target.closest('[data-zoom]');
    if (!b) return;
    const f = p.images[Number(b.dataset.zoom)];
    $('#lupa-foto').innerHTML = foto(f, p.title, { ancho: 1024, sizes: '90vw', carga: 'eager' });
    lupa.showModal();
  });
  lupa.addEventListener('click', (e) => { if (e.target === lupa || e.target.closest('.yu-lupa__cerrar')) lupa.close(); });

  // ------------------------------------------------ variantes
  const variante = () => p.variants.find((v) => v.options.every((x, i) => x === elegido[i])) ?? (p.variants.length === 1 ? p.variants[0] : null);
  const cantInput = $('#ficha-cant input');
  const lector = p.priceHidden ? 'ingresar' : null;
  const actualizar = () => {
    const v = variante();
    const disponible = !!v?.available;
    const boton = $('#agregar');
    boton.disabled = !disponible && !lector;
    $('span', boton).textContent = lector ? 'Ingresá para comprar' : !v ? 'Elegí una opción' : disponible ? 'Agregar al carrito' : 'Sin stock';
    $('#fija-agregar').disabled = boton.disabled;
    $('#comprar-ya').hidden = !disponible || !!lector;
    $('#fija-ya').disabled = !disponible;
    $('#ficha-cant').hidden = !disponible;
    // Cantidad hasta el stock (si la tienda lleva stock), descontando lo que ya está en el carrito
    const enCarrito = ctx.carrito?.lines.find((l) => l.variantId === v?.id)?.quantity ?? 0;
    const max = v?.stock != null ? Math.max(1, v.stock - enCarrito) : 99;
    cantInput.max = max;
    if (Number(cantInput.value) > max) cantInput.value = max;
    $('#ficha-dispo').className = `yu-dispo ${disponible ? 'is-si' : 'is-no'}`;
    $('#ficha-dispo').innerHTML = disponible ? `<span class="yu-dispo__punto"></span><strong>${esc(t('ficha.disponible'))}</strong>${t('ficha.disponibleNota') ? `<small>${esc(t('ficha.disponibleNota'))}</small>` : ''}`
      : `<span class="yu-dispo__punto"></span><strong>${esc(t('ficha.agotado'))}</strong>`;
    $('#avisame').hidden = !v || disponible;
    if (v) {
      const pv = { ...p, price: v.price, compareAtPrice: v.compareAtPrice, retailPrice: v.retailPrice, priceMin: null, priceMax: null };
      $('#ficha-precio').innerHTML = precio(pv, { grande: true });
      $('#fija-precio').textContent = dinero(v.price, p.currency);
      $('#fija-variante').textContent = v.title ? `· ${v.title}` : '';
      const pct = ahorro(pv);
      if ($('#ficha-ahorro')) { $('#ficha-ahorro').hidden = !pct; $('#ficha-ahorro').textContent = `-${pct}%`; }
      if (v.sku && $('#ficha-sku')) $('#ficha-sku').textContent = v.sku;
      // Variante con foto propia: se muestra esa foto
      if (v.imageIndex != null) { irAFoto(v.imageIndex); marcarFoto(v.imageIndex); }
    }
    pintarDescuento();
  };
  $$('[data-opcion]', app).forEach((grupo) => grupo.addEventListener('click', (e) => {
    const b = e.target.closest('[data-valor]');
    if (!b) return;
    const i = Number(grupo.dataset.opcion);
    elegido[i] = b.dataset.valor;
    $$('button', grupo).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $(`[data-elegido="${i}"]`).textContent = b.dataset.valor;
    actualizar();
  }));
  // Valores sin stock: tachados (si con lo demás elegido no hay ninguna variante disponible)
  $$('[data-opcion]', app).forEach((grupo) => {
    const i = Number(grupo.dataset.opcion);
    $$('button', grupo).forEach((b) => {
      const hay = p.variants.some((v) => v.options[i] === b.dataset.valor && v.available);
      b.classList.toggle('is-agotado', !hay);
      if (!hay) b.setAttribute('aria-label', `${b.dataset.valor} (sin stock)`);
    });
  });

  // ------------------------------------------------ descuentos por monto: indicador discreto
  function pintarDescuento() {
    const el = $('#ficha-descuento');
    if (!el || !ctx.escalones.length) return;
    const v = variante();
    const sub = ctx.carrito?.subtotal ?? 0;
    const est = estadoDescuento(sub, ctx.escalones);
    if (!est.siguiente) { el.innerHTML = est.actual ? esc(completar(t('descuentos.maximo'), { porcentaje: est.actual.porcentaje })) : ''; return; }
    // Si con esta compra (cantidad elegida) ya llega, se dice
    const conEsta = v?.price ? sub + v.price * (Number(cantInput.value) || 1) : sub;
    const conEste = estadoDescuento(conEsta, ctx.escalones);
    el.innerHTML = conEste.actual && conEste.actual !== est.actual
      ? `Con este producto llegás al <b>${conEste.actual.porcentaje}% OFF</b> en toda la compra.`
      : esc(completar(t('descuentos.ficha'), { monto: dinero(est.falta), porcentaje: est.siguiente.porcentaje }));
  }
  const alCambiarCarrito = () => { if (!app.contains($('#ficha-descuento'))) { document.removeEventListener('yu:carrito', alCambiarCarrito); return; } actualizar(); };
  document.addEventListener('yu:carrito', alCambiarCarrito);
  cantInput.addEventListener('input', pintarDescuento);
  $('#ficha-cant').addEventListener('click', (e) => { if (e.target.closest('[data-paso]')) setTimeout(pintarDescuento); });

  // ------------------------------------------------ agregar
  async function agregar(boton) {
    if (lector === 'ingresar') { location.href = enlace('/cuenta'); return; }
    const v = variante();
    if (!v?.available) return;
    $('#ficha-error').textContent = '';
    boton.disabled = true;
    boton.classList.add('is-cargando');
    const cant = (Number(cantInput.value) || 1) * (p.multiple > 1 ? p.multiple : 1);
    try {
      const c = await tienda.carrito.agregar(v.id, cant);
      boton.classList.remove('is-cargando');
      boton.classList.add('is-agregado');
      $('span', boton).textContent = 'Agregado';
      avisoAgregado(c.lines.find((l) => l.variantId === v.id), c);
      cantInput.value = 1;
      setTimeout(() => { boton.classList.remove('is-agregado'); boton.disabled = false; actualizar(); }, 1600);
    } catch (err) {
      boton.classList.remove('is-cargando');
      boton.disabled = false;
      $('#ficha-error').textContent = err.message;
    }
  }
  $('#agregar').addEventListener('click', (e) => agregar(e.currentTarget));
  const comprarYa = async (boton) => {
    const v = variante();
    if (!v?.available) return;
    boton.disabled = true;
    boton.classList.add('is-cargando');
    try {
      await tienda.carrito.agregar(v.id, (Number(cantInput.value) || 1) * (p.multiple > 1 ? p.multiple : 1));
      ir('/checkout');
    } catch (err) {
      boton.disabled = false;
      boton.classList.remove('is-cargando');
      $('#ficha-error').textContent = err.message;
    }
  };
  $('#comprar-ya').addEventListener('click', (e) => comprarYa(e.currentTarget));
  // Calculadora con las medidas y el material más probable de este molde
  $('#ficha-calc').addEventListener('click', () => abrirCalculadora({
    titulo: `¿Cuánto material para “${p.title}”?`,
    material: materialDe(`${cat?.name ?? ''} ${p.title} ${(p.tags ?? []).join(' ')}`),
    medidas: leerMedidas(p.attributes?.Medidas) ?? undefined,
  }));
  $('#fija-ya').addEventListener('click', (e) => comprarYa(e.currentTarget));
  $('#fija-agregar').addEventListener('click', (e) => agregar(e.currentTarget));

  // Barra de compra fija en celular: aparece cuando el botón principal sale de pantalla
  const fija = $('#compra-fija');
  new IntersectionObserver(([e]) => {
    const ver = !e.isIntersecting && e.boundingClientRect.top < 0;
    fija.classList.toggle('is-visible', ver);
    fija.inert = !ver;
    fija.setAttribute('aria-hidden', String(!ver));
  }).observe($('#comprar'));

  $('#avisame').addEventListener('submit', async (e) => {
    e.preventDefault();
    const estado = e.target.querySelector('[role=status]');
    const email = e.target.email.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) { estado.textContent = 'Escribí un email válido.'; e.target.email.focus(); return; }
    try {
      await tienda.productos.avisarme(p.handle, variante()?.id, email, `/producto/${p.handle}`);
      estado.textContent = '¡Listo! Te escribimos apenas vuelva.';
    } catch (err) { estado.textContent = err.message; }
  });

  actualizar();
}

/** Datos para Google (producto, precio y disponibilidad). */
function datosEstructurados(p) {
  document.getElementById('ld-producto')?.remove();
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.id = 'ld-producto';
  s.textContent = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Product', name: p.title, image: p.images.map((i) => i.url),
    sku: p.variants[0]?.sku || undefined, brand: { '@type': 'Brand', name: ctx.info.name },
    description: String(p.description ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    offers: p.priceHidden ? undefined : {
      '@type': 'Offer', priceCurrency: p.currency, price: (p.price / 100).toFixed(2), url: location.href,
      availability: p.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  });
  document.head.append(s);
}
