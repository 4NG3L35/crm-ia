# CRM IA

CRM (Customer Relationship Management) con asistente de IA para administrar productos.

## Tecnologías

- Backend: Node.js, Express 5 y SQLite (`node:sqlite`)
- Frontend: React 19 con Vite
- Chatbot: intérprete de lenguaje natural en español que convierte cada pedido en una consulta SQL. Si existe la variable `ANTHROPIC_API_KEY`, el pedido lo interpreta Claude.

## Funciones

- Login con usuario y password (`admin / admin123`, `ventas / ventas123`)
- Productos: id, producto, categoría, descripción, imagen, estado y precio, con alta, edición, eliminación y búsqueda
- Chatbot conectado a la base de datos:
  - "Trae todos los productos"
  - "Trae los productos cuyo precio > 10"
  - "Trae los productos cuya categoría = teléfonos"
  - "Actualiza todos los precios 10%"
  - "Elimina el producto con id 3"

Cada respuesta del chatbot muestra la sentencia SQL que se ejecutó.

## Cómo ejecutar

Requiere Node.js 22.5 o superior.

```
cd backend
npm install
npm start
```

En otra terminal:

```
cd frontend
npm install
npm run dev
```

Abrir http://localhost:5173

## API

| Método | Ruta | Descripción |
|---|---|---|
| POST | /api/login | Inicia sesión y devuelve un token |
| POST | /api/logout | Cierra la sesión |
| GET | /api/productos | Lista los productos |
| GET | /api/productos/:id | Obtiene un producto |
| POST | /api/productos | Crea un producto |
| PUT | /api/productos/:id | Actualiza un producto |
| DELETE | /api/productos/:id | Elimina un producto |
| POST | /api/chat | Envía un mensaje al chatbot |
