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
