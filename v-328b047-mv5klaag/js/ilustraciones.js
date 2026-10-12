// Ilustraciones animadas de Yuani (las mismas del tema Shopify: vela con llama, jabón con burbujas, gota de resina…).
// Se usan en las categorías, el menú, el banner y los descuentos. Las animaciones viven en css/yuan.css (.yu-ill__*)
// y se apagan con prefers-reduced-motion.

const DIBUJOS = {
  vela: `<path class="yu-ill__flame" d="M32 11c4 5 5 8 5 10.5a5 5 0 01-10 0C27 19 28.5 15.5 32 11z" fill="var(--yu-ill-sun)"/>
    <path class="yu-ill__flame yu-ill__flame--in" d="M32 17c1.8 2.3 2.3 3.6 2.3 4.7a2.3 2.3 0 01-4.6 0c0-1.1.6-2.6 2.3-4.7z" fill="var(--yu-ill-coral)" stroke="none"/>
    <path d="M32 27v3"/><rect x="23" y="30" width="18" height="24" rx="4" fill="var(--yu-ill-white)"/>
    <path d="M27 30v6a2 2 0 004 0v-2" stroke="var(--yu-ill-accent)"/>`,
  jabon: `<circle class="yu-ill__bubble" cx="24" cy="26" r="4" fill="var(--yu-ill-white)"/>
    <circle class="yu-ill__bubble yu-ill__bubble--2" cx="38" cy="22" r="3" fill="var(--yu-ill-white)"/>
    <circle class="yu-ill__bubble yu-ill__bubble--3" cx="31" cy="16" r="2.2" fill="var(--yu-ill-white)"/>
    <rect x="12" y="34" width="40" height="18" rx="9" fill="var(--yu-ill-white)"/><path d="M22 43h20" stroke="var(--yu-ill-accent)"/>`,
  resina: `<path class="yu-ill__drop" d="M32 10c4 5.5 6 9 6 12a6 6 0 01-12 0c0-3 2-6.5 6-12z" fill="var(--yu-ill-accent)"/>
    <ellipse class="yu-ill__ripple" cx="32" cy="49" rx="12" ry="3.5" stroke="var(--yu-ill-accent)"/>
    <ellipse cx="32" cy="49" rx="18" ry="5.5" fill="var(--yu-ill-white)"/>`,
  yeso: `<g class="yu-ill__sway"><path d="M32 33c0-6 0-10 0-13" stroke="var(--yu-ill-green)" stroke-width="2.4"/>
    <path d="M32 26c-7 0-10-5-10-9 5 0 10 3 10 9z" fill="var(--yu-ill-green)"/><path d="M32 22c6 0 9-4 9-8-5 0-9 3-9 8z" fill="#7fd8cb"/></g>
    <path d="M19 33h26l-3.2 18a3 3 0 01-3 2.5H25.2a3 3 0 01-3-2.5z" fill="var(--yu-ill-white)"/><path d="M17.5 33h29" stroke-width="2.4"/>
    <path d="M23 40.5h18M24.5 46h15" stroke="var(--yu-ill-accent)" stroke-width="1.6"/>
    <path class="yu-ill__twinkle" d="M50 14l1.4 3.8L55 19l-3.6 1.4L50 24l-1.4-3.6L45 19l3.6-1.2z" fill="var(--yu-ill-sun)" stroke="none"/>`,
  bombon: `<g class="yu-ill__rock"><path d="M18 32l-10-8v16zM46 32l10-8v16z" fill="var(--yu-ill-coral)"/>
    <path d="M11 27l4 3M11 37l4-3M53 27l-4 3M53 37l-4-3" stroke-width="1.4"/><ellipse cx="32" cy="32" rx="15" ry="12" fill="var(--yu-ill-coral)"/>
    <path d="M22 25c3 4 3 10 0 14M42 25c-3 4-3 10 0 14" stroke="var(--yu-ill-white)" stroke-width="1.6"/>
    <ellipse cx="32" cy="32" rx="5.5" ry="5" fill="var(--yu-ill-choco)" stroke="none"/><path d="M29.5 29.5c1.5-1 3.5-1 5 0" stroke="var(--yu-ill-white)" stroke-width="1.4"/></g>`,
  reposteria: `<circle class="yu-ill__cherry" cx="32" cy="14" r="4" fill="var(--yu-ill-coral)"/><path d="M17 32c0-7 6-12 15-12s15 5 15 12z" fill="var(--yu-ill-white)"/>
    <path d="M17 32h30l-4 20H21z" fill="var(--yu-ill-accent)"/><path d="M25 32l1.5 20M32 32v20M39 32l-1.5 20" stroke="var(--yu-ill-white)" stroke-width="1.5"/>`,
  fondant: `<rect x="22" y="22" width="20" height="12" rx="3" fill="var(--yu-ill-white)"/><rect x="14" y="34" width="36" height="16" rx="4" fill="var(--yu-ill-white)"/>
    <path d="M14 41c4 3 8-3 12 0s8-3 12 0 8-3 12 0" stroke="var(--yu-ill-coral)"/>
    <path class="yu-ill__twinkle" d="M32 8l1.4 3.8L37 13l-3.6 1.4L32 18l-1.4-3.6L27 13l3.6-1.2z" fill="var(--yu-ill-sun)" stroke="none"/>`,
  navidad: `<path class="yu-ill__star" d="M32 6l2 4.6 5 .4-3.8 3.3 1.2 4.9L32 16.6l-4.4 2.6 1.2-4.9L25 11l5-.4z" fill="var(--yu-ill-sun)"/>
    <path d="M32 18L18 38h7l-9 12h32l-9-12h7z" fill="var(--yu-ill-green)"/><path d="M29 50v5h6v-5"/>
    <circle class="yu-ill__blink" cx="27" cy="34" r="2" fill="var(--yu-ill-coral)" stroke="none"/>
    <circle class="yu-ill__blink yu-ill__blink--2" cx="37" cy="42" r="2" fill="var(--yu-ill-sun)" stroke="none"/>
    <circle class="yu-ill__blink yu-ill__blink--3" cx="30" cy="45" r="2" fill="var(--yu-ill-white)" stroke="none"/>`,
  halloween: `<g class="yu-ill__wobble"><path d="M32 18c-2-4 0-7 4-8"/><ellipse cx="32" cy="36" rx="18" ry="16" fill="#F58A2E"/>
    <path d="M32 20c-5 5-5 27 0 32M32 20c5 5 5 27 0 32"/><path d="M24 32l3-3 3 3zM34 32l3-3 3 3zM25 41c4 3 10 3 14 0" fill="var(--yu-ill-ink)"/></g>`,
  pascuas: `<g class="yu-ill__wobble"><path d="M32 10c9 0 16 13 16 24a16 16 0 01-32 0c0-11 7-24 16-24z" fill="var(--yu-ill-white)"/>
    <path d="M17 33l5-4 5 4 5-4 5 4 5-4 5 4" stroke="var(--yu-ill-coral)"/>
    <circle cx="26" cy="42" r="2" fill="var(--yu-ill-accent)" stroke="none"/><circle cx="38" cy="42" r="2" fill="var(--yu-ill-sun)" stroke="none"/></g>`,
  paleta: `<g class="yu-ill__wobble"><path d="M22 14a10 10 0 0120 0v26H22z" fill="var(--yu-ill-coral)"/>
    <path d="M22 26c4 3 8-3 12 0s6-2 8-1" stroke="var(--yu-ill-white)"/><path d="M29 40h6v14a3 3 0 01-6 0z" fill="var(--yu-ill-sun)"/></g>`,
  tableta: `<g class="yu-ill__float"><path d="M16 14h32v36H24l-8-8z" fill="var(--yu-ill-choco)"/>
    <path d="M16 26h32M16 38h32M32 14v36" stroke="var(--yu-ill-white)" stroke-width="1.5"/></g>
    <path class="yu-ill__twinkle" d="M50 44l1.4 3.8L55 49l-3.6 1.4L50 54l-1.4-3.6L45 49l3.6-1.2z" fill="var(--yu-ill-sun)" stroke="none"/>`,
  insumos: `<path class="yu-ill__twinkle" d="M32 8l1.4 3.8L37 13l-3.6 1.4L32 18l-1.4-3.6L27 13l3.6-1.2z" fill="var(--yu-ill-sun)" stroke="none"/>
    <path class="yu-ill__flap" d="M14 28l-5-7 17-2 6 9z" fill="#f3d9b1"/><path class="yu-ill__flap yu-ill__flap--2" d="M50 28l5-7-17-2-6 9z" fill="#f3d9b1"/>
    <path d="M14 28h36v22a3 3 0 01-3 3H17a3 3 0 01-3-3z" fill="#e8c18c"/><path d="M14 28h36" stroke-width="2.4"/>
    <rect x="23" y="36" width="18" height="8" rx="2" fill="var(--yu-ill-white)" stroke-width="1.6"/><path d="M27 40h10" stroke="var(--yu-ill-accent)" stroke-width="1.6"/>`,
  ofertas: `<g class="yu-ill__swing"><path d="M32 8v6"/><path d="M20 22l12-8 12 8v26a4 4 0 01-4 4H24a4 4 0 01-4-4z" fill="var(--yu-ill-white)"/>
    <circle cx="32" cy="22" r="2.5"/><path d="M26 44l12-12M27 33h.01M37 43h.01" stroke="var(--yu-ill-coral)" stroke-width="3"/></g>`,
  pago: `<g class="yu-ill__float"><rect x="8" y="18" width="40" height="24" rx="4" fill="var(--yu-ill-green)"/><circle cx="28" cy="30" r="6" fill="var(--yu-ill-white)"/>
    <path d="M28 27v6M26.5 28.5h2.5a1.2 1.2 0 010 2.4h-2a1.2 1.2 0 000 2.4h2.5" stroke-width="1.5"/><path d="M13 23h3M40 37h3" stroke="var(--yu-ill-white)"/></g>
    <g class="yu-ill__bounce"><ellipse cx="46" cy="50" rx="9" ry="3.5" fill="var(--yu-ill-sun)"/><path d="M37 50v-4M55 50v-4"/><ellipse cx="46" cy="46" rx="9" ry="3.5" fill="var(--yu-ill-sun)"/></g>`,
  regalo: `<rect x="14" y="30" width="36" height="24" rx="4" fill="var(--yu-ill-coral)"/><path d="M32 30v24" stroke="var(--yu-ill-white)" stroke-width="4"/>
    <g class="yu-ill__lid"><rect x="11" y="22" width="42" height="10" rx="3" fill="var(--yu-ill-coral)"/><path d="M32 22v10" stroke="var(--yu-ill-white)" stroke-width="4"/>
    <path d="M32 22c-3-7-11-9-12-4s7 5 12 4zM32 22c3-7 11-9 12-4s-7 5-12 4z" fill="var(--yu-ill-sun)"/></g>
    <path class="yu-ill__twinkle" d="M52 10l1.2 3.3 3.3 1.2-3.3 1.2L52 19l-1.2-3.3-3.3-1.2 3.3-1.2z" fill="var(--yu-ill-sun)" stroke="none"/>`,
  nuevo: `<path class="yu-ill__spin" d="M32 8l4.5 13.5L50 26l-13.5 4.5L32 44l-4.5-13.5L14 26l13.5-4.5z" fill="var(--yu-ill-sun)"/>
    <path class="yu-ill__twinkle" d="M48 44l1.4 3.8L53 49l-3.6 1.4L48 54l-1.4-3.6L43 49l3.6-1.2z" fill="var(--yu-ill-white)" stroke="none"/>
    <path class="yu-ill__twinkle yu-ill__twinkle--2" d="M16 42l1 2.8 2.8 1-2.8 1-1 2.8-1-2.8-2.8-1 2.8-1z" fill="var(--yu-ill-coral)" stroke="none"/>`,
  sobre: `<rect x="9" y="18" width="46" height="32" rx="5" fill="var(--yu-ill-white)"/><path d="M10.5 20.5 32 37l21.5-16.5"/>
    <path class="yu-ill__bounce" d="M47 8.5c1.6-2.4 5.6-1.4 5.6 1.6 0 2.8-4.2 5.2-5.6 6.4-1.4-1.2-5.6-3.6-5.6-6.4 0-3 4-4 5.6-1.6z" fill="var(--yu-ill-coral)"/>`,
  brillo: `<path class="yu-ill__spin" d="M32 12l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill="var(--yu-ill-white)"/>
    <path class="yu-ill__twinkle" d="M48 12l1.4 3.8L53 17l-3.6 1.4L48 22l-1.4-3.6L43 17l3.6-1.2z" fill="var(--yu-ill-sun)" stroke="none"/>
    <path class="yu-ill__twinkle yu-ill__twinkle--2" d="M16 44l1 2.8 2.8 1-2.8 1-1 2.8-1-2.8-2.8-1 2.8-1z" fill="var(--yu-ill-coral)" stroke="none"/>`,
};

/** SVG de una ilustración (si el nombre no existe, el brillo). */
export const ilustracion = (nombre, clase = '') => `<svg class="yu-ill ${clase}" viewBox="0 0 64 64" fill="none" stroke="var(--yu-ill-ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${DIBUJOS[nombre] ?? DIBUJOS.brillo}</svg>`;

/** Elige la ilustración por el nombre de una categoría o un enlace ("Velas" → vela). */
export function ilustracionDe(texto) {
  const t = String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const reglas = [
    [/vela/, 'vela'], [/jab/, 'jabon'], [/resin/, 'resina'], [/yeso/, 'yeso'], [/bombon|chocolat/, 'bombon'],
    [/reposter|torta|cupcake/, 'reposteria'], [/fondant|porcelana/, 'fondant'], [/navid/, 'navidad'], [/hallow/, 'halloween'],
    [/pascu/, 'pascuas'], [/paleta|helad/, 'paleta'], [/tablet/, 'tableta'], [/insum|cera/, 'insumos'], [/ofert|promo|%/, 'ofertas'],
    [/nuev|ingres/, 'nuevo'], [/pago|transfer/, 'pago'], [/regal|descuent/, 'regalo'], [/tienda|todo|catalog|productos/, 'insumos'], [/contact|habl|consult/, 'sobre'],
  ];
  return reglas.find(([r]) => r.test(t))?.[1] ?? 'brillo';
}

/** Pasteles de los círculos (en orden, se repiten). */
export const PASTELES = ['#FFEDB3', '#E3DBFF', '#D6EEFF', '#BFEDE5', '#FFE1D3'];
