import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const seed = [
  ['iPhone 13 Pro', 'Teléfonos', 'Pantalla 6.1", 128 GB, triple cámara', 'iphone-13-pro', 7599],
  ['Samsung Galaxy S10', 'Teléfonos', 'Pantalla 6.1", 128 GB, 8 GB RAM', 'samsung-galaxy-s10', 4899],
  ['Oppo F19 Pro Plus', 'Teléfonos', '5G, 128 GB, carga rápida 50 W', 'oppo-f19-pro-plus', 2799],
  ['Realme C35', 'Teléfonos', 'Pantalla 6.6", 64 GB, batería 5000 mAh', 'realme-c35', 1049],
  ['Vivo V9', 'Teléfonos', 'Pantalla 6.3", 64 GB, cámara dual', 'vivo-v9', 2099],
  ['MacBook Pro 14', 'Laptops', 'Chip M1 Pro, 16 GB, 512 GB SSD', 'apple-macbook-pro-14-inch-space-grey', 13999],
  ['Lenovo Yoga 920', 'Laptops', 'Core i7, 16 GB, pantalla táctil', 'lenovo-yoga-920', 7699],
  ['iPad Mini 2021', 'Tablets', 'Pantalla 8.3", 64 GB, Wi-Fi', 'ipad-mini-2021-starlight', 3499],
  ['Galaxy Tab S8 Plus', 'Tablets', 'Pantalla 12.4", 128 GB, S Pen', 'samsung-galaxy-tab-s8-plus-grey', 4199],
  ['Apple AirPods', 'Accesorios', 'Audífonos inalámbricos con estuche', 'apple-airpods', 909],
  ['Cargador iPhone', 'Accesorios', 'Cargador USB-C de 20 W', 'apple-iphone-charger', 9.5],
  ['Palo selfie', 'Accesorios', 'Monopié extensible con control Bluetooth', 'selfie-stick-monopod', 8],
];

export const db = new DatabaseSync(fileURLToPath(new URL('../crm.db', import.meta.url)));

db.exec(`CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  imagen TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'Activo',
  precio REAL NOT NULL
)`);

if (db.prepare('SELECT COUNT(*) n FROM productos').get().n === 0) {
  const ins = db.prepare('INSERT INTO productos (producto, categoria, descripcion, imagen, estado, precio) VALUES (?, ?, ?, ?, ?, ?)');
  seed.forEach(([p, c, d, s, pr], i) => ins.run(p, c, d, `/img/${s}.webp`, i === 4 ? 'Inactivo' : 'Activo', pr));
}
