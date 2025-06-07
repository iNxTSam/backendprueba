const express = require("express");
const router = express.Router();
const usuarioController = require("../controller/usuario.controller");

router.post("/api/registro", usuarioController.registrarUsuario);
router.post("/api/login", usuarioController.loginUsuario);
router.get("/consultar/:id", usuarioController.consultarUsuario);
router.put("/actualizar/:id", usuarioController.actualizarUsuario);
router.delete("/eliminar/:id", usuarioController.eliminarUsuario);
router.get("/api/usuarios", usuarioController.obtenerUsuarios);
router.put("/api/usuarios/:id", usuarioController.cambiarEstadoUsuario);


module.exports = router;
