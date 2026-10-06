import { useEffect, useState } from 'react';
import { ArrowRight, Files, UserRound } from 'lucide-react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/documentApi';
import './App.css';

function DocumentWorkspace({ owner }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(Boolean(owner));
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!owner) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    listDocuments(owner, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) setDocuments(result);
      })
      .catch(error => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [owner, revision]);

  function handleUploaded(document) {
    setDocuments(previous => [document, ...previous.filter(item => item.id !== document.id)]);
    setRevision(previous => previous + 1);
  }

  return (
    <>
      <UploadComponent owner={owner} onUploaded={handleUploaded} />
      <DocumentList documents={documents} owner={owner} loading={loading} error={error} onRefresh={() => setRevision(previous => previous + 1)} />
    </>
  );
}

export default function App() {
  const [ownerInput, setOwnerInput] = useState('');
  const [owner, setOwner] = useState('');

  function selectOwner(event) {
    event.preventDefault();
    const nextOwner = ownerInput.trim();
    if (nextOwner) setOwner(nextOwner);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand"><Files size={25} aria-hidden="true" /><span>DMS</span></div>
        <span className="workspace-label">Gestão de documentos</span>
      </header>
      <main>
        <div className="page-heading">
          <h1>Document Management System</h1>
          <form className="owner-form" onSubmit={selectOwner}>
            <label htmlFor="owner"><UserRound size={16} aria-hidden="true" />Usuário</label>
            <div className="owner-input-group">
              <input id="owner" value={ownerInput} onChange={event => setOwnerInput(event.target.value)} placeholder="usuario-123" required />
              <button className="icon-button" type="submit" disabled={!ownerInput.trim()} title="Selecionar usuário" aria-label="Selecionar usuário"><ArrowRight size={20} aria-hidden="true" /></button>
            </div>
          </form>
        </div>
        <div className="workspace-status"><span className={owner ? 'status-dot active' : 'status-dot'} />{owner ? `Usuário ativo: ${owner}` : 'Nenhum usuário selecionado'}</div>
        <DocumentWorkspace key={owner} owner={owner} />
      </main>
      <footer>Document Management System <span>Armazenamento local</span></footer>
    </div>
  );
}
