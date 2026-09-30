// server.js: solo inicia el servidor.
import app from './app.js';

const PUERTO = process.env.PORT || 3001;

app.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});
