import { useEffect, useRef, useState } from 'react';
import { api, money } from '../api.js';

const examples = [
  'Trae todos los productos',
  'Trae los productos cuyo precio > 10',
  'Trae los productos cuya categoría = teléfonos',
  'Actualiza todos los precios 10%',
  'Elimina el producto con id 12',
];

export default function Chatbot({ token, onChange }) {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hola, soy el asistente del CRM. Pídeme consultas o cambios sobre los productos en lenguaje natural.' },
  ]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const send = async (msg) => {
    const m = msg.trim();
    if (!m || busy) return;
    if (/elimin|borr|actualiz|aument|baj/i.test(m) && !confirm(`El asistente va a ejecutar: "${m}". ¿Continuar?`)) return;
    setText('');
    setMessages((x) => [...x, { from: 'me', text: m }]);
    setBusy(true);
    try {
      const r = await api('/chat', { method: 'POST', body: { mensaje: m }, token });
      setMessages((x) => [...x, { from: 'bot', text: r.reply, sql: r.sql, rows: r.rows }]);
      if (r.changed) onChange();
    } catch (e) {
      setMessages((x) => [...x, { from: 'bot', text: e.message }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="panel chat">
      <div className="panel-head">
        <div>
          <h2>Asistente IA</h2>
          <small>Chatbot conectado a la base de datos</small>
        </div>
      </div>
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={'msg ' + m.from}>
            <p>{m.text}</p>
            {m.sql && <code>{m.sql}</code>}
            {m.rows?.length > 0 && (
              <ul className="mini">
                {m.rows.slice(0, 8).map((p) => (
                  <li key={p.id}>
                    <span>#{p.id} {p.producto}</span>
                    <span>{p.categoria}</span>
                    <b>{money(p.precio)}</b>
                  </li>
                ))}
                {m.rows.length > 8 && <li className="more">y {m.rows.length - 8} más...</li>}
              </ul>
            )}
          </div>
        ))}
        {busy && <div className="msg bot typing"><p>Pensando...</p></div>}
        <div ref={end} />
      </div>
      <div className="chips">
        {examples.map((e) => (
          <button key={e} className="chip" onClick={() => send(e)} disabled={busy}>{e}</button>
        ))}
      </div>
      <form className="composer" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe una instrucción..." />
        <button disabled={busy || !text.trim()}>Enviar</button>
      </form>
    </aside>
  );
}
