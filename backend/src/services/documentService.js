const { randomUUID } = require('node:crypto');
const repository = require('../repositories/documentRepository');

function publicMetadata(document) {
  const { id, originalName, size, uploadedAt, owner } = document;
  return { id, originalName, size, uploadedAt, owner };
}

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
    return publicMetadata(document);
  } catch (error) {
    await repository.removeFile(file.path).catch(() => {});
    throw Object.assign(new Error('Falha ao registrar documento.', { cause: error }), { code: 'STORAGE_ERROR' });
  }
}

function list(owner) {
  return repository.findByOwner(owner)
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
    .map(publicMetadata);
}

function download(id, owner) {
  const document = repository.findById(id);
  if (!document || document.owner !== owner) {
    throw Object.assign(new Error('Documento não encontrado.'), { code: 'DOCUMENT_NOT_FOUND' });
  }
  return { filePath: repository.getFilePath(document), originalName: document.originalName };
}

module.exports = { upload, list, download };