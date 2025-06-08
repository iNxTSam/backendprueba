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
}

exports.obtenerFacturaPorNumero = (req, res) => {
  const { numeroFactura } = req.params;

  const query = 'SELECT * FROM factura WHERE numeroFactura = ?';
  db.query(query, [numeroFactura], (err, results) => {
    if (err) {
      console.error('Error al buscar la factura:', err);
      return res.status(500).json({ error: 'Error al buscar la factura' });
    }
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'Factura no encontrada' });
    }
  });
};

exports.crearFactura = (req, res) => {
  const { nombre, correo, telefono, numeroFactura, productos, total, metodoPago, token_devolucion } = req.body;
  const producto = JSON.stringify(productos);

  if (!correo) {
    return res.status(400).json({ error: 'El correo es obligatorio' });
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

      const insertQuery = `
        INSERT INTO factura(nombre, correo, telefono, numeroFactura, productos, total, metodoPago, token_devolucion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.query(insertQuery, [nombre, correo, telefono, numeroFactura, producto, total, metodoPago, token_devolucion || null], (err, result) => {
        if (err) {
          console.error('Error al guardar la factura:', err.sqlMessage);
          return res.status(500).json({ error: 'Error al guardar la factura' });
        }
        res.status(201).json({ message: 'Factura guardada', id: result.insertId });
      });

  });
};


exports.actualizarFactura = (req, res) => {
  const { numeroFactura } = req.params;
  const { nombre, correo, telefono, productos, total, metodoPago, token_devolucion} = req.body;
  const producto = JSON.stringify(productos);

  db.query(
    'UPDATE factura SET nombre = ?, correo = ?, telefono = ?, numeroFactura = ?, productos = ?, total = ?, metodoPago = ?, token_devolucion = WHERE numeroFactura = ?',
    [nombre, correo, telefono, , productos, total, metodoPago, token_devolucion,],
    (err, result) => {
      if (err) {
        console.error('Error al modificar la factura:', err);
        return res.status(500).json({ error: 'Error al modificar la factura' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Factura no encontrada' });
      }
      res.json({ message: 'Factura actualizada correctamente' });
    }
  );
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
