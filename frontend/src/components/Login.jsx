import { useState } from 'react';
import { api } from '../api.js';

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onLogin(await api('/login', { method: 'POST', body: { usuario, password } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <span className="logo big">CRM</span>
        <h1>CRM IA</h1>
        <p>Ingresa con tu cuenta para administrar los productos.</p>
        <label>
          Login
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Usuario" autoFocus required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" required />
        </label>
        {error && <div className="error">{error}</div>}
        <button disabled={busy}>{busy ? 'Ingresando...' : 'Ingresar'}</button>
        <small className="hint">Demo: admin / admin123</small>
      </form>
    </div>
  );
}
