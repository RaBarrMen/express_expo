# Práctica: API REST con Express.js

**Exposición:** Express.js
**Equipo 4:** Martínez Martínez Uriel Alejandro, Jinez Matehuala Jacquelin, Barranco Mendoza Rafael, Ramírez Vázquez Diego
**Docente:** Grimaldo Aguayo Oscar

---

## Descripción

En esta práctica se construye, paso a paso, una API REST para administrar una lista de tareas utilizando **Express.js**. Durante el desarrollo se aplican los conceptos principales del framework vistos en la exposición:

- Creación de la aplicación y del servidor.
- Rutas con los métodos GET, POST, PUT, PATCH y DELETE.
- Lectura de datos de la petición (`req.params`, `req.query`, `req.body` y encabezados).
- Envío de respuestas (`res.json`, `res.status`, `res.set`, `res.redirect`).
- Middlewares globales, de ruta y de manejo de errores.
- Organización del proyecto en capas: rutas, controladores, servicios y modelos.
- Entrega de archivos estáticos con `express.static`.

Los datos se guardan en memoria, por lo que no se necesita base de datos. npm solo se usa para instalar Express y npx para ejecutar nodemon.

**Tiempo estimado:** 60 a 90 minutos.
**Fecha de entrega:** el mismo día de la exposición. Ver la sección [Entregables](#entregables).

---

## Índice

1. [Contenido del repositorio](#1-contenido-del-repositorio)
2. [Conceptos de Express utilizados](#2-conceptos-de-express-utilizados)
3. [Endpoints de la API](#3-endpoints-de-la-api)
4. [Preparar el entorno](#4-preparar-el-entorno)
5. [Crear el proyecto](#5-crear-el-proyecto)
6. [Primer servidor con Express](#6-primer-servidor-con-express)
7. [Estructura del proyecto](#7-estructura-del-proyecto)
8. [Utilidad HttpError](#8-utilidad-httperror)
9. [Modelo](#9-modelo)
10. [Servicio](#10-servicio)
11. [Controlador](#11-controlador)
12. [Middlewares](#12-middlewares)
13. [Rutas](#13-rutas)
14. [Aplicación: app.js](#14-aplicación-appjs)
15. [Servidor: server.js](#15-servidor-serverjs)
16. [Página estática](#16-página-estática)
17. [Pruebas con curl](#17-pruebas-con-curl)
18. [Actividades a realizar](#18-actividades-a-realizar)
19. [Subir el proyecto a GitHub](#19-subir-el-proyecto-a-github)
20. [Problemas comunes](#20-problemas-comunes)
21. [Entregables](#entregables)

---

## 1. Contenido del repositorio

```
expo4_express/
├── README.md             Esta guía
└── solucion/
    └── api-tareas/       Proyecto terminado, solo para consulta
```

La práctica se realiza **desde cero** siguiendo esta guía. La carpeta `solucion` sirve para comparar el código en caso de errores. Para ejecutarla:

```bash
cd solucion/api-tareas
npm install
npm run dev
```

---

## 2. Conceptos de Express utilizados

| Concepto | Descripción | Dónde se usa |
|---|---|---|
| `express()` | Crea la aplicación. Sobre ella se registran middlewares y rutas. | `app.js` |
| `app.listen()` | Inicia el servidor HTTP en un puerto. | `server.js` |
| Ruta | Combinación de método HTTP + URL + función que responde. | `tareas.routes.js` |
| `Router()` | Agrupa rutas relacionadas en un archivo independiente. | `tareas.routes.js` |
| `req` | Objeto con los datos de la petición: parámetros, query, body, encabezados. | Controladores y middlewares |
| `res` | Objeto para construir y enviar la respuesta. | Controladores |
| Middleware | Función `(req, res, next)` que se ejecuta entre la petición y la respuesta. | Carpeta `middlewares` |
| `next()` | Pasa el control al siguiente middleware o ruta. `next(error)` envía el error al manejador de errores. | Middlewares |
| Middleware de errores | Función con cuatro parámetros `(err, req, res, next)` que centraliza los errores. | `errores.js` |
| `express.json()` | Middleware integrado que convierte el body JSON en `req.body`. | `app.js` |
| `express.static()` | Middleware integrado que entrega archivos (HTML, CSS, imágenes) de una carpeta. | `app.js` |

### Flujo de una petición

```
Cliente
   |
   v
app.js  ->  Middlewares globales (logger, express.json, express.static)
   |
   v
Rutas (tareas.routes.js)  ->  Middlewares de ruta (router.param, validarTarea, requireApiKey)
   |
   v
Controlador  ->  Servicio  ->  Modelo  ->  Datos en memoria
   |
   v
Respuesta al cliente

Si ocurre un error en cualquier punto  ->  Middleware de errores  ->  Respuesta con el código de error
```

### Responsabilidad de cada capa

| Capa | Responsabilidad | ¿Conoce `req` y `res`? |
|---|---|---|
| Rutas | Indicar qué función atiende cada método y URL. | Sí |
| Middlewares | Validar, registrar, proteger o transformar la petición. | Sí |
| Controlador | Obtener los datos de la petición, llamar al servicio y responder. | Sí |
| Servicio | Aplicar la lógica de negocio (reglas del sistema). | No |
| Modelo | Leer y guardar los datos. | No |

---

## 3. Endpoints de la API

| Método | URL | Descripción | Código correcto |
|---|---|---|---|
| GET | `/` | Página HTML (archivo estático) | 200 |
| GET | `/inicio` | Redirige a `/` | 302 |
| GET | `/api` | Información de la API | 200 |
| GET | `/api/error` | Provoca un error a propósito | 500 |
| GET | `/api/tareas` | Lista las tareas. Filtros opcionales: `?completada=true` y `?prioridad=alta` | 200 |
| GET | `/api/tareas/resumen` | Total de tareas, completadas y pendientes | 200 |
| GET | `/api/tareas/:id` | Obtiene una tarea | 200 |
| POST | `/api/tareas` | Crea una tarea | 201 |
| PUT | `/api/tareas/:id` | Reemplaza una tarea | 200 |
| PATCH | `/api/tareas/:id/completar` | Marca una tarea como completada | 200 |
| DELETE | `/api/tareas/:id` | Elimina una tarea. Requiere el encabezado `x-api-key` | 204 |

Estructura de una tarea:

```json
{
  "id": 1,
  "titulo": "Estudiar Express",
  "prioridad": "alta",
  "completada": false
}
```

`prioridad` acepta los valores `baja`, `media` o `alta`.

---

## 4. Preparar el entorno

La práctica está probada en **WSL con Debian 13**. Se requiere Node.js 20 o superior.

### 4.1 Verificar Node.js y npm

```bash
node -v
npm -v
```

Si ambos comandos muestran una versión (Node 20 o mayor), continuar con el paso 5.

### 4.2 Instalar Node.js (solo si no está instalado)

```bash
sudo apt update
sudo apt install -y curl git
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
source ~/.bashrc
nvm install --lts
node -v
```

### 4.3 Revisar que el puerto 3000 esté libre

Si se realizó la práctica de monitoreo, Grafana puede estar usando el puerto 3000. Para revisarlo:

```bash
sudo ss -ltnp | grep :3000
```

Si aparece algún proceso, existen dos opciones:

- Detener Grafana: `sudo systemctl stop grafana-server`
- Usar otro puerto al iniciar la API: `PORT=3001 npm run dev` (en ese caso, cambiar `3000` por `3001` en todas las pruebas).

### 4.4 Alternativa con Docker

Quien trabaje con Docker puede abrir un contenedor con Node.js y ejecutar dentro los mismos comandos de la guía, omitiendo `sudo` y `nvm`:

```bash
mkdir -p ~/api-tareas && cd ~/api-tareas
docker run -it --rm -p 3000:3000 -v "$PWD":/app -w /app node:22 bash
```

En este caso, en el paso 5.1 se omiten los comandos `mkdir` y `cd`, porque la carpeta de trabajo ya es `/app`.

---

## 5. Crear el proyecto

### 5.1 Inicializar el proyecto con npm

```bash
cd ~
mkdir api-tareas
cd api-tareas
npm init -y
```

`npm init -y` crea el archivo `package.json`, donde se registran el nombre del proyecto, sus scripts y sus dependencias.

### 5.2 Instalar Express

```bash
npm install express@5
```

Express es la única dependencia del proyecto. Se descarga en la carpeta `node_modules` y queda registrada en `package.json`. Se usa la versión 5, la más reciente.

### 5.3 Configurar package.json

```bash
npm pkg set type=module
npm pkg set scripts.start="node src/server.js"
npm pkg set scripts.dev="npx nodemon src/server.js"
npm pkg delete scripts.test
cat package.json
```

El archivo debe quedar similar al siguiente (la versión de Express puede variar):

```json
{
  "name": "api-tareas",
  "version": "1.0.0",
  "description": "",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "npx nodemon src/server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^5.2.1"
  },
  "type": "module"
}
```

- `"type": "module"` permite usar `import` y `export` en lugar de `require`.
- `npm start` ejecuta el servidor con Node.
- `npm run dev` ejecuta el servidor con **nodemon** mediante **npx**. nodemon reinicia el servidor cada vez que se guarda un archivo. Como se ejecuta con npx, no es necesario instalarlo en el proyecto: npx lo descarga y lo ejecuta. La primera vez preguntará `Ok to proceed? (y)`; se responde `y`.

---

## 6. Primer servidor con Express

Antes de construir la API completa se crea un servidor mínimo para entender la base de Express.

```bash
mkdir src
```

Crear el archivo `src/server.js` con el siguiente contenido. **Este archivo es temporal** y se reemplazará en el paso 15.

```js
import express from 'express';

const app = express();

// Ruta GET a la raíz. res.send envía texto o HTML.
app.get('/', (req, res) => {
  res.send('<h1>Hola desde Express</h1>');
});

// Parámetro de ruta (:nombre) y parámetro de consulta (?curso=...)
app.get('/saludo/:nombre', (req, res) => {
  res.json({
    mensaje: `Hola ${req.params.nombre}`,
    curso: req.query.curso ?? 'sin curso',
  });
});

// res.status cambia el código de estado de la respuesta
app.get('/privado', (req, res) => {
  res.status(403).json({ error: 'No tienes permiso' });
});

app.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});
```

Explicación:

- `express()` crea la aplicación.
- `app.get(ruta, manejador)` registra una ruta para el método GET. El manejador recibe `req` (petición) y `res` (respuesta).
- `req.params` contiene los parámetros definidos en la URL con `:`. En `/saludo/Diego`, `req.params.nombre` vale `"Diego"`.
- `req.query` contiene los valores escritos después de `?`. En `/saludo/Diego?curso=web`, `req.query.curso` vale `"web"`.
- `res.send()` envía texto o HTML. `res.json()` envía un objeto convertido a JSON.
- `app.listen(puerto)` inicia el servidor.

Iniciar el servidor:

```bash
npm run dev
```

Abrir **otra terminal** de WSL y probar:

```bash
curl http://localhost:3000
curl "http://localhost:3000/saludo/Diego?curso=web"
curl -i http://localhost:3000/privado
```

Respuestas esperadas:

```
<h1>Hola desde Express</h1>
{"mensaje":"Hola Diego","curso":"web"}
HTTP/1.1 403 Forbidden ... {"error":"No tienes permiso"}
```

La opción `-i` de curl muestra también el código de estado y los encabezados de la respuesta.

Con el servidor encendido, cambiar el texto del `<h1>` y guardar el archivo. En la terminal aparecerá `[nodemon] restarting due to changes...` y el cambio se verá sin reiniciar manualmente.

Detener el servidor con `Ctrl + C`.

---

## 7. Estructura del proyecto

Crear las carpetas del proyecto:

```bash
mkdir -p src/routes src/controllers src/services src/models src/middlewares src/utils public
```

Estructura final:

```
api-tareas/
├── package.json
├── public/
│   └── index.html                  Página que consume la API
└── src/
    ├── server.js                   Inicia el servidor
    ├── app.js                      Configura la aplicación
    ├── routes/
    │   └── tareas.routes.js        Rutas de las tareas
    ├── controllers/
    │   └── tareas.controller.js    Recibe peticiones y responde
    ├── services/
    │   └── tareas.service.js       Lógica de negocio
    ├── models/
    │   └── tarea.model.js          Acceso a los datos
    ├── middlewares/
    │   ├── logger.js               Registro de peticiones
    │   ├── validarTarea.js         Validación del body
    │   ├── requireApiKey.js        Protección con API key
    │   └── errores.js              Ruta no encontrada y manejo de errores
    └── utils/
        └── HttpError.js            Error con código HTTP
```

Los archivos se crean en el orden de los siguientes pasos: primero las capas internas (modelo y servicio) y al final las que dependen de Express directamente (rutas y app).

---

## 8. Utilidad HttpError

Archivo `src/utils/HttpError.js`:

```js
// Error que además del mensaje guarda el código de estado HTTP.
// Se lanza desde cualquier capa y el middleware de errores lo convierte en respuesta.
export class HttpError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}
```

Un error normal de JavaScript solo tiene mensaje. Esta clase agrega la propiedad `status` para indicar qué código HTTP debe responder la API (400, 401, 404, etc.). Cualquier capa puede lanzar un `HttpError` y el middleware de errores (paso 12.4) lo convierte en la respuesta final.

---

## 9. Modelo

Archivo `src/models/tarea.model.js`:

```js
// Modelo: única capa que sabe dónde están los datos.
// En esta práctica se guardan en memoria (se reinician al reiniciar el servidor).
let tareas = [
  { id: 1, titulo: 'Estudiar Express', prioridad: 'alta', completada: false },
  { id: 2, titulo: 'Preparar la exposición', prioridad: 'alta', completada: true },
  { id: 3, titulo: 'Subir la práctica a GitHub', prioridad: 'media', completada: false },
];
let siguienteId = 4;

export function obtenerTodas() {
  return tareas;
}

export function obtenerPorId(id) {
  return tareas.find((tarea) => tarea.id === id) ?? null;
}

export function crear(datos) {
  const tarea = { id: siguienteId++, ...datos };
  tareas.push(tarea);
  return tarea;
}

export function actualizar(id, datos) {
  const indice = tareas.findIndex((tarea) => tarea.id === id);
  if (indice === -1) return null;
  tareas[indice] = { ...tareas[indice], ...datos, id };
  return tareas[indice];
}

export function eliminar(id) {
  const cantidadAntes = tareas.length;
  tareas = tareas.filter((tarea) => tarea.id !== id);
  return tareas.length < cantidadAntes;
}
```

El modelo es la única capa que sabe dónde están los datos. En este caso es un arreglo en memoria. Si después se quisiera usar MariaDB, solo se modificaría este archivo y el resto del proyecto seguiría igual.

Las funciones regresan `null` o `false` cuando no encuentran la tarea; el servicio decide qué hacer en ese caso.

---

## 10. Servicio

Archivo `src/services/tareas.service.js`:

```js
// Servicio: contiene la lógica de negocio.
// No usa req ni res, por lo que no depende de Express ni de HTTP.
import * as Tarea from '../models/tarea.model.js';
import { HttpError } from '../utils/HttpError.js';

export function listar({ completada, prioridad }) {
  let tareas = Tarea.obtenerTodas();

  if (completada !== undefined) {
    const valor = completada === 'true';
    tareas = tareas.filter((tarea) => tarea.completada === valor);
  }
  if (prioridad) {
    tareas = tareas.filter((tarea) => tarea.prioridad === prioridad);
  }
  return tareas;
}

export function resumen() {
  const tareas = Tarea.obtenerTodas();
  const completadas = tareas.filter((tarea) => tarea.completada).length;
  return {
    total: tareas.length,
    completadas,
    pendientes: tareas.length - completadas,
  };
}

export function obtener(id) {
  const tarea = Tarea.obtenerPorId(id);
  if (!tarea) throw new HttpError(404, `No existe la tarea con id ${id}`);
  return tarea;
}

export function crear({ titulo, prioridad = 'media' }) {
  return Tarea.crear({ titulo, prioridad, completada: false });
}

export function reemplazar(id, { titulo, prioridad, completada }) {
  const tarea = Tarea.actualizar(id, { titulo, prioridad, completada: Boolean(completada) });
  if (!tarea) throw new HttpError(404, `No existe la tarea con id ${id}`);
  return tarea;
}

export function completar(id) {
  const tarea = Tarea.actualizar(id, { completada: true });
  if (!tarea) throw new HttpError(404, `No existe la tarea con id ${id}`);
  return tarea;
}

export function eliminar(id) {
  const eliminada = Tarea.eliminar(id);
  if (!eliminada) throw new HttpError(404, `No existe la tarea con id ${id}`);
}
```

El servicio contiene las reglas del sistema:

- `listar` aplica los filtros recibidos. Los valores de `req.query` siempre llegan como texto, por eso se compara `completada === 'true'`.
- `crear` asigna la prioridad `media` si no se envía y siempre crea la tarea como no completada.
- Cuando una tarea no existe, lanza `new HttpError(404, ...)`.

Esta capa **no usa `req` ni `res`**, por lo que no depende de Express. Eso permite reutilizarla y probarla por separado.

---

## 11. Controlador

Archivo `src/controllers/tareas.controller.js`:

```js
// Controlador: recibe la petición (req), llama al servicio y envía la respuesta (res).
import * as servicio from '../services/tareas.service.js';

// GET /api/tareas?completada=true&prioridad=alta
export function listar(req, res) {
  const tareas = servicio.listar(req.query);
  res.set('X-Total-Count', String(tareas.length)); // encabezado personalizado
  res.json(tareas);
}

// GET /api/tareas/resumen
export function resumen(req, res) {
  res.json(servicio.resumen());
}

// GET /api/tareas/:id
export function obtener(req, res) {
  res.json(servicio.obtener(req.idTarea));
}

// POST /api/tareas
export function crear(req, res) {
  const tarea = servicio.crear(req.body);
  res.status(201).json(tarea);
}

// PUT /api/tareas/:id
export function reemplazar(req, res) {
  res.json(servicio.reemplazar(req.idTarea, req.body));
}

// PATCH /api/tareas/:id/completar
export function completar(req, res) {
  res.json(servicio.completar(req.idTarea));
}

// DELETE /api/tareas/:id
export function eliminar(req, res) {
  servicio.eliminar(req.idTarea);
  res.status(204).end();
}
```

Cada función del controlador recibe `req` y `res`, obtiene los datos necesarios de la petición, llama al servicio y envía la respuesta.

Datos de la petición utilizados:

| Propiedad | Ejemplo | Valor recibido |
|---|---|---|
| `req.params` | `GET /api/tareas/2` | `{ id: '2' }` |
| `req.query` | `GET /api/tareas?prioridad=alta` | `{ prioridad: 'alta' }` |
| `req.body` | `POST /api/tareas` con JSON | `{ titulo: '...', prioridad: '...' }` |
| `req.get('encabezado')` | Encabezado `x-api-key: express2026` | `'express2026'` |
| `req.idTarea` | Propiedad agregada por `router.param` (paso 13) | `2` (número) |

Métodos de respuesta utilizados:

| Método | Función | Ejemplo en el proyecto |
|---|---|---|
| `res.json(objeto)` | Envía JSON con código 200 | `listar`, `obtener` |
| `res.status(código)` | Define el código de estado | `res.status(201)` al crear |
| `res.set(nombre, valor)` | Agrega un encabezado a la respuesta | `X-Total-Count` en `listar` |
| `res.end()` | Termina la respuesta sin contenido | `res.status(204).end()` al eliminar |
| `res.redirect(url)` | Redirige a otra URL (código 302) | Ruta `/inicio` en `app.js` |

Los controladores no tienen `try/catch`. Cuando el servicio lanza un error, **Express lo captura automáticamente** y lo envía al middleware de errores.

---

## 12. Middlewares

Un middleware es una función con la forma `(req, res, next)` que se ejecuta antes de llegar al controlador. Puede:

- Revisar o modificar la petición.
- Responder directamente y detener el flujo.
- Llamar a `next()` para continuar con el siguiente middleware o ruta.
- Llamar a `next(error)` para enviar un error al middleware de errores.

Si un middleware no responde ni llama a `next()`, la petición se queda esperando indefinidamente.

Tipos de middleware en la práctica:

| Tipo | Cómo se registra | Se ejecuta en | Ejemplos |
|---|---|---|---|
| Global | `app.use(middleware)` | Todas las peticiones | `logger`, `express.json()`, `express.static()` |
| De ruta | Como argumento de una ruta | Solo esa ruta | `validarTarea`, `requireApiKey` |
| De parámetro | `router.param('id', ...)` | Rutas que tengan `:id` | Validación del id |
| De errores | `app.use((err, req, res, next) => ...)` | Cuando hay un error | `manejadorErrores` |

### 12.1 Logger

Archivo `src/middlewares/logger.js`:

```js
// Middleware global: muestra en consola cada petición y el tiempo que tardó.
export function logger(req, res, next) {
  const inicio = Date.now();

  // El evento 'finish' ocurre cuando la respuesta ya se envió
  res.on('finish', () => {
    const duracion = Date.now() - inicio;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${duracion} ms)`);
  });

  next();
}
```

Se registra de forma global. Guarda la hora de inicio, llama a `next()` para que la petición continúe y, cuando la respuesta termina (evento `finish`), imprime el método, la URL, el código de estado y el tiempo de respuesta.

### 12.2 Validación de la tarea

Archivo `src/middlewares/validarTarea.js`:

```js
// Middleware de ruta: revisa el body antes de que llegue al controlador.
import { HttpError } from '../utils/HttpError.js';

const PRIORIDADES = ['baja', 'media', 'alta'];

export function validarTarea(req, res, next) {
  const { titulo, prioridad } = req.body ?? {};

  if (!titulo || typeof titulo !== 'string') {
    return next(new HttpError(400, 'El campo titulo es obligatorio y debe ser texto'));
  }
  if (prioridad && !PRIORIDADES.includes(prioridad)) {
    return next(new HttpError(400, `prioridad debe ser: ${PRIORIDADES.join(', ')}`));
  }
  next();
}
```

Se usa en las rutas POST y PUT. Si el `titulo` falta o la `prioridad` no es válida, envía un error 400 con `next(new HttpError(...))` y el controlador nunca se ejecuta.

### 12.3 Protección con API key

Archivo `src/middlewares/requireApiKey.js`:

```js
// Middleware de ruta: protege una ruta pidiendo el encabezado x-api-key.
import { HttpError } from '../utils/HttpError.js';

const API_KEY = process.env.API_KEY || 'express2026';

export function requireApiKey(req, res, next) {
  const llave = req.get('x-api-key'); // lee un encabezado de la petición

  if (!llave) return next(new HttpError(401, 'Falta el encabezado x-api-key'));
  if (llave !== API_KEY) return next(new HttpError(403, 'La API key no es válida'));
  next();
}
```

Se usa solo en la ruta DELETE. Lee el encabezado `x-api-key` con `req.get()`:

- Si no existe, responde **401 Unauthorized** (no se identificó).
- Si es incorrecta, responde **403 Forbidden** (se identificó, pero no tiene permiso).
- Si es correcta, llama a `next()` y se ejecuta el controlador.

La llave por defecto es `express2026` y se puede cambiar con la variable de entorno `API_KEY`.

### 12.4 Manejo de errores

Archivo `src/middlewares/errores.js`:

```js
// Se ejecuta cuando ninguna ruta respondió a la petición.
export function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: `La ruta ${req.method} ${req.originalUrl} no existe` });
}

// Middleware de errores: Express lo identifica porque tiene 4 parámetros.
// Recibe los errores enviados con next(err) o lanzados con throw.
export function manejadorErrores(err, req, res, next) {
  const status = err.status ?? 500;

  if (status === 500) console.error('Error interno:', err.message);

  res.status(status).json({
    error: status === 500 ? 'Error interno del servidor' : err.message,
  });
}
```

- `rutaNoEncontrada` se registra después de todas las rutas. Si la petición llega hasta aquí, ninguna ruta coincidió y se responde 404.
- `manejadorErrores` tiene **cuatro parámetros**; así Express sabe que es un middleware de errores. Toma el `status` del error (o 500 si no tiene) y responde en formato JSON. En errores 500 no se muestra el mensaje real al cliente por seguridad; solo se imprime en la consola del servidor.

---

## 13. Rutas

Archivo `src/routes/tareas.routes.js`:

```js
// Rutas: relacionan un método HTTP y una URL con uno o varios manejadores.
import { Router } from 'express';
import * as controlador from '../controllers/tareas.controller.js';
import { validarTarea } from '../middlewares/validarTarea.js';
import { requireApiKey } from '../middlewares/requireApiKey.js';
import { HttpError } from '../utils/HttpError.js';

const router = Router();

// router.param se ejecuta automáticamente en toda ruta que tenga :id
router.param('id', (req, res, next, id) => {
  if (!/^\d+$/.test(id)) {
    return next(new HttpError(400, `El id "${id}" no es un número válido`));
  }
  req.idTarea = Number(id); // se guarda para usarlo en el controlador
  next();
});

// Las rutas fijas van antes de las rutas con parámetros
router.get('/resumen', controlador.resumen);

router.route('/')
  .get(controlador.listar)
  .post(validarTarea, controlador.crear);

router.route('/:id')
  .get(controlador.obtener)
  .put(validarTarea, controlador.reemplazar)
  .delete(requireApiKey, controlador.eliminar);

router.patch('/:id/completar', controlador.completar);

export default router;
```

Explicación:

- `Router()` crea un grupo de rutas independiente. En `app.js` se monta en `/api/tareas`, por lo que la ruta `'/'` del router corresponde a `/api/tareas` y `'/:id'` a `/api/tareas/:id`.
- `router.param('id', ...)` se ejecuta antes de cualquier ruta que tenga `:id`. Valida que sea un número y lo guarda convertido en `req.idTarea`. Así la validación no se repite en cada controlador.
- `router.route('/')` permite encadenar varios métodos sobre la misma URL (`.get()`, `.post()`, etc.).
- Una ruta puede recibir varios manejadores: en `.post(validarTarea, controlador.crear)` primero se ejecuta la validación y después el controlador.
- **El orden importa.** `/resumen` se declara antes que `/:id`; de lo contrario, Express interpretaría la palabra `resumen` como un id.

---

## 14. Aplicación: app.js

Archivo `src/app.js`:

```js
// app.js: crea la aplicación y registra middlewares y rutas en orden.
import express from 'express';
import tareasRoutes from './routes/tareas.routes.js';
import { logger } from './middlewares/logger.js';
import { rutaNoEncontrada, manejadorErrores } from './middlewares/errores.js';

const app = express();

// 1. Middlewares globales
app.use(logger);
app.use(express.json());
app.use(express.static('public'));

// 2. Rutas generales
app.get('/api', (req, res) => {
  res.json({
    nombre: 'API de tareas con Express',
    rutas: ['/api/tareas', '/api/tareas/resumen', '/api/tareas/:id'],
  });
});

app.get('/inicio', (req, res) => {
  res.redirect('/');
});

app.get('/api/error', async () => {
  throw new Error('Error de prueba lanzado a propósito');
});

// 3. Rutas de tareas
app.use('/api/tareas', tareasRoutes);

// 4. Manejo de errores (siempre al final)
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

export default app;
```

Express ejecuta los middlewares y rutas **en el orden en que se registran**:

1. **Middlewares globales.** `logger` registra todas las peticiones, `express.json()` convierte el body en `req.body` y `express.static('public')` entrega los archivos de la carpeta `public`. Si se omite `express.json()`, `req.body` llega como `undefined`.
2. **Rutas generales.** `/api` responde información, `/inicio` muestra el uso de `res.redirect()` y `/api/error` lanza un error dentro de una función `async`. En Express 5 los errores de funciones `async` se envían automáticamente al middleware de errores; en Express 4 era necesario atraparlos con `try/catch` y llamar a `next(err)`.
3. **Rutas de tareas.** `app.use('/api/tareas', tareasRoutes)` monta el router con ese prefijo.
4. **Manejo de errores.** Siempre al final: primero la ruta no encontrada y después el manejador de errores.

---

## 15. Servidor: server.js

Reemplazar todo el contenido de `src/server.js`:

```js
// server.js: solo inicia el servidor.
import app from './app.js';

const PUERTO = process.env.PORT || 3000;

app.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});
```

Se separa en dos archivos: `app.js` configura la aplicación y `server.js` solo la inicia. El puerto se toma de la variable de entorno `PORT` y, si no existe, se usa 3000.

Iniciar el servidor:

```bash
npm run dev
```

Salida esperada:

```
Servidor escuchando en http://localhost:3000
```

Para usar otro puerto:

```bash
PORT=3001 npm run dev
```

---

## 16. Página estática

La API incluye una interfaz web que permite usarla desde el navegador. No forma parte del tema de Express, por lo que solo se copia; lo importante es entender que **Express la entrega con `express.static('public')`** sin necesidad de definir una ruta.

La página realiza peticiones a la API con `fetch` y muestra:

- **Contadores** de tareas totales, pendientes y completadas (`GET /api/tareas/resumen`).
- **Formulario** para crear tareas (`POST /api/tareas`).
- **Filtros** por estado y prioridad, que se envían como parámetros de consulta (`GET /api/tareas?completada=false&prioridad=alta`).
- **Tarjetas** de colores según la prioridad, con los botones:
  - Completar (`PATCH /api/tareas/:id/completar`)
  - Editar (`PUT /api/tareas/:id`)
  - Eliminar (`DELETE /api/tareas/:id`), que envía el encabezado `x-api-key` escrito en el campo "API key".
- **Mensajes** de éxito y de error con el código y el texto que responde la API (por ejemplo, `400: El campo titulo es obligatorio y debe ser texto`).
- **Registro de peticiones** con el método, la URL y el código de estado de cada petición realizada.

### 16.1 Crear el archivo

Existen dos formas:

**Opción A.** Copiarlo desde la solución del repositorio (si se clonó o descargó en `~/expo4_express`):

```bash
cp ~/expo4_express/solucion/api-tareas/public/index.html public/
```

**Opción B.** Crear el archivo `public/index.html` y pegar el siguiente contenido:

<details>
<summary>Ver el código de public/index.html</summary>

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Gestor de tareas - Express</title>
  <style>
    :root {
      --fondo: #f3f4f6;
      --tarjeta: #ffffff;
      --texto: #1f2937;
      --tenue: #6b7280;
      --borde: #e5e7eb;
      --primario: #2563eb;
      --alta: #dc2626;
      --media: #d97706;
      --baja: #16a34a;
      --exito: #16a34a;
      --error: #dc2626;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      background: var(--fondo);
      color: var(--texto);
    }
    header {
      background: #111827;
      color: #fff;
      padding: 24px 16px;
    }
    header div, main { max-width: 900px; margin: 0 auto; }
    header h1 { margin: 0 0 4px; font-size: 1.6rem; }
    header p { margin: 0; color: #9ca3af; font-size: .9rem; }
    main { padding: 24px 16px 48px; }
    .panel {
      background: var(--tarjeta);
      border: 1px solid var(--borde);
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .panel h2 { margin: 0 0 12px; font-size: 1rem; }

    /* Resumen */
    .resumen { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    .contador {
      background: var(--tarjeta);
      border: 1px solid var(--borde);
      border-radius: 10px;
      padding: 14px 16px;
    }
    .contador span { display: block; color: var(--tenue); font-size: .8rem; }
    .contador strong { font-size: 1.8rem; }

    /* Formularios */
    .fila { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    input, select, button {
      font: inherit;
      padding: 8px 12px;
      border: 1px solid var(--borde);
      border-radius: 6px;
      background: #fff;
    }
    input[type="text"] { flex: 1; min-width: 200px; }
    button { cursor: pointer; }
    .btn-primario { background: var(--primario); border-color: var(--primario); color: #fff; font-weight: 600; }
    .btn-exito { color: var(--exito); border-color: var(--exito); }
    .btn-peligro { color: var(--error); border-color: var(--error); }
    button:hover { filter: brightness(.95); }
    label { font-size: .85rem; color: var(--tenue); }

    /* Lista de tareas */
    .tareas { display: grid; gap: 10px; }
    .tarea {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--tarjeta);
      border: 1px solid var(--borde);
      border-left: 6px solid var(--media);
      border-radius: 8px;
      padding: 12px 14px;
    }
    .tarea.alta { border-left-color: var(--alta); }
    .tarea.media { border-left-color: var(--media); }
    .tarea.baja { border-left-color: var(--baja); }
    .tarea .info { flex: 1; }
    .tarea .titulo { font-weight: 600; }
    .tarea.completada .titulo { text-decoration: line-through; color: var(--tenue); }
    .tarea .detalle { font-size: .8rem; color: var(--tenue); margin-top: 2px; }
    .etiqueta {
      display: inline-block;
      padding: 1px 8px;
      border-radius: 999px;
      font-size: .75rem;
      color: #fff;
      margin-right: 6px;
    }
    .etiqueta.alta { background: var(--alta); }
    .etiqueta.media { background: var(--media); }
    .etiqueta.baja { background: var(--baja); }
    .acciones { display: flex; gap: 6px; }
    .acciones button { padding: 6px 10px; font-size: .85rem; }
    .vacio { text-align: center; color: var(--tenue); padding: 24px; }

    /* Mensajes */
    .mensaje {
      display: none;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: .9rem;
    }
    .mensaje.exito { display: block; background: #dcfce7; color: #166534; }
    .mensaje.error { display: block; background: #fee2e2; color: #991b1b; }

    /* Registro de peticiones */
    .registro {
      background: #111827;
      color: #d1d5db;
      font-family: ui-monospace, Consolas, monospace;
      font-size: .8rem;
      border-radius: 8px;
      padding: 12px;
      max-height: 180px;
      overflow-y: auto;
      margin: 0;
      list-style: none;
    }
    .registro li { padding: 2px 0; }
    .registro .ok { color: #4ade80; }
    .registro .fallo { color: #f87171; }

    @media (max-width: 600px) {
      .resumen { grid-template-columns: 1fr; }
      .tarea { flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Gestor de tareas</h1>
      <p>Página entregada por express.static('public') que consume la API REST con fetch</p>
    </div>
  </header>

  <main>
    <!-- Resumen: GET /api/tareas/resumen -->
    <section class="resumen">
      <div class="contador"><span>Total</span><strong id="total">0</strong></div>
      <div class="contador"><span>Pendientes</span><strong id="pendientes">0</strong></div>
      <div class="contador"><span>Completadas</span><strong id="completadas">0</strong></div>
    </section>

    <div id="mensaje" class="mensaje"></div>

    <!-- Crear: POST /api/tareas -->
    <section class="panel">
      <h2>Nueva tarea</h2>
      <form id="formulario" class="fila">
        <input type="text" id="titulo" placeholder="Título de la tarea">
        <select id="prioridad">
          <option value="baja">Prioridad baja</option>
          <option value="media" selected>Prioridad media</option>
          <option value="alta">Prioridad alta</option>
        </select>
        <button type="submit" class="btn-primario">Agregar</button>
      </form>
    </section>

    <!-- Filtros: GET /api/tareas?completada=...&prioridad=... -->
    <section class="panel">
      <h2>Filtros y configuración</h2>
      <div class="fila">
        <label for="filtro-estado">Estado</label>
        <select id="filtro-estado">
          <option value="">Todas</option>
          <option value="false">Pendientes</option>
          <option value="true">Completadas</option>
        </select>
        <label for="filtro-prioridad">Prioridad</label>
        <select id="filtro-prioridad">
          <option value="">Todas</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
        <label for="api-key">API key (para eliminar)</label>
        <input type="text" id="api-key" value="express2026" style="max-width: 150px">
      </div>
    </section>

    <!-- Lista de tareas -->
    <section class="tareas" id="lista"></section>

    <!-- Registro de peticiones hechas a la API -->
    <section class="panel" style="margin-top: 16px">
      <h2>Peticiones realizadas a la API</h2>
      <ul class="registro" id="registro"></ul>
    </section>
  </main>

  <script>
    const API = '/api/tareas';

    // Realiza la petición, la anota en el registro y lanza un error si la API responde con error
    async function peticion(metodo, url, body, encabezados = {}) {
      const opciones = { method: metodo, headers: { ...encabezados } };
      if (body) {
        opciones.headers['Content-Type'] = 'application/json';
        opciones.body = JSON.stringify(body);
      }

      const respuesta = await fetch(url, opciones);
      anotar(metodo, url, respuesta.status, respuesta.ok);

      if (respuesta.status === 204) return null;
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(`${respuesta.status}: ${datos.error}`);
      return datos;
    }

    function anotar(metodo, url, status, ok) {
      const li = document.createElement('li');
      const hora = new Date().toLocaleTimeString();
      li.textContent = `[${hora}] ${metodo} ${url} -> `;
      const codigo = document.createElement('span');
      codigo.className = ok ? 'ok' : 'fallo';
      codigo.textContent = status;
      li.append(codigo);
      document.getElementById('registro').prepend(li);
    }

    function mostrarMensaje(texto, tipo) {
      const caja = document.getElementById('mensaje');
      caja.textContent = texto;
      caja.className = `mensaje ${tipo}`;
      clearTimeout(mostrarMensaje.temporizador);
      mostrarMensaje.temporizador = setTimeout(() => (caja.className = 'mensaje'), 4000);
    }

    async function cargarResumen() {
      const resumen = await peticion('GET', `${API}/resumen`);
      document.getElementById('total').textContent = resumen.total;
      document.getElementById('pendientes').textContent = resumen.pendientes;
      document.getElementById('completadas').textContent = resumen.completadas;
    }

    async function cargarTareas() {
      const parametros = new URLSearchParams();
      const estado = document.getElementById('filtro-estado').value;
      const prioridad = document.getElementById('filtro-prioridad').value;
      if (estado) parametros.set('completada', estado);
      if (prioridad) parametros.set('prioridad', prioridad);

      const url = parametros.toString() ? `${API}?${parametros}` : API;
      const tareas = await peticion('GET', url);
      pintarTareas(tareas);
    }

    function pintarTareas(tareas) {
      const lista = document.getElementById('lista');
      lista.innerHTML = '';

      if (tareas.length === 0) {
        lista.innerHTML = '<div class="vacio">No hay tareas con estos filtros.</div>';
        return;
      }

      for (const tarea of tareas) {
        const tarjeta = document.createElement('article');
        tarjeta.className = `tarea ${tarea.prioridad}${tarea.completada ? ' completada' : ''}`;

        const info = document.createElement('div');
        info.className = 'info';
        const titulo = document.createElement('div');
        titulo.className = 'titulo';
        titulo.textContent = tarea.titulo;
        const detalle = document.createElement('div');
        detalle.className = 'detalle';
        detalle.innerHTML = `<span class="etiqueta ${tarea.prioridad}">${tarea.prioridad}</span>` +
          `id ${tarea.id} - ${tarea.completada ? 'completada' : 'pendiente'}`;
        info.append(titulo, detalle);

        const acciones = document.createElement('div');
        acciones.className = 'acciones';
        if (!tarea.completada) {
          acciones.append(boton('Completar', 'btn-exito', () => completar(tarea.id)));
        }
        acciones.append(boton('Editar', '', () => editar(tarea)));
        acciones.append(boton('Eliminar', 'btn-peligro', () => eliminar(tarea.id)));

        tarjeta.append(info, acciones);
        lista.append(tarjeta);
      }
    }

    function boton(texto, clase, accion) {
      const b = document.createElement('button');
      b.textContent = texto;
      b.className = clase;
      b.addEventListener('click', accion);
      return b;
    }

    async function refrescar() {
      try {
        await Promise.all([cargarResumen(), cargarTareas()]);
      } catch (error) {
        mostrarMensaje(error.message, 'error');
      }
    }

    // POST /api/tareas
    document.getElementById('formulario').addEventListener('submit', async (evento) => {
      evento.preventDefault();
      try {
        const tarea = await peticion('POST', API, {
          titulo: document.getElementById('titulo').value.trim(),
          prioridad: document.getElementById('prioridad').value,
        });
        document.getElementById('titulo').value = '';
        mostrarMensaje(`Tarea ${tarea.id} creada correctamente`, 'exito');
        refrescar();
      } catch (error) {
        mostrarMensaje(error.message, 'error');
      }
    });

    // PATCH /api/tareas/:id/completar
    async function completar(id) {
      try {
        await peticion('PATCH', `${API}/${id}/completar`);
        mostrarMensaje(`Tarea ${id} completada`, 'exito');
        refrescar();
      } catch (error) {
        mostrarMensaje(error.message, 'error');
      }
    }

    // PUT /api/tareas/:id
    async function editar(tarea) {
      const nuevoTitulo = prompt('Nuevo título de la tarea:', tarea.titulo);
      if (nuevoTitulo === null) return;
      try {
        await peticion('PUT', `${API}/${tarea.id}`, {
          titulo: nuevoTitulo.trim(),
          prioridad: tarea.prioridad,
          completada: tarea.completada,
        });
        mostrarMensaje(`Tarea ${tarea.id} actualizada`, 'exito');
        refrescar();
      } catch (error) {
        mostrarMensaje(error.message, 'error');
      }
    }

    // DELETE /api/tareas/:id (requiere el encabezado x-api-key)
    async function eliminar(id) {
      if (!confirm(`¿Eliminar la tarea ${id}?`)) return;
      const llave = document.getElementById('api-key').value.trim();
      const encabezados = llave ? { 'x-api-key': llave } : {};
      try {
        await peticion('DELETE', `${API}/${id}`, null, encabezados);
        mostrarMensaje(`Tarea ${id} eliminada`, 'exito');
        refrescar();
      } catch (error) {
        mostrarMensaje(error.message, 'error');
      }
    }

    document.getElementById('filtro-estado').addEventListener('change', refrescar);
    document.getElementById('filtro-prioridad').addEventListener('change', refrescar);

    refrescar();
  </script>
</body>
</html>
```

</details>

### 16.2 Probar la interfaz

Con el servidor encendido, abrir **http://localhost:3000** en el navegador de Windows y realizar lo siguiente:

1. Crear una tarea con prioridad alta.
2. Intentar crear una tarea con el título vacío y observar el mensaje de error 400 generado por el middleware `validarTarea`.
3. Completar una tarea y observar cómo cambian los contadores.
4. Editar el título de una tarea.
5. Cambiar la API key por un valor incorrecto e intentar eliminar una tarea: debe aparecer el error 403 generado por `requireApiKey`. Después, escribir `express2026` y eliminarla.
6. Usar los filtros de estado y prioridad.

Cada acción aparece en dos lugares:

- En el **registro de peticiones** de la página (lado del cliente).
- En la **terminal del servidor**, registrada por el middleware `logger` (lado del servidor):

```
GET / -> 200 (5 ms)
GET /api/tareas -> 200 (2 ms)
GET /api/tareas/resumen -> 200 (1 ms)
POST /api/tareas -> 201 (3 ms)
POST /api/tareas -> 400 (1 ms)
PATCH /api/tareas/4/completar -> 200 (1 ms)
DELETE /api/tareas/3 -> 403 (1 ms)
DELETE /api/tareas/3 -> 204 (1 ms)
```

También se pueden revisar las peticiones en las herramientas de desarrollo del navegador (tecla F12, pestaña Red o Network).

---

## 17. Pruebas con curl

Con el servidor encendido, abrir otra terminal y guardar la URL base en una variable:

```bash
API=http://localhost:3000/api/tareas
```

**Nota:** los datos están en memoria. Cada vez que el servidor se reinicia (por ejemplo, cuando nodemon detecta un cambio), las tareas vuelven a las tres iniciales. Realizar las pruebas en orden y sin modificar archivos mientras tanto.

### 17.1 Información de la API y redirección

```bash
curl http://localhost:3000/api
curl -i http://localhost:3000/inicio
```

La segunda respuesta debe mostrar `HTTP/1.1 302 Found` y `Location: /`.

### 17.2 Listar tareas (GET)

```bash
curl -i $API
```

Además del JSON, revisar el encabezado `X-Total-Count: 3`, agregado con `res.set()`.

### 17.3 Filtrar con parámetros de consulta (req.query)

```bash
curl "$API?completada=false"
curl "$API?prioridad=alta"
curl "$API?completada=false&prioridad=alta"
```

La última debe regresar solo la tarea 1.

### 17.4 Resumen (orden de las rutas)

```bash
curl $API/resumen
```

Respuesta esperada:

```json
{"total":3,"completadas":1,"pendientes":2}
```

### 17.5 Obtener una tarea (req.params)

```bash
curl $API/2
```

### 17.6 Crear una tarea (POST y req.body)

```bash
curl -i -X POST $API \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Repasar middlewares","prioridad":"alta"}'
```

Respuesta esperada: `HTTP/1.1 201 Created` y la tarea con `"id":4`.

- `-X POST` indica el método.
- `-H "Content-Type: application/json"` indica que el body es JSON. Sin este encabezado, `express.json()` no procesa el body.
- `-d` contiene el body.

### 17.7 Reemplazar una tarea (PUT)

```bash
curl -X PUT $API/4 \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Repasar middlewares y rutas","prioridad":"media","completada":false}'
```

### 17.8 Completar una tarea (PATCH)

```bash
curl -X PATCH $API/4/completar
```

La respuesta debe mostrar `"completada":true`.

PUT reemplaza la tarea completa; PATCH modifica solo una parte.

### 17.9 Eliminar una tarea (DELETE y middleware de ruta)

```bash
# Sin API key: 401
curl -i -X DELETE $API/4

# API key incorrecta: 403
curl -i -X DELETE $API/4 -H "x-api-key: 12345"

# API key correcta: 204
curl -i -X DELETE $API/4 -H "x-api-key: express2026"
```

### 17.10 Errores

```bash
# Tarea inexistente: 404
curl -i $API/99

# id no numérico (router.param): 400
curl -i $API/abc

# Falta el titulo (validarTarea): 400
curl -i -X POST $API -H "Content-Type: application/json" -d '{"prioridad":"alta"}'

# Prioridad inválida (validarTarea): 400
curl -i -X POST $API -H "Content-Type: application/json" -d '{"titulo":"Prueba","prioridad":"urgente"}'

# JSON mal formado (express.json): 400
curl -i -X POST $API -H "Content-Type: application/json" -d '{"titulo":'

# Ruta inexistente (rutaNoEncontrada): 404
curl -i http://localhost:3000/otra-ruta

# Error dentro de una función async (Express 5): 500
curl -i http://localhost:3000/api/error
```

Resumen de códigos obtenidos:

| Código | Significado | Prueba |
|---|---|---|
| 200 | OK | 17.2, 17.5, 17.7, 17.8 |
| 201 | Creado | 17.6 |
| 204 | Sin contenido | 17.9 |
| 302 | Redirección | 17.1 |
| 400 | Petición incorrecta | 17.10 |
| 401 | No autenticado | 17.9 |
| 403 | Sin permiso | 17.9 |
| 404 | No encontrado | 17.10 |
| 500 | Error interno | 17.10 |

---

## 18. Actividades a realizar

Una vez que la API funcione, realizar las siguientes modificaciones. Cada una aplica un concepto de Express y debe probarse con curl.

### Actividad 1: middleware global

Crear el archivo `src/middlewares/marcarRespuesta.js` con un middleware que agregue a **todas** las respuestas el encabezado `X-Equipo` con el nombre del alumno. Registrarlo en `app.js` con `app.use()`.

Prueba:

```bash
curl -i http://localhost:3000/api
```

Debe aparecer el encabezado `X-Equipo`.

Pistas: usar `res.set()` y no olvidar `next()`.

### Actividad 2: nueva ruta con parámetros de consulta

Agregar la ruta `GET /api/tareas/buscar?texto=...` que regrese las tareas cuyo título contenga el texto indicado, sin importar mayúsculas o minúsculas. Si no se envía `texto`, debe responder 400.

Prueba:

```bash
curl "http://localhost:3000/api/tareas/buscar?texto=express"
curl -i "http://localhost:3000/api/tareas/buscar"
```

Pistas: crear la función en el servicio y en el controlador. Declarar la ruta **antes** de `/:id`.

### Actividad 3: nuevo router

Crear un segundo recurso `usuarios` con su propio router en `src/routes/usuarios.routes.js`, con las rutas:

- `GET /api/usuarios`: lista los usuarios (arreglo en memoria con al menos dos usuarios con `id` y `nombre`).
- `POST /api/usuarios`: crea un usuario y responde 201. Si falta `nombre`, responde 400.

Montarlo en `app.js` con `app.use('/api/usuarios', usuariosRoutes)`.

Prueba:

```bash
curl http://localhost:3000/api/usuarios
curl -i -X POST http://localhost:3000/api/usuarios -H "Content-Type: application/json" -d '{"nombre":"Rafael"}'
```

---

## 19. Subir el proyecto a GitHub

1. Crear en GitHub un repositorio vacío llamado `api-tareas-express`.
2. Dentro de la carpeta del proyecto, crear el archivo `.gitignore` para no subir las dependencias:

```bash
cd ~/api-tareas
echo "node_modules/" > .gitignore
```

3. Subir el proyecto:

```bash
git init
git add .
git commit -m "Práctica API REST con Express"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/api-tareas-express.git
git push -u origin main
```

Quien descargue el repositorio solo necesita ejecutar `npm install` para recuperar Express.

---

## 20. Problemas comunes

| Problema | Causa | Solución |
|---|---|---|
| `EADDRINUSE: address already in use :::3000` | Otro programa usa el puerto (por ejemplo, Grafana). | `sudo systemctl stop grafana-server` o `PORT=3001 npm run dev`. |
| `Cannot use import statement outside a module` | Falta `"type": "module"`. | `npm pkg set type=module`. |
| `ERR_MODULE_NOT_FOUND` | Ruta incorrecta en un `import` o falta la extensión. | Los archivos propios se importan con `.js`, por ejemplo `'./app.js'`. |
| `req.body` es `undefined` | Falta `express.json()` o el encabezado `Content-Type`. | Revisar `app.js` y agregar `-H "Content-Type: application/json"` en curl. |
| `/api/tareas/resumen` responde que el id no es válido | La ruta `/resumen` está después de `/:id`. | Declararla antes. |
| La petición se queda cargando | Un middleware no llama a `next()` ni responde. | Revisar que todos los middlewares terminen con `next()` o con una respuesta. |
| La página de `/` muestra 404 | El servidor se inició desde otra carpeta o no existe `public/index.html`. | Iniciar el servidor desde la carpeta `api-tareas`. |
| Las tareas creadas desaparecen | Los datos están en memoria y el servidor se reinició. | Es el comportamiento esperado; repetir las pruebas en orden. |
| `nvm: command not found` | La terminal no recargó la configuración. | `source ~/.bashrc`. |

---

## Entregables

Entregar el mismo día un archivo PDF llamado `Express_NombreApellido.pdf` con:

1. Captura de `node -v` y `npm -v`.
2. Captura del archivo `package.json`.
3. Capturas de la página `http://localhost:3000` mostrando una tarea creada, un mensaje de error y el registro de peticiones.
4. Captura de la terminal del servidor mostrando las peticiones registradas por el logger.
5. Capturas de las pruebas del paso 17 donde se vean los códigos 200, 201, 204, 302, 400, 401, 403, 404 y 500.
6. Capturas de las pruebas de las tres actividades del paso 18.
7. Liga al repositorio de GitHub.

---

## Referencias

- Documentación de Express: https://expressjs.com/es/
- Enrutamiento: https://expressjs.com/es/guide/routing.html
- Uso de middlewares: https://expressjs.com/es/guide/using-middleware.html
- Manejo de errores: https://expressjs.com/es/guide/error-handling.html
- Migración a Express 5: https://expressjs.com/en/guide/migrating-5.html
