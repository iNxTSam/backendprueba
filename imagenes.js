require('dotenv').config();
const express = require("express"); 
const mysql = require('mysql2');
const conn = require("express-myconnection");
const imageRoutes = require('./routes/image.routes');
const userRoutes = require('./routes/usuario.routes');
const facturaRoutes = require('./routes/factura.routes'); 
const devolucionRoutes = require('./routes/devolucion.routes');
const RecuperarRoutes = require('./routes/recuperar.routes');
const SolicitudRoutes = require('./routes/solicitud.routes');
const path = require("path");

const app = express();

// Ruta estática para acceder a imágenes subidas
const carpetaCarrito = path.join(__dirname, 'carrito');
app.use('/carrito', express.static(carpetaCarrito));

// Middleware para parsear JSON
app.use(express.json());

// ✅ Middleware CORS personalizado para evitar problemas con Azure
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://blue-pebble-0e86f730f.6.azurestaticapps.net',
    'http://localhost:3000'
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Configuración del puerto
app.set("port", process.env.PORT || 5013);

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true
  }
};

// Conexión a la base de datos
app.use(conn(mysql, dbConfig, 'single'));

// Rutas
app.use('/', imageRoutes);
app.use('/', userRoutes); 
app.use('/', facturaRoutes); 
app.use('/', devolucionRoutes);
app.use('/', RecuperarRoutes);
app.use('/', SolicitudRoutes);

// Arrancar el servidor
app.listen(app.get('port'), () => {
  console.log("✅ Servidor funcionando por el puerto", app.get("port"));
});
