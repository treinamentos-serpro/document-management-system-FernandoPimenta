const multer = require('multer');
const { randomUUID } = require('node:crypto');
const { mkdir } = require('node:fs');
const path = require('node:path');

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const directory = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../storage'));
    mkdir(directory, { recursive: true }, error => callback(error, directory));
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});

function upload(req, res, next) {
  const fileSize = Number(process.env.MAX_FILE_SIZE_BYTES || 10485760);
  if (!Number.isSafeInteger(fileSize) || fileSize <= 0) {
    return next(new Error('Limite de upload inválido.'));
  }
  multer({ storage, limits: { fileSize, files: 1, fields: 0 } }).single('file')(req, res, error => {
    if (!error) return next();
    let code = 'STORAGE_ERROR';
    if (error instanceof multer.MulterError) {
      code = error.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD';
    } else if (!error.code) {
      code = 'INVALID_UPLOAD';
    }
    next(Object.assign(new Error('Falha no upload.', { cause: error }), { code }));
  });
}

module.exports = upload;