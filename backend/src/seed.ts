import { db, tx } from './db.ts';

// [nombre, descripción, categoría, precio en centavos, stock]
const products: [string, string, string, number, number][] = [
  // Jabones
  ['Jabón de avena y miel', 'Exfoliante suave para piel sensible.', 'jabones', 6500, 30],
  ['Jabón de lavanda', 'Relajante, con aceite esencial de lavanda.', 'jabones', 6500, 25],
  ['Jabón de carbón activado', 'Limpieza profunda para piel grasa.', 'jabones', 7000, 20],
  ['Jabón de café', 'Exfoliante y energizante.', 'jabones', 6500, 15],
  ['Jabón de cúrcuma', 'Ilumina y ayuda a emparejar el tono de la piel.', 'jabones', 7000, 18],
  ['Jabón de rosa mosqueta', 'Regenerador, ideal para marcas y cicatrices.', 'jabones', 7500, 15],
  ['Jabón de aceite de oliva', 'Estilo castilla, 100% oliva. Para toda la familia.', 'jabones', 6000, 30],
  ['Jabón de caléndula', 'Calmante, apto para piel de bebé.', 'jabones', 6500, 20],
  // Cabello
  ['Shampoo sólido de romero', 'Fortalece y estimula el crecimiento.', 'shampoo', 12000, 18],
  ['Shampoo de sábila', 'Hidratación para cabello seco.', 'shampoo', 11000, 12],
  ['Shampoo sólido de ortiga', 'Controla la grasa y la caspa.', 'shampoo', 12000, 14],
  ['Shampoo de manzanilla', 'Suave, realza los reflejos claros.', 'shampoo', 11000, 10],
  ['Acondicionador de coco', 'Suaviza y da brillo.', 'acondicionador', 11500, 10],
  ['Acondicionador sólido de karité y argán', 'Desenreda y nutre puntas maltratadas.', 'acondicionador', 12500, 12],
  // Cremas
  ['Crema corporal de karité', 'Hidratación intensa.', 'cremas', 15000, 14],
  ['Crema facial de rosa mosqueta', 'Ligera, de rápida absorción. Uso diario.', 'cremas', 18000, 10],
  ['Crema de manos de caléndula', 'Repara manos resecas sin sensación grasosa.', 'cremas', 9500, 20],
  ['Mantequilla corporal de cacao', 'Textura batida con aroma a chocolate.', 'cremas', 16000, 12],
  // Cuidado personal
  ['Bálsamo labial de cacao', 'Con manteca de cacao y cera de abeja.', 'cuidado-personal', 4500, 40],
  ['Bálsamo labial de menta', 'Refrescante, con aceite de menta.', 'cuidado-personal', 4500, 30],
  ['Desodorante natural', 'Sin aluminio, con bicarbonato y aceite de coco.', 'cuidado-personal', 9000, 22],
  ['Pasta dental de carbón y menta', 'Blanquea de forma natural, sin flúor.', 'cuidado-personal', 8500, 15],
  // Aceites
  ['Aceite corporal de almendras', 'Prensado en frío. Ideal para masajes.', 'aceites', 14000, 16],
  ['Aceite capilar de ricino y romero', 'Para cejas, pestañas y cabello.', 'aceites', 13000, 14],
  ['Aceite esencial de lavanda', 'Frasco de 10 ml. Para difusor o masaje.', 'aceites', 12000, 20],
  ['Aceite esencial de eucalipto', 'Frasco de 10 ml. Despeja las vías respiratorias.', 'aceites', 11000, 18],
  // Exfoliantes
  ['Exfoliante de café y coco', 'Activa la circulación y suaviza la piel.', 'exfoliantes', 13000, 15],
  ['Exfoliante de azúcar y limón', 'Ilumina y deja la piel tersa.', 'exfoliantes', 12000, 12],
  // Baño
  ['Sales de baño de lavanda', 'Sales de mar con flores secas de lavanda.', 'baño', 11000, 20],
  ['Bombas de baño (3 piezas)', 'Efervescentes, con aceites esenciales.', 'baño', 9000, 25],
  ['Sales de Epsom con eucalipto', 'Relajan los músculos después del ejercicio.', 'baño', 10500, 15],
  // Facial
  ['Mascarilla de arcilla verde', 'Purifica y cierra poros. En polvo, para mezclar.', 'facial', 11000, 15],
  ['Agua de rosas', 'Tónico facial hidratante, 120 ml.', 'facial', 9500, 18],
  // Velas
  ['Vela de soya con lavanda', 'Mecha de algodón, 40 horas de duración.', 'velas', 15000, 10],
  ['Vela de cera de abeja', 'Cera pura, aroma natural a miel.', 'velas', 14000, 8],
];

// --if-empty: solo siembra si la tabla está vacía (lo usa Docker al arrancar)
if (process.argv.includes('--if-empty')) {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM products').get() as { n: number };
  if (n > 0) process.exit(0);
}

// Solo inserta los productos que todavía no existen (por nombre)
const exists = db.prepare('SELECT 1 FROM products WHERE name = ?');
const ins = db.prepare('INSERT INTO products (name, description, category, price, stock) VALUES (?, ?, ?, ?, ?)');

const added = tx(() => {
  let n = 0;
  for (const p of products) {
    if (!exists.get(p[0])) { ins.run(...p); n++; }
  }
  return n;
});
console.log(added ? `✔ ${added} productos nuevos` : 'No hay productos nuevos que agregar');
