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
