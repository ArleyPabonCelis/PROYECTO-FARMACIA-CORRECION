// Importaciones librerias y rutas
const express = require('express');
const app = express();
const routerDB = require('./routes/routes.js')

// Manejo de variables de entorno
require('dotenv').config();
const port = process.env.PORT;

// Uso de rutas
app.use('/farmacia', routerDB);

// Establecimiento del JSON para manejo general
app.use(express.json());

// Inicializacion de servicio por el puerto 
app.listen(port, () => {
    console.log(`SI FUNCIONA, ESTA EN EL PUERTO ${port}` );
});



