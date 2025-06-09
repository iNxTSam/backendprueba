const crypto = require('crypto');
const db = require('../conexion');
require('dotenv').config();
const nodemailer = require('nodemailer');

const solicitudes = []; // Lista en memoria, puedes migrar a base de datos en el futuro

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

transporter.verify((error, success) => {
  if (error) console.error('Error al configurar nodemailer:', error);
  else console.log('Nodemailer funcionando correctamente.');
});

// Enviar una solicitud de devolución
exports.enviarSolicitud = async (req, res) => {
  const {
    correoUsuario, nombreUsuario, numeroFactura, enlaceDevolucion,
    telefonoUsuario, productoUsuario, comentarioUsuario,
    metodoPagoUsuario, totalUsuario, fechaUsuario
  } = req.body;

  if (!correoUsuario || !nombreUsuario || !numeroFactura || !telefonoUsuario ||
    !productoUsuario || !comentarioUsuario || !metodoPagoUsuario ||
    !totalUsuario || !fechaUsuario || !enlaceDevolucion) {
    return res.status(400).json({ message: 'Faltan datos para procesar la solicitud.' });
  }

  const nuevaSolicitud = {
    _id: crypto.randomUUID(),
    usuario: nombreUsuario,
    correo: correoUsuario,
    telefono: telefonoUsuario,
    producto: productoUsuario,
    comentario: comentarioUsuario,
    metodoPago: metodoPagoUsuario,
    total: totalUsuario,
    numeroFactura,
    enlaceDevolucion,
    fecha: new Date().toISOString()
  };

  try {
    solicitudes.push(nuevaSolicitud);
    res.status(200).json({ message: 'Solicitud enviada correctamente. Pronto será notificado por correo.' });
  } catch (error) {
    console.error('Error al guardar la solicitud:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud.' });
  }
};

// Obtener todas las solicitudes
exports.obtenerSolicitudes = (req, res) => {
  res.status(200).json(solicitudes);
};

// Obtener detalles de una solicitud específica
exports.obtenerDetalleSolicitud = (req, res) => {
  const { id } = req.params;
  const solicitud = solicitudes.find(s => s._id === id);
  if (solicitud) {
    res.status(200).json(solicitud);
  } else {
    res.status(404).json({ message: 'Solicitud no encontrada.' });
  }
};

// Aceptar una solicitud
exports.aceptarSolicitud = async (req, res) => {
  const { id } = req.params;
  const index = solicitudes.findIndex(s => s._id === id);
  if (index === -1) return res.status(404).json({ message: 'Solicitud no encontrada.' });

  const solicitud = solicitudes[index];
  const token = crypto.randomBytes(16).toString('hex');

  const updateTokenQuery = 'UPDATE factura SET token_devolucion = ? WHERE numeroFactura = ?';
  db.query(updateTokenQuery, [token, solicitud.numeroFactura], (err) => {
    if (err) {
      console.error('Error al guardar el token en la factura:', err);
      return res.status(500).json({ message: 'Error al asignar el token de devolución.' });
    }

    const queryDevolucion = `
      INSERT INTO devolucion (numeroFactura, nombre, telefono, productos, total, metodoPago, comentarios, correo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
      queryDevolucion,
      [
        solicitud.numeroFactura,
        solicitud.usuario,
        solicitud.telefono,
        JSON.stringify(solicitud.producto),
        solicitud.total,
        solicitud.metodoPago,
        solicitud.comentario,
        solicitud.correo
      ],
      async (err) => {
        if (err) {
          console.error('Error al registrar la devolución:', err);
          return res.status(500).json({ message: 'Error al registrar la devolución.' });
        }

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: solicitud.correo,
          subject: `Solicitud de Devolución Aceptada - Factura ${solicitud.numeroFactura}`,
          text: `
Hola ${solicitud.usuario},

Gracias por contactarte. Hemos aprobado tu solicitud de devolución para la factura N° ${solicitud.numeroFactura}.

Comentario: "${solicitud.comentario}"

Puedes acercarte a nuestras instalaciones con el producto y el comprobante correspondiente.

Saludos,  
El equipo de Jhoan Uniforms.
          `
        };

        try {
          await transporter.sendMail(mailOptions);
          solicitudes.splice(index, 1); // eliminar la solicitud ya atendida
          res.status(200).json({ message: 'Solicitud aceptada, correo enviado y devolución registrada con éxito.' });
        } catch (error) {
          console.error('Error al enviar correo:', error);
          res.status(500).json({ message: 'Error al enviar correo de aceptación.' });
        }
      }
    );
  });
};

// Rechazar una solicitud
exports.rechazarSolicitud = async (req, res) => {
  const { id } = req.params;
  const index = solicitudes.findIndex(s => s._id === id);
  if (index === -1) return res.status(404).json({ message: 'Solicitud no encontrada.' });

  const solicitud = solicitudes[index];

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: solicitud.correo,
    subject: `Solicitud de Devolución Rechazada - Factura ${solicitud.numeroFactura}`,
    text: `
Hola ${solicitud.usuario},

Lamentamos informarte que tu solicitud de devolución para la factura ${solicitud.numeroFactura} ha sido rechazada.

Motivo: no cumple con los criterios establecidos en nuestra política de devoluciones.

Saludos,  
El equipo de Jhoan Uniforms.
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    solicitudes.splice(index, 1);
    res.status(200).json({ message: 'Solicitud rechazada y correo enviado.' });
  } catch (error) {
    console.error('Error al enviar correo:', error);
    res.status(500).json({ message: 'Error al enviar correo de rechazo.' });
  }
};

// Obtener todas las devoluciones aprobadas (desde la BD)
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
