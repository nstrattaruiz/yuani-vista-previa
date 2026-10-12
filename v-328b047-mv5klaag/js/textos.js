// Textos de la web editables desde el panel de la plataforma (Textos de la web).
// Esta lista es la ÚNICA fuente de los textos y de la configuración comercial que la web muestra (escalones de
// descuento, % por transferencia): el carrito, la ficha y el checkout leen de acá. El panel guarda solo lo que el
// cliente cambia (info.content.texts) y la web usa el valor de fábrica donde falte.
// panel/textos-yuan.json se genera desde este archivo: node .dev/generar-textos-panel.mjs
// Sin DOM: lo importa también Node.

export const GRUPOS = [
  {
    nombre: 'Portada · banner',
    campos: [
      {
        clave: 'banner.slides', etiqueta: 'Diapositivas del banner', tipo: 'lista',
        sub: 'Tema: menta, durazno, sol, lavanda, cielo o turquesa. Ilustraciones: hasta 3 separadas por coma (vela, jabon, resina, yeso, bombon, reposteria, fondant, navidad, halloween, pascuas, paleta, tableta, insumos, ofertas, nuevo, brillo, pago, regalo). Con foto, la foto reemplaza a las ilustraciones.',
        campos: [
          { clave: 'tema', etiqueta: 'Tema de color', tipo: 'texto' },
          { clave: 'etiqueta', etiqueta: 'Etiqueta chica', tipo: 'texto' },
          { clave: 'titulo', etiqueta: 'Título', tipo: 'titulo' },
          { clave: 'texto', etiqueta: 'Bajada', tipo: 'texto-largo' },
          { clave: 'boton', etiqueta: 'Texto del botón', tipo: 'texto' },
          { clave: 'link', etiqueta: 'Link del botón', tipo: 'ruta' },
          { clave: 'ilustraciones', etiqueta: 'Ilustraciones', tipo: 'texto' },
          { clave: 'imagen', etiqueta: 'Foto (opcional, cuadrada 1200×1200)', tipo: 'ruta' },
        ],
        valor: [
          { tema: 'menta', etiqueta: 'Nueva colección', titulo: 'Moldes navideños', texto: 'Velas, yeso y resina para crear tus regalos de fin de año.', boton: 'Ver colección', link: '/categoria/navidad', ilustraciones: 'navidad, vela, brillo', imagen: '' },
          { tema: 'durazno', etiqueta: 'Solo por tu primera compra', titulo: '15% OFF con PRIMERACOMPRA', texto: 'Usá el cupón al finalizar tu pedido.', boton: 'Comprar ahora', link: '/tienda', ilustraciones: 'ofertas, bombon, nuevo', imagen: '' },
          { tema: 'lavanda', etiqueta: 'Envíos a todo Uruguay', titulo: 'Creá, experimentá, disfrutá', texto: 'Más de 800 moldes para velas, jabones, yeso, resina y repostería.', boton: 'Explorar la tienda', link: '/tienda', ilustraciones: 'jabon, resina, yeso', imagen: '' },
        ],
      },
      { clave: 'banner.segundos', etiqueta: 'Segundos por diapositiva', tipo: 'texto', valor: '6' },
    ],
  },
  {
    nombre: 'Portada · secciones',
    campos: [
      { clave: 'categorias.titulo', etiqueta: 'Fila de categorías: título (vacío = sin título)', tipo: 'texto', valor: '' },
      { clave: 'destacados.etiqueta', etiqueta: 'Destacados: etiqueta chica', tipo: 'texto', valor: 'Elegidos para vos' },
      { clave: 'destacados.titulo', etiqueta: 'Destacados: título', tipo: 'titulo', valor: 'Productos destacados' },
      { clave: 'destacados.etiquetaProducto', etiqueta: 'Destacados: etiqueta de producto que los marca', tipo: 'texto', sub: 'Los productos con esta etiqueta salen primero; si son menos de 6 se completa con los últimos cargados.', valor: 'Destacados' },
      { clave: 'aviso.numero', etiqueta: 'Franja de pago: número grande', tipo: 'texto', valor: '10' },
      { clave: 'aviso.sufijo', etiqueta: 'Franja de pago: después del número', tipo: 'texto', valor: '% OFF' },
      { clave: 'aviso.etiqueta', etiqueta: 'Franja de pago: etiqueta chica', tipo: 'texto', valor: 'Pagá como quieras' },
      { clave: 'aviso.titulo', etiqueta: 'Franja de pago: título', tipo: 'titulo', valor: '10% de descuento pagando con transferencia o en efectivo' },
      { clave: 'aviso.texto', etiqueta: 'Franja de pago: texto', tipo: 'texto-largo', valor: 'Elegí transferencia bancaria o efectivo al finalizar tu compra y te hacemos el 10% de descuento.' },
      { clave: 'nuevos.etiqueta', etiqueta: 'Recién llegados: etiqueta chica', tipo: 'texto', valor: 'Recién llegados' },
      { clave: 'nuevos.titulo', etiqueta: 'Recién llegados: título', tipo: 'titulo', valor: 'Nuevos ingresos' },
      { clave: 'calc.etiqueta', etiqueta: 'Calculadora: etiqueta chica', tipo: 'texto', valor: 'Calculadora' },
      { clave: 'calc.titulo', etiqueta: 'Calculadora: título', tipo: 'titulo', valor: '¿Cuánto material necesito?' },
      { clave: 'calc.texto', etiqueta: 'Calculadora: texto', tipo: 'texto-largo', valor: 'Elegí qué vas a preparar y el tamaño de tu molde: te decimos cuánto yeso, cera, jabón, resina o chocolate usar, con consejos para que salga perfecto.' },
      { clave: 'explorar.etiqueta', etiqueta: 'Explorar: etiqueta chica', tipo: 'texto', valor: 'Encontrá tu molde' },
      { clave: 'explorar.titulo', etiqueta: 'Explorar: título', tipo: 'titulo', valor: 'Explorá por categoría' },
    ],
  },
  {
    nombre: 'Descuentos por monto',
    campos: [
      {
        clave: 'descuentos.escalones', etiqueta: 'Escalones', tipo: 'lista',
        sub: 'Monto en pesos, sin puntos. Cada escalón necesita un cupón creado en el panel (Descuentos) con ese porcentaje y esa compra mínima: la web lo aplica sola en el checkout. Sin cupón, el descuento no se cobra.',
        campos: [
          { clave: 'monto', etiqueta: 'Desde (pesos)', tipo: 'texto' },
          { clave: 'porcentaje', etiqueta: 'Descuento (%)', tipo: 'texto' },
          { clave: 'cupon', etiqueta: 'Código del cupón', tipo: 'texto' },
        ],
        valor: [
          { monto: '3500', porcentaje: '5', cupon: 'YUAN5' },
          { monto: '6000', porcentaje: '10', cupon: 'YUAN10' },
        ],
      },
      { clave: 'descuentos.titulo', etiqueta: 'Título', tipo: 'texto', valor: '¡Cuanto más llevás, más ahorrás!' },
      { clave: 'descuentos.falta', etiqueta: 'Cuando falta (usa [monto] y [porcentaje])', tipo: 'texto', valor: 'Te faltan [monto] para el [porcentaje]% OFF' },
      { clave: 'descuentos.logrado', etiqueta: 'Escalón logrado (usa [porcentaje])', tipo: 'texto', valor: '¡Descuento desbloqueado! Tenés [porcentaje]% OFF' },
      { clave: 'descuentos.maximo', etiqueta: 'Todos los escalones logrados (usa [porcentaje])', tipo: 'texto', valor: '¡Llegaste al máximo: [porcentaje]% OFF!' },
      { clave: 'descuentos.nota', etiqueta: 'Aclaración', tipo: 'texto', valor: 'Se aplica solo al finalizar la compra. No se suma a otros cupones: te dejamos el mejor.' },
      { clave: 'descuentos.ficha', etiqueta: 'En la ficha (usa [monto] y [porcentaje])', tipo: 'texto', valor: 'Sumá [monto] más y llevás [porcentaje]% OFF en toda la compra' },
    ],
  },
  {
    nombre: 'Precio con transferencia',
    campos: [
      { clave: 'pago.transferencia', etiqueta: 'Descuento por transferencia o efectivo (%)', tipo: 'texto', sub: 'Solo informa el precio en las tarjetas y la ficha. El descuento real lo cobra la regla de checkout del panel (Módulos → Reglas de checkout). 0 = no se muestra.', valor: '10' },
      { clave: 'pago.transferenciaTexto', etiqueta: 'Al lado del precio con descuento', tipo: 'texto', valor: 'con transferencia' },
      { clave: 'pago.otrosTexto', etiqueta: 'Al lado del precio normal', tipo: 'texto', valor: 'con Mercado Pago' },
    ],
  },
  {
    nombre: 'Ficha de producto',
    campos: [
      { clave: 'ficha.disponible', etiqueta: 'Hay stock', tipo: 'texto', valor: 'Hay disponibilidad' },
      { clave: 'ficha.disponibleNota', etiqueta: 'Hay stock: nota', tipo: 'texto', valor: 'Listo para enviar' },
      { clave: 'ficha.agotado', etiqueta: 'Sin stock', tipo: 'texto', valor: 'Sin disponibilidad' },
      {
        clave: 'ficha.beneficios', etiqueta: 'Beneficios (filas con ícono)', tipo: 'lista',
        sub: 'Ícono: camion, local, chat, tarjeta, regalo o hoja.',
        campos: [
          { clave: 'icono', etiqueta: 'Ícono', tipo: 'texto' },
          { clave: 'titulo', etiqueta: 'Título', tipo: 'texto' },
          { clave: 'texto', etiqueta: 'Texto', tipo: 'texto' },
        ],
        valor: [
          { icono: 'camion', titulo: 'Envíos a todo Uruguay', texto: 'Despachamos tu pedido en 24 a 48 horas hábiles' },
          { icono: 'local', titulo: 'Retiro coordinado en Brazo Oriental', texto: 'Montevideo · Coordinamos día y hora' },
          { icono: 'chat', titulo: '¿Dudas? Escribinos', texto: 'Te respondemos por WhatsApp' },
        ],
      },
      { clave: 'ficha.envios', etiqueta: 'Envíos y retiros', tipo: 'parrafos', valor: 'Enviamos a todo Uruguay. No tenemos local físico: si preferís retirar, coordinamos por WhatsApp en Brazo Oriental, Montevideo.' },
      { clave: 'ficha.cuidados', etiqueta: 'Cuidado de tus moldes', tipo: 'parrafos', valor: 'Lavalos con agua tibia y jabón neutro, secalos bien y guardalos sin doblar. Así te duran muchísimas creaciones.' },
      { clave: 'ficha.material', etiqueta: 'Material (si el producto no trae uno)', tipo: 'texto', valor: 'Silicona' },
    ],
  },
  {
    nombre: 'Pie de página',
    campos: [
      { clave: 'pie.frase', etiqueta: 'Frase de la marca', tipo: 'texto-largo', valor: 'Fácilmente podés darle vida a todas tus creaciones con nuestros increíbles moldes.' },
      { clave: 'pie.formTitulo', etiqueta: 'Formulario: título', tipo: 'texto', valor: '¿Tenés una consulta?' },
      { clave: 'pie.formTexto', etiqueta: 'Formulario: texto', tipo: 'texto', valor: 'Escribinos y te respondemos por mail o WhatsApp.' },
      { clave: 'pie.nota', etiqueta: 'Al lado del copyright', tipo: 'texto', valor: 'Envíos a todo Uruguay' },
      { clave: 'pie.mediosPago', etiqueta: 'Medios de pago (separados por coma)', tipo: 'texto', valor: 'Mercado Pago, Transferencia, Efectivo' },
    ],
  },
  {
    nombre: 'Checkout',
    campos: [
      { clave: 'checkout.titulo', etiqueta: 'Título', tipo: 'texto', valor: 'Finalizar compra' },
      { clave: 'checkout.horarios', etiqueta: 'Horarios de retiro', tipo: 'lista-texto', sub: 'Se muestran solo cuando eligen un envío de tipo retiro. El elegido llega en el pedido (panel y mails).', valor: ['9:00 a 11:00', '11:00 a 13:00', '13:00 a 15:00', '15:00 a 17:00', '17:00 a 19:00'] },
      { clave: 'checkout.seguridad', etiqueta: 'Nota de seguridad junto al botón de pagar', tipo: 'texto', valor: 'Pagás de forma segura. Con Mercado Pago te llevamos a su página para completar el pago.' },
    ],
  },
];

// Valores de fábrica por clave
const FABRICA = Object.fromEntries(GRUPOS.flatMap((g) => g.campos.map((c) => [c.clave, c.valor])));

/** Devuelve t(clave): el texto del panel si el cliente lo cambió, si no el de fábrica. */
export function crearTextos(cambiados = {}) {
  return (clave) => {
    const v = cambiados?.[clave];
    const f = FABRICA[clave];
    if (Array.isArray(f)) return Array.isArray(v) && v.length ? v : f;
    return typeof v === 'string' && v.trim() !== '' ? v : (f ?? '');
  };
}

/** Lista de campos para cargar en el panel (Textos de la web → Cargar lista de campos). */
export const listaDeCampos = () => ({ grupos: GRUPOS });
