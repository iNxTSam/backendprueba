const express = require('express');
const router = express.Router();
const RecuperarController = require('../controller/recuperar.controller'); // Asegúrate de que la ruta sea correcta

router.post('/recover-password', RecuperarController.recoverPassword);
router.post('/ResetPassword', RecuperarController.resetPassword);

module.exports = router;
