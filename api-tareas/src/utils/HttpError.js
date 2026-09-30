// Error que además del mensaje guarda el código de estado HTTP.
// Se lanza desde cualquier capa y el middleware de errores lo convierte en respuesta.
export class HttpError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}
