const express = require("express");
const router = express.Router();
const facturaController = require("../controller/factura.controller");


router.get("/api/facturas", facturaController.obtenerFacturas);
router.get("/api/factura/numeroFactura/:numeroFactura", facturaController.obtenerFacturaPorNumero);
router.post("/api/factura", facturaController.crearFactura);
router.put("/api/facturas/:numeroFactura", facturaController.actualizarFactura);
router.delete("/api/facturas/:id", facturaController.eliminarFactura);

module.exports = router;
