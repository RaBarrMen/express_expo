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
