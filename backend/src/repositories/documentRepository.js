const path = require('node:path');
const { unlink } = require('node:fs/promises');

const documents = new Map();

function save(document) {
  documents.set(document.id, document);
  return document;
}

function findByOwner(owner) {
  return Array.from(documents.values()).filter(document => document.owner === owner);
}

function findById(id) {
  return documents.get(id);
}

function getFilePath(document) {
  return path.join(document.directory, document.storedName);
}

async function removeFile(filePath) {
  await unlink(filePath);
}

module.exports = { save, findByOwner, findById, getFilePath, removeFile };