async function request(path, owner, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { ...options.headers, 'X-User-Id': owner },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.');
  }
  if (!response.ok) {
    let message = 'Não foi possível concluir a operação.';
    try {
      const body = await response.json();
      message = body.error?.message || message;
    } catch {
      message = `Não foi possível concluir a operação (HTTP ${response.status}).`;
    }
    throw new Error(message);
  }
  return response;
}

export async function listDocuments(owner, signal) {
  const response = await request('/documents', owner, { signal });
  return response.json();
}

export async function uploadDocument(file, owner) {
  const body = new FormData();
  body.append('file', file);
  const response = await request('/upload', owner, { method: 'POST', body });
  return response.json();
}

export async function downloadDocument(id, owner) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`, owner);
  return response.blob();
}