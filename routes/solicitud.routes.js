const express = require('express');
const router = express.Router();
const solicitudController = require('../controller/solicitud.controller');

router.post('/api/enviar-correo', solicitudController.enviarSolicitud);
router.get('/api/solicitudes-devolucion', solicitudController.obtenerSolicitudes);
router.get('/api/solicitudes-devolucion/:id/detalles', solicitudController.obtenerDetalleSolicitud);
router.post('/api/solicitudes-devolucion/:id/aceptar', solicitudController.aceptarSolicitud);
router.post('/api/solicitudes-devolucion/:id/rechazar', solicitudController.rechazarSolicitud);
router.get('/api/devoluciones', solicitudController.obtenerDevoluciones);


module.exports = router;
