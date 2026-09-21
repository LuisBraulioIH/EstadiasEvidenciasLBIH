const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());


app.get('/', (req, res) => {
  res.send('Servidor simulado corriendo correctamente');
});

app.listen(PORT, () => {
  console.log(`Servidor local corriendo en http://localhost:${PORT}`);
});