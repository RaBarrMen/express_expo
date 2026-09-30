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
