import { useState } from 'react';
import Login from './components/Login.jsx';
import Products from './components/Products.jsx';
import Chatbot from './components/Chatbot.jsx';
import { api } from './api.js';

export default function App() {
  const [session, setSession] = useState(() => JSON.parse(sessionStorage.getItem('crm') ?? 'null'));
  const [version, setVersion] = useState(0);

  const login = (s) => {
    sessionStorage.setItem('crm', JSON.stringify(s));
    setSession(s);
  };

  const logout = async () => {
    await api('/logout', { method: 'POST', token: session.token }).catch(() => {});
    sessionStorage.removeItem('crm');
    setSession(null);
  };

  if (!session) return <Login onLogin={login} />;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">CRM</span>
          <div>
            <strong>CRM IA</strong>
            <small>Gestión de productos con asistente inteligente</small>
          </div>
        </div>
        <div className="user">
          <span>{session.usuario}</span>
          <button className="ghost" onClick={logout}>Cerrar sesión</button>
        </div>
      </header>
      <main className="layout">
        <Products token={session.token} version={version} onExpired={logout} />
        <Chatbot token={session.token} onChange={() => setVersion((v) => v + 1)} />
      </main>
    </div>
  );
}
