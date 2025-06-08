const multer = require("multer");
const path = require("path");

// Configuración de almacenamiento con multer
const storage = multer.diskStorage({
    destination: path.join(__dirname, '../carrito'),
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Middleware para recibir hasta 36 imágenes con el campo 'image'
exports.upload = upload.array('image', 36);

// Función para manejar la subida y guardado en BD
exports.uploadFile = (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No se recibieron archivos" });
    }

    console.log("Archivos recibidos:", req.files);

    req.getConnection((err, conn) => {
        if (err) return res.status(500).json({ error: "Error de conexión a la BD" });

        // Crear valores para insertar (tipo, nombre_producto)
        const values = req.files.map(file => [file.mimetype, file.filename]);

        const query = "INSERT INTO ?? (tipo, nombre_producto) VALUES ?";
        conn.query(query, ['productos', values], (err, rows) => {
            if (err) {
                console.error("Error en la consulta:", err);
                return res.status(500).json({ error: "Error al subir las imágenes" });
            }
            res.json({ message: "Imágenes subidas con éxito" });
        });
    });
};

// Función para obtener productos
exports.getProductos = (req, res) => {
    req.getConnection((err, conn) => {
        if (err) {
            console.error("Error de conexión a la BD:", err);
            return res.status(500).json({ error: "Error en la conexión a la base de datos" });
        }

        conn.query("SELECT id, nombre_producto FROM productos", (err, results) => {
            if (err) {
                console.error("Error al consultar productos:", err);
                return res.status(500).json({ error: "Error al obtener productos" });
            }

            const productos = results.map(producto => ({
                nombre: producto.nombre_producto,
                imagen: producto.nombre_producto,
            }));

            res.json(productos);
        });
    });
};