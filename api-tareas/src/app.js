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
