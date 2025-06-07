const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../conexion"); 

const hashSHA256 = (password) => {
    return crypto.createHash("sha256").update(password).digest("hex");
};

exports.registrarUsuario = async (req, res) => {
    const { apodo, apellido, correo, contraseña } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(contraseña, 10);
        db.query(
            "INSERT INTO usuarios (rol_code, apodo, apellido, correo, contraseña, estado) VALUES (2, ?, ?, ?, ?, 'activo')",
            [apodo, apellido, correo, hashedPassword],
            (err) => {
                if (err) return res.status(500).json({ error: "Error al registrar el usuario" });
                res.status(201).json({ message: "Usuario registrado con éxito" });
            }
        );
    } catch (err) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

exports.loginUsuario = (req, res) => {
    const { correo, contraseña } = req.body;

    const verificarCredenciales = (callback) => {
        db.query("SELECT correo, contraseña, rol_code FROM administrador WHERE correo = ?",
            [correo], (err, adminResults) => {
                if (err) return callback(err, null);

                if (adminResults.length > 0) {
                    const admin = adminResults[0];
                    const hashedPassword = hashSHA256(contraseña);

                    if (hashedPassword === admin.contraseña) {
                        return callback(null, { rol_code: admin.rol_code, correo: admin.correo });
                    }
                    return callback(null, null);
                }

                db.query("SELECT correo, contraseña, rol_code, estado FROM usuarios WHERE correo = ?",
                    [correo], (err, userResults) => {
                        if (err) return callback(err, null);

                        if (userResults.length > 0) {
                            const usuario = userResults[0];
                            if (usuario.estado === 'inactivo') {
                                return callback(null, null); 
                            }
                            bcrypt.compare(contraseña, usuario.contraseña, (err, isMatch) => {
                                if (err) return callback(err, null);
                                if (isMatch) return callback(null, usuario);
                                return callback(null, null);
                            });
                        } else {
                            return callback(null, null);
                        }
                    });
            });
    };

    verificarCredenciales((err, usuario) => {
        if (err) return res.status(500).json({ error: "Error al iniciar sesión" });
        if (!usuario) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

        res.status(200).json({ message: "Inicio de sesión exitoso", rol_code: usuario.rol_code });
    });
};

exports.consultarUsuario = (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM usuarios WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(400).send("Usuario no encontrado");
        if (result.length === 0) return res.status(404).send("Usuario no encontrado");
        res.json(result[0]); 
    });
};

exports.actualizarUsuario = async (req, res) => {
    const { apodo, apellido, correo, contraseña, estado } = req.body;
    const { id } = req.params;
    let hashedPassword = contraseña;

    if (!contraseña.startsWith("$2b$")) {
        hashedPassword = await bcrypt.hash(contraseña, 10);
    }

    db.query(
        "UPDATE usuarios SET apodo=?, apellido=?, correo=?, contraseña=?, estado=? WHERE id=?",
        [apodo, apellido, correo, hashedPassword, estado, id],
        (err, result) => {
            if (err) return res.status(500).send("Usuario no actualizado");
            res.send(result);
        }
    );
};

exports.eliminarUsuario = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM usuarios WHERE id=?", [id], (err, result) => {
        if (err) return res.status(400).send("Usuario no eliminado");
        res.send(result);
    });
};

exports.obtenerUsuarios = (req, res) => {
    db.query("SELECT id, apodo, apellido, correo, estado FROM usuarios", (err, result) => {
        if (err) return res.status(500).json({ error: "Error al obtener usuarios" });
        res.status(200).json(result);
    });
};

exports.cambiarEstadoUsuario = (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; 

    if (estado !== 'activo' && estado !== 'inactivo') {
        return res.status(400).json({ error: "El estado debe ser 'activo' o 'inactivo'" });
    }

    db.query(
        "UPDATE usuarios SET estado=? WHERE id=?",
        [estado, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: "Error al cambiar el estado del usuario" });
            if (result.affectedRows === 0) return res.status(404).json({ error: "Usuario no encontrado" });

            res.status(200).json({ message: `Estado del usuario actualizado a '${estado}'` });
        }
    );
};
