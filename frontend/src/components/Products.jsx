import { useEffect, useState } from 'react';
import { api, money } from '../api.js';

const empty = { producto: '', categoria: '', descripcion: '', imagen: '', estado: 'Activo', precio: '' };

export default function Products({ token, version, onExpired }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  const load = () =>
    api('/productos', { token })
      .then(setItems)
      .catch((e) => (e.message === 'Sesión no válida' ? onExpired() : setError(e.message)));

  useEffect(() => {
    load();
  }, [version]);

  const save = async (e) => {
    e.preventDefault();
    try {
      const { id, ...body } = form;
      await api(id ? `/productos/${id}` : '/productos', { method: id ? 'PUT' : 'POST', body, token });
      setForm(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (p) => {
    if (!confirm(`¿Eliminar "${p.producto}"?`)) return;
    await api(`/productos/${p.id}`, { method: 'DELETE', token });
    load();
  };

  const q = query.toLowerCase();
  const shown = items.filter((p) => [p.id, p.producto, p.categoria, p.descripcion].join(' ').toLowerCase().includes(q));
  const categories = [...new Set(items.map((p) => p.categoria))];
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Productos</h2>
          <small>{items.length} registrados · {items.filter((p) => p.estado === 'Activo').length} activos</small>
        </div>
        <div className="actions">
          <input className="search" placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <button onClick={() => { setError(''); setForm(empty); }}>Nuevo producto</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Id</th><th>Imagen</th><th>Producto</th><th>Categoría</th><th>Descripción</th><th>Estado</th><th className="num">Precio</th><th></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.imagen ? <img src={p.imagen} alt={p.producto} /> : <div className="noimg" />}</td>
                <td><strong>{p.producto}</strong></td>
                <td>{p.categoria}</td>
                <td className="desc">{p.descripcion}</td>
                <td><span className={'badge ' + (p.estado === 'Activo' ? 'on' : 'off')}>{p.estado}</span></td>
                <td className="num">{money(p.precio)}</td>
                <td className="row-actions">
                  <button className="ghost" onClick={() => { setError(''); setForm(p); }}>Editar</button>
                  <button className="ghost danger" onClick={() => remove(p)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr><td colSpan="8" className="empty">Sin productos</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="overlay" onClick={() => setForm(null)}>
          <form className="modal" onSubmit={save} onClick={(e) => e.stopPropagation()}>
            <h3>{form.id ? `Editar producto ${form.id}` : 'Nuevo producto'}</h3>
            <label>Producto<input value={form.producto} onChange={set('producto')} required /></label>
            <div className="grid2">
              <label>
                Categoría
                <input list="cats" value={form.categoria} onChange={set('categoria')} required />
                <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
              </label>
              <label>Precio (Bs)<input type="number" min="0" step="0.01" value={form.precio} onChange={set('precio')} required /></label>
            </div>
            <label>Descripción<textarea rows="2" value={form.descripcion} onChange={set('descripcion')} /></label>
            <div className="grid2">
              <label>Imagen (URL)<input value={form.imagen} onChange={set('imagen')} placeholder="https://..." /></label>
              <label>
                Estado
                <select value={form.estado} onChange={set('estado')}>
                  <option>Activo</option>
                  <option>Inactivo</option>
                </select>
              </label>
            </div>
            {error && <div className="error">{error}</div>}
            <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setForm(null)}>Cancelar</button>
              <button>Guardar</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
