// Descuentos por monto (5% desde $3.500 y 10% desde $6.000 en la tienda original).
// Lógica pura, sin DOM: el carrito, la ficha y el checkout usan estas mismas funciones con los escalones de
// "Textos de la web → Descuentos por monto". El descuento de verdad lo cobra la plataforma con el cupón de cada
// escalón (tiene la misma compra mínima): la web nunca calcula totales, solo muestra el progreso.

/** Escalones válidos, de menor a mayor, con el monto en centésimos. Los mal cargados se ignoran. */
export function leerEscalones(lista) {
  return (Array.isArray(lista) ? lista : [])
    .map((e) => ({
      monto: Math.round(Number(String(e?.monto ?? '').replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.')) * 100),
      porcentaje: Number(String(e?.porcentaje ?? '').replace(',', '.').replace(/[^\d.]/g, '')),
      cupon: String(e?.cupon ?? '').trim().toUpperCase(),
    }))
    .filter((e) => e.monto > 0 && e.porcentaje > 0 && e.porcentaje < 100)
    .sort((a, b) => a.monto - b.monto);
}

/**
 * Dónde está el carrito respecto de los escalones.
 * -> { actual, siguiente, falta, progreso (0..1 hasta el último escalón), niveles: [{ ...escalon, logrado, posicion }] }
 */
export function estadoDescuento(subtotal, escalones) {
  const total = Math.max(0, Number(subtotal) || 0);
  if (!escalones.length) return { actual: null, siguiente: null, falta: 0, progreso: 0, niveles: [] };
  const tope = escalones[escalones.length - 1].monto;
  const logrados = escalones.filter((e) => total >= e.monto);
  const actual = logrados[logrados.length - 1] ?? null;
  const siguiente = escalones.find((e) => total < e.monto) ?? null;
  return {
    actual,
    siguiente,
    falta: siguiente ? siguiente.monto - total : 0,
    progreso: Math.min(1, total / tope),
    niveles: escalones.map((e) => ({ ...e, logrado: total >= e.monto, posicion: e.monto / tope })),
  };
}

/** Cambia [monto] y [porcentaje] en un texto del panel. */
export const completar = (texto, { monto = '', porcentaje = '' } = {}) =>
  String(texto).replaceAll('[monto]', monto).replaceAll('[porcentaje]', String(porcentaje));
