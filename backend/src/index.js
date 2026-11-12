import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { chat } from './chat.js';

const app = express();
const users = { admin: 'admin123', ventas: 'ventas123' };
const sessions = new Map();

app.use(cors());
app.use(express.json());
app.use('/img', express.static(fileURLToPath(new URL('../img', import.meta.url))));

app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body ?? {};
  if (!users[usuario] || users[usuario] !== password) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  const token = crypto.randomUUID();
  sessions.set(token, usuario);
  res.json({ token, usuario });
});

app.use('/api', (req, res, next) => {
  const user = sessions.get((req.headers.authorization ?? '').replace('Bearer ', ''));
  if (!user) return res.status(401).json({ error: 'Sesión no válida' });
  req.user = user;
  next();
});

app.post('/api/logout', (req, res) => {
  sessions.delete(req.headers.authorization.replace('Bearer ', ''));
  res.json({ ok: true });
});

const fields = ['producto', 'categoria', 'descripcion', 'imagen', 'estado', 'precio'];
const values = (b) => fields.map((f) => (f === 'precio' ? Number(b[f]) : String(b[f] ?? '').trim()));
const valid = (b) => b?.producto?.trim() && b?.categoria?.trim() && Number(b?.precio) >= 0;
const byId = (id) => db.prepare('SELECT * FROM productos WHERE id = ?').get(id);

app.get('/api/productos', (req, res) => res.json(db.prepare('SELECT * FROM productos ORDER BY id').all()));

app.get('/api/productos/:id', (req, res) => {
  const p = byId(req.params.id);
  p ? res.json(p) : res.status(404).json({ error: 'Producto no encontrado' });
});

app.post('/api/productos', (req, res) => {
  if (!valid(req.body)) return res.status(400).json({ error: 'Producto, categoría y precio son obligatorios' });
  const { lastInsertRowid } = db.prepare(`INSERT INTO productos (${fields}) VALUES (?, ?, ?, ?, ?, ?)`).run(...values(req.body));
  res.status(201).json(byId(lastInsertRowid));
});

app.put('/api/productos/:id', (req, res) => {
  if (!valid(req.body)) return res.status(400).json({ error: 'Producto, categoría y precio son obligatorios' });
  const r = db.prepare(`UPDATE productos SET ${fields.map((f) => f + ' = ?')} WHERE id = ?`).run(...values(req.body), req.params.id);
  r.changes ? res.json(byId(req.params.id)) : res.status(404).json({ error: 'Producto no encontrado' });
});

app.delete('/api/productos/:id', (req, res) => {
  const r = db.prepare('DELETE FROM productos WHERE id = ?').run(req.params.id);
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'Producto no encontrado' });
});

app.post('/api/chat', async (req, res) => {
  const text = String(req.body?.mensaje ?? '').trim();
  if (!text) return res.status(400).json({ error: 'Escribe un mensaje' });
  res.json(await chat(text));
});

app.listen(3000, () => console.log('CRM IA backend en http://localhost:3000'));
