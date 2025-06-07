
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../conexion');
const nodemailer = require('nodemailer');
require('dotenv').config();

const tokenStore = {};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
exports.recoverPassword = (req, res) => {
  const { email } = req.body;

  db.query('SELECT * FROM usuarios WHERE correo = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error en la base de datos', error: err });
    
    if (results.length === 0) {
      return res.status(400).json({ message: 'No se encontró un usuario con ese correo' });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    tokenStore[token] = email;

    const recoveryLink = `http://localhost:3000/ResetPassword?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperación de Contraseña',
      text: `Haz clic en el siguiente enlace para restablecer tu contraseña: ${recoveryLink}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error al enviar el correo', error });
      }
      res.status(200).json({ message: 'Correo enviado correctamente' });
    });
  });
};

  
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(400).json({ message: 'Token no válido o expirado' });
    }

    const email = decoded.email;

    if (tokenStore[token] !== email) {
      return res.status(400).json({ message: 'Token no válido' });
    }

    delete tokenStore[token];

    db.query('SELECT * FROM usuarios WHERE correo = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ message: 'Error en la base de datos', error: err });
      
      if (results.length === 0) {
        return res.status(400).json({ message: 'Usuario no encontrado' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      db.query(
        'UPDATE usuarios SET contraseña = ? WHERE correo = ?',
        [hashedPassword, email],
        (err, result) => {
          if (err) return res.status(500).json({ message: 'Error al actualizar la contraseña', error: err });

          res.status(200).json({ message: 'Contraseña cambiada correctamente' });
        }
      );
    });
  });
};