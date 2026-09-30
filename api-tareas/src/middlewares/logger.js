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
