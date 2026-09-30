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
