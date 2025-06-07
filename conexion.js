const mysql = require('mysql2');

// Configuración para Azure (y local si lo deseas)
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: true
    }
};

// Crear la conexión
const db = mysql.createConnection(dbConfig);

// Conectarse a la base de datos
db.connect((err) => {
    if (err) {
        console.error("❌ Error al conectar a la base de datos:", err.message);
    } else {
        console.log("✅ Conectado a la base de datos MySQL");
    }
});

module.exports = db;
