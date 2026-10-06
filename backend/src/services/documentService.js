const { randomUUID } = require('node:crypto');
const repository = require('../repositories/documentRepository');
const toPublicMetadata = require('./documentPresenter');
const createServiceError = require('./serviceError');

async function upload(file, owner) {
  try {
    const document = repository.save({
      id: randomUUID(),
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner,
      storedName: file.filename,
      directory: file.destination,
    });
    return toPublicMetadata(document);
  } catch (error) {
    await repository.removeFile(file.path).catch(() => {});
    throw createServiceError('STORAGE_ERROR', 'Falha ao registrar documento.', error);
  }
}

function list(owner) {
  return repository.findByOwner(owner)
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
    .map(toPublicMetadata);
}

function download(id, owner) {
  const document = repository.findById(id);
  if (!document || document.owner !== owner) {
    throw createServiceError('DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }
  return { filePath: repository.getFilePath(document), originalName: document.originalName };
}

module.exports = { upload, list, download };