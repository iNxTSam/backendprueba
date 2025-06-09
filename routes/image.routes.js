const express = require("express");
const routes = express.Router();

const imageController = require('../controller/image.controller');
// Subir imágenes
routes.post('/images/:tabla', imageController.upload, imageController.uploadFile);

// Obtener productos con imágenes
routes.get('/api/productos', imageController.getProductos);


module.exports = routes;