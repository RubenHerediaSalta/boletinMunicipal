const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { testConnection } = require("./config/database");

const app = express();

// Helmet para headers de seguridad HTTP
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Permitir recursos de otros orígenes
  }),
);

// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 requests por ventana
  message: "Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting específico para login (más estricto)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos de login
  message: "Demasiados intentos de inicio de sesión, por favor intenta de nuevo en 15 minutos.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting general
app.use("/api/", generalLimiter);

// Configuración de CORS para desarrollo y producción
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requests sin origin (como mobile apps o curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "La política de CORS no permite el acceso desde este origen.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  }),
);

// Middleware para logging de requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Crear directorio uploads si no existe
const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Rutas
app.use("/api/auth", require("./routes/auth"));
app.use("/api/resoluciones", require("./routes/resoluciones"));
app.use("/api/categorias", require("./routes/categorias"));

// Ruta de salud
app.get("/api/health", async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.json({
      status: "OK",
      message: "Servidor funcionando correctamente",
      database: dbStatus ? "Conectado" : "Error",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Error en el servidor",
      error: error.message,
    });
  }
});

// Ruta de información
app.get("/api/info", (req, res) => {
  res.json({
    name: "Boletín Municipal API",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
  });
});

// Ruta principal
app.get("/", (req, res) => {
  res.json({
    message: "Bienvenido a la API del Boletín Municipal",
    endpoints: {
      health: "/api/health",
      info: "/api/info",
      auth: "/api/auth",
      resoluciones: "/api/resoluciones",
      categorias: "/api/categorias",
    },
  });
});

// Manejo de errores mejorado
app.use((err, req, res, next) => {
  console.error("❌ Error no manejado:", err.stack);

  // Errores de Multer (subida de archivos)
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "El archivo es demasiado grande. Máximo 10MB permitido.",
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      message: "Tipo de archivo no permitido. Solo se aceptan PDF.",
    });
  }

  // Errores de PostgreSQL
  if (err.code === "23505") {
    return res.status(400).json({
      message: "Ya existe un registro con esos datos",
    });
  }

  if (err.code === "23503") {
    return res.status(400).json({
      message: "Error de referencia: verifica los datos relacionados",
    });
  }

  // Error general
  res.status(500).json({
    message: "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && {
      error: err.message,
      stack: err.stack,
    }),
  });
});

// Ruta no encontrada (DEBE IR AL FINAL)
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Ruta no encontrada",
    path: req.originalUrl,
    method: req.method,
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("🔧 Iniciando servidor...");

    // Verificar conexión a la base de datos
    console.log("📊 Verificando conexión a PostgreSQL...");
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.log("❌ No se pudo conectar a la base de datos.");
      console.log("💡 Solución de problemas:");
      console.log("   1. Verifica que PostgreSQL esté ejecutándose");
      console.log("   2. Revisa las credenciales en el archivo .env");
      console.log("   3. Asegúrate de que la base de datos exista");
      console.log("   4. Verifica que el puerto 5432 esté disponible");
      process.exit(1);
    }

    console.log("✅ Conexión a PostgreSQL establecida");

    app.listen(PORT, () => {
      console.log("🚀 Servidor iniciado correctamente");
      console.log("========================================");
      console.log(`📍 Puerto: ${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`ℹ️  Info: http://localhost:${PORT}/api/info`);
      console.log(`👤 Panel Admin: http://localhost:3000 (cuando esté listo)`);
      console.log("========================================");
    });
  } catch (error) {
    console.error("❌ Error crítico iniciando el servidor:", error);
    process.exit(1);
  }
};

// Manejar cierre graceful
process.on("SIGINT", () => {
  console.log("\n🛑 Cerrando servidor...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Cerrando servidor...");
  process.exit(0);
});

startServer();
