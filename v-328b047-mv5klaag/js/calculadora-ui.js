// Interfaz de la calculadora de materiales (ver js/calculadora.js para los datos y las cuentas).
// pintarCalculadora(contenedor, opciones): la dibuja en cualquier lugar (portada, página o popup).
// abrirCalculadora(opciones): la abre en un popup desde cualquier parte de la web (por ejemplo, la ficha de un molde).
import { $, $$, esc, icono } from './comun.js';
import { ilustracion } from './ilustraciones.js';
import { MATERIALES, FORMAS, CUIDADO_MOLDES, volumen, calcular } from './calculadora.js';

const PASTELES = { yeso: '#D6EEFF', velas: '#FFEDB3', jabon: '#E3DBFF', resina: '#BFEDE5', chocolate: '#FFE1D3' };
const num = (v) => (Number.isInteger(v) ? v.toLocaleString('es-UY') : v.toLocaleString('es-UY', { maximumFractionDigits: 1 }));

/**
 * opciones: { material, tipo, medidas: { largo, ancho, alto }, ml, compacta, titulo }
 * compacta: sin los consejos largos (la portada); muestra un link a la página completa.
 */
export function pintarCalculadora(caja, opciones = {}) {
  const e = {
    material: MATERIALES[opciones.material] ? opciones.material : 'yeso',
    tipo: opciones.tipo ?? null,
    modo: opciones.medidas ? 'medidas' : 'agua',
    ml: opciones.ml ?? 250,
    largo: opciones.medidas?.largo ?? '', ancho: opciones.medidas?.ancho ?? '', alto: opciones.medidas?.alto ?? '',
    forma: 'figura', piezas: 1, margen: true, fragancia: null,
  };
  const id = `calc-${Math.random().toString(36).slice(2, 7)}`;

  caja.classList.add('yu-calc');
  caja.innerHTML = `
    <div class="yu-calc__materiales" role="radiogroup" aria-label="¿Qué vas a preparar?">
      ${Object.entries(MATERIALES).map(([k, m]) => `<label class="yu-calc__material">
        <input type="radio" name="${id}-material" value="${k}"${k === e.material ? ' checked' : ''}>
        <span class="yu-circulo yu-circulo--chico" style="--yu-bg:${PASTELES[k]}">${ilustracion(m.ill)}</span><span>${esc(m.nombre)}</span></label>`).join('')}
    </div>
    <div class="yu-calc__cuerpo">
      <div class="yu-calc__datos">
        <label class="yu-campo"><span>Tipo</span><span class="yu-select yu-select--campo"><select data-c="tipo"></select>${icono('abajo')}</span></label>
        <div class="yu-calc__modo" role="radiogroup" aria-label="¿Cómo sabés el tamaño del molde?">
          <label><input type="radio" name="${id}-modo" value="agua"${e.modo === 'agua' ? ' checked' : ''}><span>Lo medí con agua</span></label>
          <label><input type="radio" name="${id}-modo" value="medidas"${e.modo === 'medidas' ? ' checked' : ''}><span>Tengo las medidas</span></label>
        </div>
        <div class="yu-calc__agua">
          <label class="yu-campo"><span>Capacidad de una pieza</span><span class="yu-calc__unidad"><input data-c="ml" type="number" inputmode="decimal" min="1" step="1" value="${esc(e.ml)}"><b>ml</b></span>
            <small class="yu-campo__ayuda">Llená el molde con agua y volcala en una jarra medidora (o pesala: 1 g = 1 ml).</small></label>
        </div>
        <div class="yu-calc__medidas">
          <div class="yu-calc__tres">
            ${[['largo', 'Largo'], ['ancho', 'Ancho'], ['alto', 'Alto']].map(([k, n]) => `<label class="yu-campo"><span>${n}</span><span class="yu-calc__unidad"><input data-c="${k}" type="number" inputmode="decimal" min="0" step="0.1" value="${esc(e[k])}"><b>cm</b></span></label>`).join('')}
          </div>
          <label class="yu-campo"><span>Forma de la pieza</span><span class="yu-select yu-select--campo"><select data-c="forma">${FORMAS.map((f) => `<option value="${f.id}"${f.id === e.forma ? ' selected' : ''}>${f.nombre}</option>`).join('')}</select>${icono('abajo')}</span></label>
        </div>
        <div class="yu-calc__fila">
          <div class="yu-campo"><span>Piezas</span>
            <div class="yu-cant"><button type="button" data-paso-piezas="-1" aria-label="Una pieza menos">${icono('menos')}</button><input data-c="piezas" type="number" inputmode="numeric" min="1" value="1" aria-label="Cantidad de piezas"><button type="button" data-paso-piezas="1" aria-label="Una pieza más">${icono('mas')}</button></div>
          </div>
          <label class="yu-interruptor"><input type="checkbox" data-c="margen" checked><span aria-hidden="true"></span>Sumar 10% de margen</label>
        </div>
        <label class="yu-campo yu-calc__fragancia" hidden><span>Esencia: <b data-fragancia></b></span><input data-c="fragancia" type="range" step="0.5"><small class="yu-campo__ayuda" data-fragancia-nota></small></label>
      </div>
      <div class="yu-calc__resultado" aria-live="polite">
        <p class="yu-calc__total"></p>
        <ul class="yu-calc__cantidades"></ul>
        <p class="yu-calc__nota"></p>
        <p class="yu-calc__aviso">Valores orientativos. Seguí siempre las indicaciones del fabricante de cada material.</p>
      </div>
    </div>
    ${opciones.compacta ? `<p class="yu-calc__mas"><a class="yu-link-flecha" href="/calculadora" data-link>Ver todos los consejos y el cuidado de tus moldes${icono('der')}</a></p>` : `
    <div class="yu-calc__consejos">
      <details open><summary>Consejos para <b data-consejos-titulo></b>${icono('mas')}</summary><ul data-consejos></ul></details>
      <details><summary>Cuidado de tus moldes${icono('mas')}</summary><ul>${CUIDADO_MOLDES.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></details>
    </div>`}`;

  const campo = (k) => $(`[data-c="${k}"]`, caja);
  const pintarTipos = () => {
    const m = MATERIALES[e.material];
    if (!m.tipos.some((t) => t.id === e.tipo)) e.tipo = m.tipos[0].id;
    campo('tipo').innerHTML = m.tipos.map((t) => `<option value="${t.id}"${t.id === e.tipo ? ' selected' : ''}>${esc(t.nombre)}</option>`).join('');
    const fr = m.extra?.fragancia;
    $('.yu-calc__fragancia', caja).hidden = !fr;
    if (fr) {
      const r = campo('fragancia');
      r.min = fr.min; r.max = fr.max;
      if (e.fragancia === null || e.fragancia > fr.max) e.fragancia = fr.defecto;
      r.value = e.fragancia;
      $('[data-fragancia-nota]', caja).textContent = fr.nota;
    }
    const ul = $('[data-consejos]', caja);
    if (ul) { ul.innerHTML = m.consejos.map((c) => `<li>${esc(c)}</li>`).join(''); $('[data-consejos-titulo]', caja).textContent = m.nombre.toLowerCase(); }
  };
  const pintar = () => {
    caja.dataset.modo = e.modo;
    const ml = volumen(e);
    const t = MATERIALES[e.material].tipos.find((x) => x.id === e.tipo);
    const res = calcular({ material: e.material, tipo: e.tipo, ml, piezas: e.piezas, margen: e.margen ? 10 : 0, fragancia: e.fragancia });
    $('[data-fragancia]', caja).textContent = `${num(Number(e.fragancia))}%`;
    $('.yu-calc__total', caja).innerHTML = ml
      ? `Para <b>${e.piezas} pieza${e.piezas === 1 ? '' : 's'}</b> de <b>${num(Math.round(ml))} ml</b>${e.margen ? ' (+10%)' : ''} necesitás:`
      : 'Completá el tamaño del molde para ver las cantidades.';
    $('.yu-calc__cantidades', caja).innerHTML = res.map((r) => `<li><span>${esc(r.nombre)}${r.detalle ? `<small>${esc(r.detalle)}</small>` : ''}</span><b>${num(r.valor)} <small>${esc(r.unidad)}</small></b></li>`).join('');
    $('.yu-calc__nota', caja).textContent = t?.nota ?? '';
    caja.style.setProperty('--yu-calc-bg', PASTELES[e.material]);
  };

  caja.addEventListener('input', (ev) => {
    const k = ev.target.dataset.c;
    if (ev.target.name === `${id}-material`) { e.material = ev.target.value; pintarTipos(); }
    else if (ev.target.name === `${id}-modo`) e.modo = ev.target.value;
    else if (k === 'margen') e.margen = ev.target.checked;
    else if (k === 'piezas') e.piezas = Math.max(1, Math.min(500, Math.round(Number(ev.target.value) || 1)));
    else if (k === 'fragancia') e.fragancia = Number(ev.target.value);
    else if (k) e[k] = ev.target.value;
    pintar();
  });
  caja.addEventListener('change', (ev) => { if (ev.target.dataset.c === 'piezas') ev.target.value = e.piezas; });
  caja.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-paso-piezas]');
    if (!b) return;
    e.piezas = Math.max(1, Math.min(500, e.piezas + Number(b.dataset.pasoPiezas)));
    campo('piezas').value = e.piezas;
    pintar();
  });
  pintarTipos();
  pintar();
}

/** Popup con la calculadora (se puede abrir desde cualquier lado). */
export function abrirCalculadora(opciones = {}) {
  let dlg = $('#calc-pop');
  if (!dlg) {
    document.body.insertAdjacentHTML('beforeend', `<dialog class="yu-calc-pop" id="calc-pop" aria-labelledby="calc-pop-titulo">
      <div class="yu-calc-pop__cab">
        <div><p class="yu-etiqueta-seccion">Calculadora de materiales</p><h2 id="calc-pop-titulo"></h2></div>
        <button type="button" class="yu-icono-btn yu-calc-pop__cerrar" aria-label="Cerrar">${icono('cerrar')}</button>
      </div>
      <div id="calc-pop-cuerpo"></div>
    </dialog>`);
    dlg = $('#calc-pop');
    $('.yu-calc-pop__cerrar', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });
    dlg.addEventListener('click', (ev) => { if (ev.target.closest('a[data-link]')) dlg.close(); });
  }
  $('#calc-pop-titulo').textContent = opciones.titulo ?? '¿Cuánto material necesito?';
  pintarCalculadora($('#calc-pop-cuerpo'), { ...opciones, compacta: true });
  dlg.showModal();
  $$('input', dlg).find((i) => i.type === 'number' && !i.value)?.focus();
}
