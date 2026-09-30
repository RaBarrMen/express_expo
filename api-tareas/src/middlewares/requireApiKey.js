// Middleware de ruta: protege una ruta pidiendo el encabezado x-api-key.
import { HttpError } from '../utils/HttpError.js';

const API_KEY = process.env.API_KEY || 'express2026';

export function requireApiKey(req, res, next) {
  const llave = req.get('x-api-key'); // lee un encabezado de la petición

  if (!llave) return next(new HttpError(401, 'Falta el encabezado x-api-key'));
  if (llave !== API_KEY) return next(new HttpError(403, 'La API key no es válida'));
  next();
}
