// Calculadora de materiales: cuánto yeso, cera, jabón, resina o chocolate hace falta para un molde, con consejos.
// Se usa en la portada (sección), en /calculadora (página) y en un popup que se abre desde cualquier lado (la ficha la
// abre con las medidas y el material del molde). Los valores son ORIENTATIVOS: el texto lo dice y pide seguir las
// indicaciones del fabricante de cada material. Sin DOM en los datos ni en las cuentas: se pueden probar en Node.

/** Materiales. densidad = g por ml del material ya listo para volcar. */
export const MATERIALES = {
  yeso: {
    nombre: 'Yeso', ill: 'yeso',
    tipos: [
      { id: 'paris', nombre: 'Yeso París / escayola', agua: 0.7, nota: 'Relación habitual 100 g de yeso por 70 ml de agua.' },
      { id: 'ceramico', nombre: 'Yeso cerámico', agua: 0.65, nota: 'Más resistente que el París: 100 g por 65 ml de agua.' },
      { id: 'piedra', nombre: 'Yeso piedra / alta dureza', agua: 0.38, nota: 'Muy duro y con detalle fino: 100 g por 35–40 ml de agua.' },
    ],
    consejos: [
      'Poné siempre el yeso sobre el agua (nunca al revés), espolvoreándolo hasta que deje de hundirse.',
      'Esperá 1–2 minutos a que se hidrate y recién ahí mezclá despacio, sin batir, para no meter aire.',
      'Golpeá suavemente el molde contra la mesa después de volcar: suben las burbujas.',
      'Desmoldá a los 30–60 minutos y dejá secar la pieza 24–48 h antes de pintarla o sellarla.',
      'No tires restos de yeso por la pileta: se endurece en las cañerías.',
    ],
  },
  velas: {
    nombre: 'Velas', ill: 'vela',
    tipos: [
      { id: 'soja', nombre: 'Cera de soja', densidad: 0.9, nota: 'Fundí a 80 °C, agregá la esencia a 80 °C y volcá a 55–60 °C.' },
      { id: 'parafina', nombre: 'Parafina', densidad: 0.9, nota: 'Fundí a 80–85 °C y volcá a 70–75 °C para una superficie lisa.' },
      { id: 'abeja', nombre: 'Cera de abeja', densidad: 0.96, nota: 'Fundí a 70–75 °C a baño María; volcá apenas fundida.' },
    ],
    extra: { fragancia: { etiqueta: 'Esencia', min: 0, max: 12, defecto: 8, unidad: '%', nota: 'Entre 6 y 10% del peso de la cera.' } },
    consejos: [
      'Fundí siempre a baño María o en olla para cera; nunca a fuego directo.',
      'La esencia se mezcla 2 minutos para que se integre a la cera.',
      'Pasá la mecha antes de volcar y sostenela centrada con un palito.',
      'Si se forma un hueco al enfriar, rellenalo con un poco de cera guardada.',
      'Esperá 24 h antes de desmoldar las velas grandes y 1–2 semanas de curado antes de encender las de soja.',
    ],
  },
  jabon: {
    nombre: 'Jabones', ill: 'jabon',
    tipos: [
      { id: 'glicerina', nombre: 'Base de glicerina', densidad: 1.05, nota: 'Fundí a 60–70 °C (nunca hervir) y volcá a 55–60 °C.' },
      { id: 'cabra', nombre: 'Base de leche de cabra', densidad: 1.05, nota: 'Igual que la glicerina, pero más cremosa y opaca.' },
    ],
    extra: { fragancia: { etiqueta: 'Esencia', min: 0, max: 3, defecto: 2, unidad: '%', nota: 'Para la piel, entre 1 y 3% del peso del jabón.' } },
    consejos: [
      'Cortá la base en cubos chicos para que se funda pareja.',
      'Rociá alcohol en la superficie apenas volcás: desaparecen las burbujas.',
      'Colorante: 1 o 2 gotas por cada 100 g alcanzan; siempre aptos para cosmética.',
      'Desmoldá a las 2–3 h y envolvé el jabón en film para que no “transpire”.',
    ],
  },
  resina: {
    nombre: 'Resina', ill: 'resina',
    tipos: [
      { id: 'uno-uno', nombre: 'Epoxi 1:1 (por peso)', densidad: 1.1, partes: [1, 1], nota: 'Partes iguales de A y B, medidas en balanza.' },
      { id: 'dos-uno', nombre: 'Epoxi 2:1 (por peso)', densidad: 1.1, partes: [2, 1], nota: 'Dos partes de A por una de B.' },
      { id: 'colada', nombre: 'Epoxi de colada profunda', densidad: 1.1, partes: [2, 1], nota: 'Para piezas gruesas: se vuelca en una sola capa.' },
    ],
    consejos: [
      'Medí con balanza y respetá la proporción del fabricante: si no, queda pegajosa.',
      'Mezclá 3 minutos raspando bordes y fondo, despacio para no meter aire.',
      'El pigmento no debe pasar el 5% del total.',
      'En piezas de más de 1 cm de alto con resina común, volcá por capas.',
      'Trabajá ventilado y con guantes; desmoldá a las 24–48 h y dejá curar 72 h.',
    ],
  },
  chocolate: {
    nombre: 'Chocolate', ill: 'bombon',
    tipos: [
      { id: 'semiamargo', nombre: 'Chocolate semiamargo', densidad: 1.25, nota: 'Templado: fundir a 45–50 °C, bajar a 27–28 °C y subir a 31–32 °C.' },
      { id: 'leche', nombre: 'Chocolate con leche', densidad: 1.25, nota: 'Templado: 40–45 °C, bajar a 26–27 °C y subir a 29–30 °C.' },
      { id: 'blanco', nombre: 'Chocolate blanco', densidad: 1.25, nota: 'Templado: 40 °C, bajar a 25–26 °C y subir a 28–29 °C.' },
      { id: 'cobertura', nombre: 'Baño de repostería (sin templar)', densidad: 1.2, nota: 'Fundí a 40–45 °C; no necesita templado.' },
    ],
    consejos: [
      'Para bombones rellenos: llená, volteá el molde para dejar solo una capa fina y enfriá antes de rellenar.',
      'El molde tiene que estar limpio y bien seco: una gota de agua arruina el chocolate.',
      'Enfriá 10–15 minutos en la heladera (no freezer) y desmoldá con el molde frío.',
      'Guardá los bombones entre 15 y 18 °C, lejos de la humedad.',
    ],
  },
};

/** Consejos para cuidar los moldes de silicona (para todos los materiales). */
export const CUIDADO_MOLDES = [
  'Lavalos con agua tibia y jabón neutro; nada de esponjas abrasivas ni objetos con punta.',
  'Secalos bien antes de guardarlos y guardalos sin doblar, lejos del sol.',
  'Para yeso, velas, jabón y chocolate no hace falta desmoldante en silicona.',
  'Para resina, usá moldes exclusivos (no los vuelvas a usar con comida).',
  'La silicona aguanta calor, pero no la pongas sobre fuego ni la cortes con cuchillo.',
];

/** Formas para calcular el volumen desde las medidas (el molde rara vez es una caja llena). */
export const FORMAS = [
  { id: 'caja', nombre: 'Rectangular / cuadrada', factor: 1 },
  { id: 'redonda', nombre: 'Redonda / cilindro', factor: Math.PI / 4 },
  { id: 'figura', nombre: 'Figura con relieve', factor: 0.6 },
];

/** Volumen de UNA pieza en ml: medido con agua o calculado desde las medidas (cm) y la forma. */
export function volumen({ modo, ml, largo, ancho, alto, forma }) {
  if (modo === 'agua') return Math.max(0, Number(ml) || 0);
  const f = FORMAS.find((x) => x.id === forma)?.factor ?? 1;
  return Math.max(0, (Number(largo) || 0) * (Number(ancho) || 0) * (Number(alto) || 0) * f);
}

const redondear = (g) => (g >= 100 ? Math.round(g / 5) * 5 : Math.round(g));

/**
 * Cantidades para `piezas` piezas de `ml` cada una (más el margen). Devuelve [{ nombre, valor, unidad, detalle }].
 * Yeso: polvo + agua según la relación agua/yeso (densidad real del yeso en polvo ≈ 2,6 g/ml).
 */
export function calcular({ material, tipo, ml, piezas = 1, margen = 10, fragancia }) {
  const m = MATERIALES[material];
  const t = m?.tipos.find((x) => x.id === tipo) ?? m?.tipos[0];
  const total = Math.max(0, ml) * Math.max(1, Math.round(piezas)) * (1 + (Number(margen) || 0) / 100);
  if (!m || !total) return [];
  if (material === 'yeso') {
    const polvo = total / (t.agua + 1 / 2.6);
    return [
      { nombre: t.nombre, valor: redondear(polvo), unidad: 'g' },
      { nombre: 'Agua', valor: redondear(polvo * t.agua), unidad: 'ml', detalle: 'fría o a temperatura ambiente' },
    ];
  }
  if (material === 'resina') {
    const peso = total * t.densidad;
    const [a, b] = t.partes;
    return [
      { nombre: 'Resina (parte A)', valor: redondear((peso * a) / (a + b)), unidad: 'g' },
      { nombre: 'Endurecedor (parte B)', valor: redondear((peso * b) / (a + b)), unidad: 'g' },
      { nombre: 'Pigmento, como máximo', valor: Math.max(1, Math.round(peso * 0.05)), unidad: 'g', detalle: '5% del total' },
    ];
  }
  const peso = total * t.densidad;
  const out = [{ nombre: t.nombre, valor: redondear(peso), unidad: 'g' }];
  const fr = m.extra?.fragancia;
  if (fr) {
    const pct = Math.min(fr.max, Math.max(fr.min, Number(fragancia ?? fr.defecto)));
    const esencia = (peso * pct) / 100;
    out.push({ nombre: `${fr.etiqueta} (${pct}%)`, valor: esencia >= 10 ? Math.round(esencia) : Math.round(esencia * 10) / 10, unidad: 'g', detalle: `≈ ${Math.max(1, Math.round(esencia / 0.04))} gotas` });
  }
  if (material === 'jabon') out.push({ nombre: 'Colorante', valor: Math.max(1, Math.round(peso / 100) * 2), unidad: 'gotas', detalle: '1–2 por cada 100 g' });
  if (material === 'velas') out.push({ nombre: 'Mechas', valor: Math.max(1, Math.round(piezas)), unidad: 'u.', detalle: 'una por pieza (más gruesa si la vela pasa los 7 cm de ancho)' });
  return out;
}

/** "7.5 x 7.6 cm" / "10 x 10 x 5 cm" → { largo, ancho, alto } (si falta el alto, se deja vacío). */
export function leerMedidas(texto) {
  const n = String(texto ?? '').replace(/,/g, '.').match(/\d+(\.\d+)?/g)?.map(Number) ?? [];
  if (n.length < 2) return null;
  return { largo: n[0], ancho: n[1], alto: n[2] ?? null };
}

/** Material más probable según la categoría o el nombre del molde. */
export function materialDe(texto) {
  const t = String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (/vela/.test(t)) return 'velas';
  if (/jab/.test(t)) return 'jabon';
  if (/resin|lapicer/.test(t)) return 'resina';
  if (/bombon|chocolat|tablet|paleta|reposter/.test(t)) return 'chocolate';
  return 'yeso';
}
