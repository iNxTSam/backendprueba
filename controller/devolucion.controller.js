const db = require("../conexion");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Configurar transporte de correo
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Buscar factura por número
exports.obtenerFactura = (req, res) => {
  const { numeroFactura } = req.params;

  const query = "SELECT * FROM factura WHERE numeroFactura = ?";
  db.query(query, [numeroFactura], (err, results) => {
    if (err) {
      console.error("Error al buscar la factura:", err);
      return res.status(500).json({ message: "Error al buscar la factura", error: err });
    }

    if (results.length > 0) {
      const factura = results[0];
      if (factura.productos) {
        factura.productos = JSON.parse(factura.productos);
      }
      return res.status(200).json(factura);
    } else {
      return res.status(404).json({ message: "Factura no encontrada" });
    }
  });
};

// Registrar devolución
exports.registrarDevolucion = (req, res) => {
  const { numeroFactura, nombre, telefono, productos, total, metodoPago, comentarios, correo } = req.body;

  if (!numeroFactura || !nombre || !telefono || !productos || !total || !metodoPago || !comentarios || !correo) {
    console.error("Datos faltantes:", req.body);
    return res.status(400).json({ message: "Faltan datos necesarios" });
  }

  const queryFactura = "SELECT * FROM factura WHERE numeroFactura = ?";
  db.query(queryFactura, [numeroFactura], (err, results) => {
    if (err) {
      console.error("Error al verificar la factura:", err);
      return res.status(500).json({ message: "Error al verificar la factura", error: err });
    }

    const queryDevolucion = `
      INSERT INTO devolucion (numeroFactura, nombre, telefono, productos, total, metodoPago, comentarios, correo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      queryDevolucion,
      [numeroFactura, nombre, telefono, JSON.stringify(productos), total, metodoPago, comentarios, correo],
      (err, result) => {
        if (err) {
          console.error("Error al registrar la devolución:", err);
          return res.status(500).json({ message: "Error al registrar la devolución", error: err });
        }

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: correo,
          subject: "Confirmación de Devolución - Jhoan Uniforms",
          html: `
            <h2>Confirmación de Devolución</h2>
            <p><strong>Nombre:</strong> ${nombre}</p>
            <p><strong>Número de Factura:</strong> ${numeroFactura}</p>
            <p><strong>Productos Devueltos:</strong> ${productos.join(", ")}</p>
            <p><strong>Total:</strong> $${total}</p>
            <p><strong>Método de Pago:</strong> ${metodoPago}</p>
            <p><strong>Comentarios:</strong> ${comentarios}</p>
            <p>Gracias por confiar en Jhoan Uniforms.</p>
          `
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error al enviar el correo:", error);
            return res.status(500).json({ message: "Error al enviar el correo", error });
          }

          res.status(200).json({
            message: "Devolución registrada con éxito y correo enviado",
            response: { numeroFactura, nombre, telefono, productos, total, metodoPago, comentarios, correo }
          });
        });
      }
    );
  });
};

// Obtener todas las devoluciones
exports.obtenerDevoluciones = (req, res) => {
  const query = "SELECT * FROM devolucion";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener las devoluciones:", err);
      return res.status(500).json({ error: "Error al obtener las devoluciones" });
    }
    res.json(results);
  });
};
