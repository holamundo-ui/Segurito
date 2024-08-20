const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('../')); // Sirve los archivos estáticos

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});