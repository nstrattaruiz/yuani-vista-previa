// Tienda de EJEMPLO para la vista previa en GitHub Pages (no hay plataforma ahí).
// Misma forma que el SDK real (/api/v1/sdk.js) con una muestra de productos reales y carrito/pedidos en el navegador.
// Solo se carga cuando la web corre en *.github.io (ver js/comun.js). El workflow la copia a js/demo/.
// Cupones, envíos y medios de pago imitan lo que se configura en el panel; los montos de envío son de PRUEBA.

const datos = await (await fetch(new URL('./muestra.json', import.meta.url))).json();
const productos = datos.productos;
const categorias = datos.categorias;
const variantePorId = new Map(productos.flatMap((p) => p.variants.map((v) => [v.id, { p, v }])));
const espera = (ms = 120) => new Promise((r) => setTimeout(r, ms + Math.random() * 120));
const eventos = new EventTarget();
class Fallo extends Error { constructor(msg, status = 400) { super(msg); this.status = status; } }

const CUPONES = { YUAN5: { value: 5, min: 350000 }, YUAN10: { value: 10, min: 600000 }, PRIMERACOMPRA: { value: 15, min: 0, unUso: true } };
const ENVIOS = [
  { id: 'envio-uy', name: 'Envío a todo Uruguay', pickup: false, priceCents: 25000, freeOverCents: null, description: 'Despachamos en 24 a 48 horas hábiles (monto de ejemplo)' },
  { id: 'retiro', name: 'Retiro coordinado en Brazo Oriental', pickup: true, priceCents: 0, freeOverCents: null, description: 'Montevideo · Coordinamos día y hora por WhatsApp' },
];
const PAGOS = [
  { method: 'mercadopago', label: 'Mercado Pago', online: true, currency: 'UYU' },
  { method: 'bank_transfer', label: 'Transferencia bancaria', online: false, currency: 'UYU' },
  { method: 'cash', label: 'Efectivo', online: false, currency: 'UYU' },
];
// 10% con transferencia o efectivo, sobre los productos (sin el envío)
const REGLAS = { bank_transfer: '10% pagando con transferencia', cash: '10% pagando en efectivo' };
const INSTRUCCIONES = { bank_transfer: 'Esto es una tienda de ejemplo: acá aparecen los datos de la cuenta que cargue la tienda.', cash: 'Pagás en efectivo al retirar o al recibir tu pedido.' };

const cat = (handle, label) => ({ label, kind: 'category', handle, url: null, children: [] });
const INFO = {
  name: 'Yuani', currency: 'UYU', currencies: ['UYU'], exchangeRate: null, showConverted: false, logo: null, favicon: null, shareImage: null,
  colors: { primary: null, dark: null, light: null },
  seo: { title: 'Yuani · Moldes de silicona (vista previa)', description: 'Vista previa de la web de Yuani con productos de ejemplo.', noindex: true },
  analytics: {}, content: { texts: {} },
  contact: { whatsapp: '097871896', whatsappMessage: '¡Hola! Tengo una consulta sobre un molde', email: 'moldesymasuy@gmail.com', location: 'Montevideo, Uruguay · Retiro coordinado en Brazo Oriental', instagram: 'https://www.instagram.com/yuanimport.uy/' },
  announcement: { text: 'Vista previa con productos de ejemplo · Envíos a todo Uruguay · 10% OFF pagando con transferencia o efectivo', buttonText: null, link: null, style: 'bar' },
  cookies: null,
  legal: [{ kind: 'privacy', title: 'Privacidad' }, { kind: 'terms', title: 'Términos y condiciones' }, { kind: 'returns', title: 'Cambios y devoluciones' }],
  menus: {
    main: [
      { label: 'Tienda', kind: 'catalog', handle: null, url: null, children: ['velas', 'yeso', 'resina', 'jabones', 'bombones', 'reposteria', 'fondant', 'navidad'].map((h) => cat(h, categorias.find((c) => c.handle === h)?.name ?? h)) },
      cat('nuevos-ingresos', 'Nuevos ingresos'), cat('ofertas', 'Ofertas'),
      { label: 'Contacto', kind: 'url', url: '/contacto', children: [] },
    ],
    footer: [
      { label: 'Tienda', kind: 'catalog', url: null, children: [{ label: 'Todos los productos', kind: 'catalog', children: [] }, cat('nuevos-ingresos', 'Nuevos ingresos'), cat('ofertas', 'Ofertas')] },
      { label: 'Ayuda', kind: 'url', url: null, children: [{ label: 'Contacto', kind: 'url', url: '/contacto', children: [] }, { label: 'Cambios y devoluciones', kind: 'url', url: '/legal/returns', children: [] }, { label: 'Favoritos', kind: 'url', url: '/favoritos', children: [] }] },
    ],
  },
  modules: { accounts: true, birthday: false, abandonedCarts: false, reviews: false, erpDocuments: [] },
};

// ------------------------------------------------------------------ carrito y pedidos (en este navegador)
const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
const items = () => leer('yu-demo:carrito', []).filter((it) => variantePorId.has(it.variantId));
function carrito() {
  const lines = items().map((it, i) => {
    const { p, v } = variantePorId.get(it.variantId);
    return { line: i + 1, variantId: v.id, handle: p.handle, title: p.title, variantTitle: v.title || null, quantity: it.quantity, price: v.price, total: v.price * it.quantity, image: p.image, maxQuantity: v.stock };
  });
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  return { currency: 'UYU', itemCount: lines.reduce((s, l) => s + l.quantity, 0), subtotal, total: subtotal, note: '', lines };
}
const avisar = (c) => { eventos.dispatchEvent(new CustomEvent('carrito', { detail: c })); return c; };

function cotizar({ metodoPago, envio, cupon }) {
  const c = carrito();
  if (!c.lines.length) throw new Fallo('Agregá al menos un producto');
  let discount = 0;
  let coupon = null;
  if (cupon) {
    const code = cupon.trim().toUpperCase();
    const cp = CUPONES[code];
    if (!cp) throw new Fallo('El cupón no existe o está desactivado');
    if (c.subtotal < cp.min) throw new Fallo('La compra no llega al mínimo del cupón');
    discount = Math.round((c.subtotal * cp.value) / 100);
    coupon = code;
  }
  const sm = ENVIOS.find((e) => e.id === envio);
  const shipping = sm ? sm.priceCents : 0;
  const adjust = REGLAS[metodoPago] ? -Math.round((c.subtotal - discount) * 0.1) : 0;
  const total = c.subtotal - discount + shipping + adjust;
  return {
    currency: 'UYU', subtotalCents: c.subtotal, discountCents: discount, coupon, shippingCents: shipping, shippingMethod: sm?.name ?? null,
    paymentAdjustCents: adjust, paymentAdjustLabel: REGLAS[metodoPago] ?? null, totalCents: total, taxCents: Math.round((total * 2200) / 12200), pricesIncludeTax: true,
    lines: c.lines.map((l) => ({ variantId: l.variantId, title: l.title, variantTitle: l.variantTitle, quantity: l.quantity, unitPriceCents: l.price, totalCents: l.total })),
  };
}

const clienteOut = (c) => c && ({ name: c.name, email: c.email, phone: c.phone ?? null, document: c.document ?? null, address: c.address ?? null, city: c.city ?? null, wholesale: false, birthDate: null });
function sesion(c) { const out = clienteOut(c); eventos.dispatchEvent(new CustomEvent('cuenta', { detail: out })); return { customer: out }; }
const sin = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const tienda = {
  info: async () => INFO,
  categorias: async () => { await espera(60); return categorias; },
  productos: {
    async listar(f = {}) {
      await espera();
      let lista = [...productos];
      if (f.categoria) lista = lista.filter((p) => p.categories.includes(f.categoria));
      if (f.etiqueta) lista = lista.filter((p) => p.tags.some((t) => sin(t) === sin(f.etiqueta)));
      if (f.soloDisponibles) lista = lista.filter((p) => p.available);
      let suggestions = [];
      if (f.buscar) {
        const palabras = sin(f.buscar).split(/\s+/).filter(Boolean);
        const todos = lista;
        lista = lista.filter((p) => palabras.every((w) => sin(`${p.title} ${p.tags.join(' ')}`).includes(w)));
        if (!lista.length) suggestions = todos.filter((p) => palabras.some((w) => w.length > 3 && sin(p.title).includes(w.slice(0, 4)))).slice(0, 4);
      }
      if (f.orden === 'price-asc') lista.sort((a, b) => a.price - b.price);
      if (f.orden === 'price-desc') lista.sort((a, b) => b.price - a.price);
      if (f.orden === 'title-asc') lista.sort((a, b) => a.title.localeCompare(b.title, 'es'));
      if (f.orden === 'newest') lista.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const porPagina = f.porPagina || 24;
      const pagina = f.pagina || 1;
      return { items: lista.slice((pagina - 1) * porPagina, pagina * porPagina), total: lista.length, page: pagina, pages: Math.max(1, Math.ceil(lista.length / porPagina)), suggestions, facets: { vendors: [], attributes: [] } };
    },
    async uno(handle) {
      await espera();
      const p = productos.find((x) => x.handle === handle);
      if (!p) throw new Fallo('Producto no encontrado', 404);
      return { ...p, related: productos.filter((x) => x !== p && x.categories.some((c) => p.categories.includes(c) && c !== 'nuevos-ingresos')).slice(0, 6) };
    },
    async avisarme() { await espera(); return { ok: true }; },
  },
  carrito: {
    ver: async () => carrito(),
    async agregar(variantId, cantidad = 1) {
      await espera();
      const it = variantePorId.get(variantId);
      if (!it?.v.available) throw new Fallo('Sin stock');
      const lista = items();
      const ya = lista.find((x) => x.variantId === variantId);
      const nueva = (ya?.quantity ?? 0) + cantidad;
      if (nueva > it.v.stock) throw new Fallo(`Solo quedan ${it.v.stock} unidades`);
      if (ya) ya.quantity = nueva; else lista.push({ variantId, quantity: cantidad });
      guardar('yu-demo:carrito', lista);
      return avisar(carrito());
    },
    async cambiar(linea, cantidad) {
      await espera();
      const lista = items();
      const it = lista[linea - 1];
      if (!it) throw new Fallo('Esa línea ya no está en el carrito');
      const { v } = variantePorId.get(it.variantId);
      if (cantidad > v.stock) throw new Fallo(`Solo quedan ${v.stock} unidades`);
      if (cantidad <= 0) lista.splice(linea - 1, 1); else it.quantity = cantidad;
      guardar('yu-demo:carrito', lista);
      return avisar(carrito());
    },
    async vaciar() { guardar('yu-demo:carrito', []); return avisar(carrito()); },
    alCambiar: (fn) => eventos.addEventListener('carrito', (e) => fn(e.detail)),
  },
  checkout: {
    opciones: async () => ({ currency: 'UYU', currencies: ['UYU'], payments: PAGOS, shipping: ENVIOS }),
    async cotizar(d) { await espera(); return cotizar(d); },
    async confirmar(d) {
      await espera(300);
      if (!d.cliente?.nombre?.trim()) throw new Fallo('Falta tu nombre');
      const t = cotizar(d);
      const pedidos = leer('yu-demo:pedidos', {});
      const email = (d.cliente.email || '').toLowerCase();
      if (t.coupon && CUPONES[t.coupon].unUso && Object.values(pedidos).some((o) => o.coupon === t.coupon && o.customerEmail.toLowerCase() === email)) throw new Fallo('Este cupón es de un solo uso y ya lo usaste en otra compra');
      const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const number = 1001 + Object.keys(pedidos).length;
      const pago = PAGOS.find((p) => p.method === d.metodoPago);
      pedidos[token] = { ...t, number, token, createdAt: new Date().toISOString(), coupon: t.coupon, paymentLabel: pago.label, paymentStatus: pago.online ? 'paid' : 'pending', status: 'open', customerEmail: d.cliente.email, instructions: INSTRUCCIONES[pago.method] ?? null, expiresAt: null, shipments: [] };
      guardar('yu-demo:pedidos', pedidos);
      guardar('yu-demo:carrito', []);
      avisar(carrito());
      return { number, token, payUrl: null, instructions: INSTRUCCIONES[pago.method] ?? null, totals: t };
    },
    async pedido(token) {
      await espera();
      const o = leer('yu-demo:pedidos', {})[token];
      if (!o) throw new Fallo('Pedido no encontrado', 404);
      return o;
    },
    contacto: async () => null,
  },
  async contacto(d) { await espera(300); if (!/^\S+@\S+\.\S+$/.test(d.email || '')) throw new Fallo('Escribí un email válido'); return { ok: true }; },
  async legal(tipo) {
    const l = INFO.legal.find((x) => x.kind === tipo);
    if (!l) throw new Fallo('No encontrada', 404);
    return { title: l.title, html: `<p>Texto de ejemplo. En la tienda real se carga desde el panel → Legales.</p>` };
  },
  cuenta: {
    // Cuentas de ejemplo guardadas en este navegador (en la tienda real las maneja la plataforma, con mails y cookie segura)
    async yo() { const e = leer('yu-demo:sesion', null); return e ? clienteOut(leer('yu-demo:clientes', {})[e]) : null; },
    async registrar(d = {}) {
      await espera(300);
      const email = String(d.email ?? '').trim().toLowerCase();
      if (!String(d.nombre ?? '').trim()) throw new Fallo('Escribí tu nombre');
      if (!/^\S+@\S+\.\S+$/.test(email)) throw new Fallo('Revisá el email');
      if (String(d.clave ?? '').length < 8) throw new Fallo('La contraseña tiene que tener 8 caracteres o más');
      const cs = leer('yu-demo:clientes', {});
      if (cs[email]) throw new Fallo('Ya hay una cuenta con ese email: ingresá o elegí "Olvidé mi contraseña"');
      cs[email] = { name: d.nombre.trim(), email, phone: d.telefono || null, clave: d.clave };
      guardar('yu-demo:clientes', cs); guardar('yu-demo:sesion', email);
      return sesion(cs[email]);
    },
    async ingresar(email, clave) {
      await espera(300);
      const c = leer('yu-demo:clientes', {})[String(email).trim().toLowerCase()];
      if (!c || c.clave !== clave) throw new Fallo('El email o la contraseña no coinciden', 401);
      guardar('yu-demo:sesion', c.email);
      return sesion(c);
    },
    async salir() { guardar('yu-demo:sesion', null); return sesion(null); },
    async olvide() { await espera(300); return { ok: true }; },
    async actualizar(d = {}) {
      const e = leer('yu-demo:sesion', null); const cs = leer('yu-demo:clientes', {});
      if (!e) throw new Fallo('Ingresá a tu cuenta', 401);
      Object.assign(cs[e], { name: d.nombre || cs[e].name, phone: d.telefono, document: d.documento, address: d.direccion, city: d.ciudad });
      guardar('yu-demo:clientes', cs);
      return clienteOut(cs[e]);
    },
    async pedidos() {
      const e = leer('yu-demo:sesion', null);
      if (!e) throw new Fallo('Ingresá a tu cuenta', 401);
      return Object.values(leer('yu-demo:pedidos', {})).filter((o) => o.customerEmail.toLowerCase() === e).reverse()
        .map((o) => ({ ...o, fulfillmentStatus: 'unfulfilled' }));
    },
    async repetir(pedido) {
      let agregados = 0; const faltantes = [];
      for (const l of pedido.lines ?? []) { try { await tienda.carrito.agregar(l.variantId, l.quantity); agregados++; } catch { faltantes.push(l.title); } }
      return { agregados, faltantes };
    },
    alCambiar: (fn) => eventos.addEventListener('cuenta', (e) => fn(e.detail)),
  },
  formatear(centesimos, moneda = 'UYU') {
    const n = Number(centesimos || 0) / 100;
    return `${moneda === 'USD' ? 'US$' : '$'} ${moneda === 'USD' ? n.toLocaleString('es-UY', { maximumFractionDigits: 2 }) : Math.round(n).toLocaleString('es-UY')}`;
  },
};
export default tienda;
