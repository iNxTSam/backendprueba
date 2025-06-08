const db = require('../conexion');

exports.obtenerFacturas = (req, res) => {
  const query = 'SELECT * FROM factura';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener las facturas:', err);
      return res.status(500).json({ error: 'Error al obtener las facturas' });
    }
    res.json(results);
  });
};

exports.obtenerFacturaPorNumero = (req, res) => {
  const { numeroFactura } = req.params;

  const queryFactura = 'SELECT * FROM factura WHERE numeroFactura = ?';
  const queryProductos = `
    SELECT p.id, p.nombre_producto, p.tipo, fp.cantidad, fp.precio
    FROM factura_productos fp
    JOIN productos p ON fp.producto_id = p.id
    WHERE fp.numeroFactura = ?
  `;

  db.query(queryFactura, [numeroFactura], (err, facturaResults) => {
    if (err) {
      console.error('Error al buscar la factura:', err);
      return res.status(500).json({ error: 'Error al buscar la factura' });
    }
    if (facturaResults.length === 0) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }

    db.query(queryProductos, [numeroFactura], (err, productosResults) => {
      if (err) {
        console.error('Error al obtener productos de la factura:', err);
        return res.status(500).json({ error: 'Error al obtener productos de la factura' });
      }

      const factura = facturaResults[0];
      factura.productos = productosResults;
      res.json(factura);
    });
  });
};

exports.crearFactura = (req, res) => {
  const { nombre, correo, telefono, numeroFactura, productos, total, metodoPago, token_devolucion } = req.body;

  if (!correo || !correo.includes('@')) {
    return res.status(400).json({ error: 'Correo inválido o ausente' });
  }

  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: 'La lista de productos no puede estar vacía' });
  }

  const checkUserQuery = 'SELECT * FROM usuarios WHERE correo = ?';
  db.query(checkUserQuery, [correo], (err, userResult) => {
    if (err) {
      console.error('Error al verificar el correo del usuario:', err);
      return res.status(500).json({ error: 'Error en la validación del correo' });
    }

    if (userResult.length === 0) {
      return res.status(400).json({ error: 'El correo no está registrado. No se puede generar la factura.' });
    }

    const insertFacturaQuery = `
      INSERT INTO factura(numeroFactura, nombre, correo, telefono, total, metodoPago, token_devolucion)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(insertFacturaQuery,
      [numeroFactura, nombre, correo, telefono, total, metodoPago, token_devolucion || null],
      (err, facturaResult) => {
        if (err) {
          console.error('Error al guardar la factura:', err.sqlMessage);
          return res.status(500).json({ error: 'Error al guardar la factura' });
        }

        const insertProductosQuery = `
          INSERT INTO factura_productos (numeroFactura, producto_id, cantidad, precio)
          VALUES ?
        `;

        const productosValues = productos.map(p => [
          numeroFactura,
          p.id,
          p.cantidad,
          p.precio
        ]);

        db.query(insertProductosQuery, [productosValues], (err) => {
          if (err) {
            console.error('Error al guardar los productos de la factura:', err.sqlMessage);
            return res.status(500).json({ error: 'Error al guardar los productos de la factura' });
          }

          res.status(201).json({ message: 'Factura y productos guardados correctamente' });
        });
      });
  });
};

exports.actualizarFactura = (req, res) => {
  const { numeroFactura } = req.params;
  const { nombre, correo, telefono, productos, total, metodoPago, token_devolucion } = req.body;

  const updateFacturaQuery = `
    UPDATE factura
    SET nombre = ?, correo = ?, telefono = ?, total = ?, metodoPago = ?, token_devolucion = ?
    WHERE numeroFactura = ?
  `;

  db.query(updateFacturaQuery, [nombre, correo, telefono, total, metodoPago, token_devolucion || null, numeroFactura], (err, result) => {
    if (err) {
      console.error('Error al modificar la factura:', err);
      return res.status(500).json({ error: 'Error al modificar la factura' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }

    const deleteProductosQuery = 'DELETE FROM factura_productos WHERE numeroFactura = ?';

    db.query(deleteProductosQuery, [numeroFactura], (err) => {
      if (err) {
        console.error('Error al eliminar productos antiguos:', err);
        return res.status(500).json({ error: 'Error al actualizar los productos' });
      }

      if (!Array.isArray(productos) || productos.length === 0) {
        return res.json({ message: 'Factura actualizada correctamente, sin productos' });
      }

      const insertProductosQuery = `
        INSERT INTO factura_productos (numeroFactura, producto_id, cantidad, precio)
        VALUES ?
      `;

      const productosValues = productos.map(p => [
        numeroFactura,
        p.id,
        p.cantidad,
        p.precio
      ]);

      db.query(insertProductosQuery, [productosValues], (err) => {
        if (err) {
          console.error('Error al insertar productos actualizados:', err);
          return res.status(500).json({ error: 'Error al actualizar los productos' });
        }

        res.json({ message: 'Factura y productos actualizados correctamente' });
      });
    });
  });
};

exports.eliminarFactura = (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM factura WHERE numeroFactura = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar la factura:', err);
      return res.status(500).json({ error: 'Error al eliminar la factura' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    res.json({ message: 'Factura eliminada correctamente' });
  });
};
