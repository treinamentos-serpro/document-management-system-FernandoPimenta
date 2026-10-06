const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { mkdtemp, readdir, readFile, rm, unlink, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const previousDirectory = process.env.UPLOAD_DIR;
const previousLimit = process.env.MAX_FILE_SIZE_BYTES;
let storageDirectory;
let server;
let baseUrl;
let uploadedDocument;

before(async () => {
  storageDirectory = await mkdtemp(path.join(tmpdir(), 'dms-test-'));
  process.env.UPLOAD_DIR = storageDirectory;
  process.env.MAX_FILE_SIZE_BYTES = '64';
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
  if (storageDirectory) await rm(storageDirectory, { recursive: true, force: true });
  if (previousDirectory === undefined) delete process.env.UPLOAD_DIR;
  else process.env.UPLOAD_DIR = previousDirectory;
  if (previousLimit === undefined) delete process.env.MAX_FILE_SIZE_BYTES;
  else process.env.MAX_FILE_SIZE_BYTES = previousLimit;
});

const app = require('../src/app');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

function uploadForm(content = 'conteudo do documento', field = 'file') {
  const form = new FormData();
  form.append(field, new Blob([content]), 'relatorio.txt');
  return form;
}

test('health continua disponivel sem identificacao de usuario', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(await response.json(), { status: 'ok' });
});

test('as rotas exigem um usuario antes de gravar arquivos', async () => {
  for (const [route, options] of [
    ['/documents', {}],
    ['/documents/inexistente/download', {}],
    ['/upload', { method: 'POST', body: uploadForm() }],
  ]) {
    const response = await fetch(`${baseUrl}${route}`, options);
    assert.strictEqual(response.status, 400);
    assert.strictEqual((await response.json()).error.code, 'INVALID_USER');
  }
  assert.deepStrictEqual(await readdir(storageDirectory), []);
});

test('lista vazia retorna um array', async () => {
  const response = await fetch(`${baseUrl}/documents`, { headers: { 'X-User-Id': 'usuario-1' } });
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(await response.json(), []);
});

test('upload grava em disco com nome seguro e retorna somente metadados publicos', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST', headers: { 'X-User-Id': 'usuario-1' }, body: uploadForm(),
  });
  assert.strictEqual(response.status, 201);
  uploadedDocument = await response.json();
  assert.deepStrictEqual(Object.keys(uploadedDocument).sort(), ['id', 'originalName', 'owner', 'size', 'uploadedAt']);
  assert.match(uploadedDocument.id, /^[0-9a-f-]{36}$/);
  assert.strictEqual(uploadedDocument.originalName, 'relatorio.txt');
  assert.strictEqual(uploadedDocument.owner, 'usuario-1');
  assert.strictEqual(uploadedDocument.size, Buffer.byteLength('conteudo do documento'));
  assert.strictEqual(new Date(uploadedDocument.uploadedAt).toISOString(), uploadedDocument.uploadedAt);
  const files = await readdir(storageDirectory);
  assert.strictEqual(files.length, 1);
  assert.notStrictEqual(files[0], uploadedDocument.originalName);
  assert.strictEqual(await readFile(path.join(storageDirectory, files[0]), 'utf8'), 'conteudo do documento');
});

test('lista somente documentos do dono, em ordem decrescente', async () => {
  await new Promise(resolve => setTimeout(resolve, 5));
  const upload = await fetch(`${baseUrl}/upload`, {
    method: 'POST', headers: { 'X-User-Id': 'usuario-1' }, body: uploadForm('segundo'),
  });
  assert.strictEqual(upload.status, 201);
  const second = await upload.json();
  const response = await fetch(`${baseUrl}/documents`, { headers: { 'X-User-Id': 'usuario-1' } });
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(await response.json(), [second, uploadedDocument]);
  const other = await fetch(`${baseUrl}/documents`, { headers: { 'X-User-Id': 'usuario-2' } });
  assert.deepStrictEqual(await other.json(), []);
});

test('download entrega o conteudo como anexo', async () => {
  const response = await fetch(`${baseUrl}/documents/${uploadedDocument.id}/download`, {
    headers: { 'X-User-Id': 'usuario-1' },
  });
  assert.strictEqual(response.status, 200);
  assert.match(response.headers.get('content-disposition'), /attachment;.*relatorio.txt/);
  assert.strictEqual(await response.text(), 'conteudo do documento');
});

test('documento inexistente ou de outro dono retorna 404', async () => {
  for (const identifier of ['inexistente', uploadedDocument.id]) {
    const response = await fetch(`${baseUrl}/documents/${identifier}/download`, {
      headers: { 'X-User-Id': 'usuario-2' },
    });
    assert.strictEqual(response.status, 404);
    assert.strictEqual((await response.json()).error.code, 'DOCUMENT_NOT_FOUND');
  }
});

test('upload sem arquivo, campo inesperado e tamanho excessivo nao deixam arquivos', async () => {
  const filesBefore = await readdir(storageDirectory);
  const multipleFiles = uploadForm();
  multipleFiles.append('file', new Blob(['outro arquivo']), 'outro.txt');
  for (const [body, status, code] of [
    [new FormData(), 400, 'MISSING_FILE'],
    [uploadForm('arquivo', 'unexpected'), 400, 'INVALID_UPLOAD'],
    [multipleFiles, 400, 'INVALID_UPLOAD'],
    [uploadForm('conteudo'.repeat(20)), 413, 'FILE_TOO_LARGE'],
  ]) {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST', headers: { 'X-User-Id': 'usuario-1' }, body,
    });
    assert.strictEqual(response.status, status);
    assert.strictEqual((await response.json()).error.code, code);
    assert.deepStrictEqual(await readdir(storageDirectory), filesBefore);
  }
});

test('falha de gravacao retorna erro sem expor caminhos internos', async () => {
  const blockedPath = path.join(storageDirectory, 'blocked');
  await writeFile(blockedPath, 'nao e um diretorio');
  process.env.UPLOAD_DIR = blockedPath;
  try {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST', headers: { 'X-User-Id': 'usuario-1' }, body: uploadForm(),
    });
    assert.strictEqual(response.status, 500);
    const body = await response.json();
    assert.strictEqual(body.error.code, 'STORAGE_ERROR');
    assert.ok(!JSON.stringify(body).includes(storageDirectory));
  } finally {
    process.env.UPLOAD_DIR = storageDirectory;
    await unlink(blockedPath);
  }
});

test('falha de leitura no download retorna STORAGE_ERROR', async () => {
  for (const filename of await readdir(storageDirectory)) {
    await unlink(path.join(storageDirectory, filename));
  }
  const response = await fetch(`${baseUrl}/documents/${uploadedDocument.id}/download`, {
    headers: { 'X-User-Id': 'usuario-1' },
  });
  assert.strictEqual(response.status, 500);
  assert.strictEqual((await response.json()).error.code, 'STORAGE_ERROR');
});
