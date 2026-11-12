export async function api(path, { method = 'GET', body, token } = {}) {
  const r = await fetch('/api' + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token && { authorization: 'Bearer ' + token }) },
    body: body && JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error ?? 'Error de conexión');
  return data;
}

export const money = (n) => 'Bs ' + Number(n).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
