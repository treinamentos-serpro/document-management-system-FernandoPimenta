const service = require('../services/documentService');

function requireUser(req, res, next) {
  const owner = req.get('X-User-Id')?.trim();
  if (!owner) {
    return res.status(400).json({ error: { code: 'INVALID_USER', message: 'Informe o usuário.' } });
  }
  req.owner = owner;
  next();
}

async function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: { code: 'MISSING_FILE', message: 'Envie um arquivo no campo file.' } });
  }
  const document = await service.upload(req.file, req.owner);
  res.status(201).json(document);
}

function list(req, res) {
  res.json(service.list(req.owner));
}

function download(req, res, next) {
  const document = service.download(req.params.id, req.owner);
  res.download(document.filePath, document.originalName, error => {
    if (error) {
      next(Object.assign(new Error('Falha ao ler documento.', { cause: error }), { code: 'STORAGE_ERROR' }));
    }
  });
}

function handleError(error, req, res, next) {
  if (res.headersSent) return next(error);
  const errors = {
    DOCUMENT_NOT_FOUND: [404, 'Documento não encontrado.'],
    FILE_TOO_LARGE: [413, 'O arquivo excede o limite permitido.'],
    INVALID_UPLOAD: [400, 'Envie apenas um arquivo no campo file em multipart/form-data.'],
    STORAGE_ERROR: [500, 'Não foi possível armazenar ou ler o documento.'],
    INTERNAL_ERROR: [500, 'Não foi possível concluir a operação.'],
  };
  const code = Object.hasOwn(errors, error.code) ? error.code : 'INTERNAL_ERROR';
  const [status, message] = errors[code];
  res.status(status).json({ error: { code, message } });
}

module.exports = { requireUser, upload, list, download, handleError };