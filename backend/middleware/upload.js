const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'archivo_adjunto') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF para el documento principal'), false);
    }
  } else if (file.fieldname === 'anexos') {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido para anexos. Use PDF, imágenes o documentos Word'), false);
    }
  } else {
    cb(new Error('Campo de archivo no reconocido'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25000000, // 25MB
    files: 10
  },
  fileFilter: fileFilter
});

const uploadMiddleware = upload.fields([
  { name: 'archivo_adjunto', maxCount: 1 },
  { name: 'anexos', maxCount: 9 }
]);

module.exports = uploadMiddleware;