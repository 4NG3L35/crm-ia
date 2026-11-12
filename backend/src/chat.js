import { db } from './db.js';

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const categories = () => db.prepare('SELECT DISTINCT categoria FROM productos').all().map((r) => r.categoria);

function parse(text) {
  const t = norm(text);
  const num = (re) => {
    const m = t.match(re);
    return m ? Number(m[1].replace(',', '.')) : null;
  };

  if (/elimin|borr|quit/.test(t)) {
    const id = num(/(?:id|producto|numero|nro|#)\s*(?:=|:)?\s*(\d+)/) ?? num(/(\d+)/);
    return id ? { action: 'delete', id } : { action: 'help', reason: 'Indica el id del producto a eliminar.' };
  }

  if (/(actualiz|aument|sub|increment|baj|reduc|disminu|descuent).*precio|precio.*(aument|sub|increment|baj|reduc)/.test(t)) {
    const p = num(/(\d+(?:[.,]\d+)?)\s*(?:%|por ?ciento)/) ?? 10;
    return { action: 'update', percent: /baj|reduc|disminu|descuent/.test(t) ? -p : p };
  }

  const filters = [];
  const m = t.match(/precio\s*(?:es\s*)?(>=|<=|>|<|=|mayor(?: o igual)?(?: a| que)?|menor(?: o igual)?(?: a| que)?|mas de|menos de|igual a)\s*(\d+(?:[.,]\d+)?)/);
  if (m) {
    const w = m[1];
    const op = ['>', '<', '>=', '<=', '='].includes(w) ? w
      : w.startsWith('mayor o') ? '>=' : w.startsWith('menor o') ? '<='
      : /mayor|mas/.test(w) ? '>' : /menor|menos/.test(w) ? '<' : '=';
    filters.push({ field: 'precio', op, value: Number(m[2].replace(',', '.')) });
  }
  const cat = categories().find((c) => t.includes(norm(c).replace(/s$/, '')));
  if (cat) filters.push({ field: 'categoria', op: '=', value: cat });
  const st = t.match(/\b(inactivos?|activos?)\b/);
  if (st) filters.push({ field: 'estado', op: '=', value: st[1].startsWith('in') ? 'Inactivo' : 'Activo' });

  if (filters.length || /todo|lista|muestra|mostrar|trae|selecciona|recupera|ver|productos/.test(t)) return { action: 'select', filters };
  return { action: 'help' };
}

async function parseWithClaude(text) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-5-5',
      max_tokens: 300,
      system: `Traduce el pedido a JSON sin texto extra. Tabla productos(id, producto, categoria, descripcion, imagen, estado, precio). Categorías: ${categories().join(', ')}. Formatos: {"action":"select","filters":[{"field":"precio|categoria|estado","op":">|<|>=|<=|=","value":...}]} | {"action":"update","percent":10} | {"action":"delete","id":3} | {"action":"help"}`,
      messages: [{ role: 'user', content: text }],
    }),
  });
  const j = await r.json();
  return JSON.parse(j.content[0].text.match(/\{[\s\S]*\}/)[0]);
}

const all = () => db.prepare('SELECT * FROM productos ORDER BY id').all();

function run(cmd) {
  if (cmd.action === 'select') {
    const f = cmd.filters ?? [];
    const where = f.length ? ' WHERE ' + f.map((x) => `${x.field} ${x.op} ?`).join(' AND ') : '';
    const rows = db.prepare(`SELECT * FROM productos${where} ORDER BY id`).all(...f.map((x) => x.value));
    const shown = where ? ' WHERE ' + f.map((x) => `${x.field} ${x.op} ${typeof x.value === 'number' ? x.value : `'${x.value}'`}`).join(' AND ') : '';
    return { reply: rows.length ? `Encontré ${rows.length} producto(s).` : 'No hay productos que cumplan esa condición.', sql: `SELECT * FROM productos${shown}`, rows };
  }
  if (cmd.action === 'update') {
    const k = +(1 + cmd.percent / 100).toFixed(4);
    const n = db.prepare('UPDATE productos SET precio = ROUND(precio * ?, 2)').run(k).changes;
    return { reply: `Actualicé el precio de ${n} producto(s) en ${cmd.percent > 0 ? '+' : ''}${cmd.percent}%.`, sql: `UPDATE productos SET precio = ROUND(precio * ${k}, 2)`, rows: all(), changed: true };
  }
  if (cmd.action === 'delete') {
    const sql = `DELETE FROM productos WHERE id = ${cmd.id}`;
    const p = db.prepare('SELECT * FROM productos WHERE id = ?').get(cmd.id);
    if (!p) return { reply: `No existe un producto con id ${cmd.id}.`, sql, rows: [] };
    db.prepare('DELETE FROM productos WHERE id = ?').run(cmd.id);
    return { reply: `Eliminé el producto ${cmd.id}: ${p.producto}.`, sql, rows: [p], changed: true };
  }
  return { reply: cmd.reason ?? 'Puedo listar productos, filtrarlos por precio, categoría o estado, actualizar precios en un porcentaje o eliminar por id. Ejemplo: "trae los productos cuyo precio > 10".', rows: [] };
}

export async function chat(text) {
  const cmd = process.env.ANTHROPIC_API_KEY ? await parseWithClaude(text).catch(() => null) : null;
  return run(cmd ?? parse(text));
}
