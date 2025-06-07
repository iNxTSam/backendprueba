const express = require("express");
const router = express.Router();
const devolucionController = require("../controller/devolucion.controller");

router.get("/factura/:numeroFactura", devolucionController.obtenerFactura);
router.post("/api/devolucion", devolucionController.registrarDevolucion);
router.get("/", devolucionController.obtenerDevoluciones);


module.exports = router;
