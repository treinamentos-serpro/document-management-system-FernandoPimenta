import { FileText, FolderOpen, LoaderCircle, RefreshCw } from 'lucide-react';
import DownloadButton from './DownloadButton';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${numberFormatter.format(bytes / 1024)} KB`;
  return `${numberFormatter.format(bytes / (1024 * 1024))} MB`;
}

export default function DocumentList({ documents, owner, loading, error, onRefresh }) {
  return (
    <section className="documents-section" aria-labelledby="documents-heading" aria-busy={loading}>
      <div className="section-heading">
        <div className="heading-with-count"><h2 id="documents-heading">Documentos</h2><span className="document-count">{documents.length}</span></div>
        <button type="button" className="icon-button" disabled={!owner || loading} onClick={onRefresh}
          title="Atualizar documentos" aria-label="Atualizar documentos">
          <RefreshCw size={18} className={loading ? 'spinner' : undefined} aria-hidden="true" />
        </button>
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}
      {loading && <p className="loading-message" role="status"><LoaderCircle size={17} className="spinner" aria-hidden="true" />Carregando documentos...</p>}
      {!loading && !error && documents.length === 0 && (
        <div className="empty-state"><FolderOpen size={36} strokeWidth={1.3} aria-hidden="true" /><p>{owner ? 'Nenhum documento enviado.' : 'Nenhum usuário selecionado.'}</p></div>
      )}
      {documents.length > 0 && (
        <div className="table-scroll">
          <table>
            <caption className="sr-only">Documentos de {owner}</caption>
            <thead><tr><th scope="col">Nome</th><th scope="col">Tamanho</th><th scope="col">Enviado em</th><th scope="col"><span className="sr-only">Download</span></th></tr></thead>
            <tbody>
              {documents.map(document => (
                <tr key={document.id}>
                  <td><div className="document-name"><FileText size={20} aria-hidden="true" /><span>{document.originalName}</span></div></td>
                  <td className="numeric-cell">{formatSize(document.size)}</td>
                  <td><time dateTime={document.uploadedAt}>{dateFormatter.format(new Date(document.uploadedAt))}</time></td>
                  <td><DownloadButton document={document} owner={owner} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}