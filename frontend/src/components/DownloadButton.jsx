import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import { downloadDocument } from '../services/documentApi';

export default function DownloadButton({ document, owner }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    if (downloading || !owner) return;
    setDownloading(true);
    setError('');
    try {
      const blob = await downloadDocument(document.id, owner);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = document.originalName;
      window.document.body.appendChild(anchor);
      try {
        anchor.click();
      } finally {
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="download-control">
      <button type="button" className="icon-button" onClick={handleDownload} disabled={downloading || !owner}
        title={downloading ? 'Baixando documento' : `Baixar ${document.originalName}`}
        aria-label={downloading ? `Baixando ${document.originalName}` : `Baixar ${document.originalName}`}>
        {downloading ? <LoaderCircle className="spinner" size={19} aria-hidden="true" /> : <Download size={19} aria-hidden="true" />}
      </button>
      {error && <p className="error-message download-error" role="alert">{error}</p>}
    </div>
  );
}