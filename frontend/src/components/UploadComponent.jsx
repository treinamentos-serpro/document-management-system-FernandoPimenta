import { useRef, useState } from 'react';
import { LoaderCircle, Upload } from 'lucide-react';
import { uploadDocument } from '../services/documentApi';

export default function UploadComponent({ owner, onUploaded }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || !owner || uploading) return;
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const document = await uploadDocument(file, owner);
      setSuccess(`${document.originalName} enviado com sucesso.`);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      onUploaded(document);
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-heading">
      <h2 id="upload-heading">Novo documento</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="file-control">
          <label htmlFor="document-file">Arquivo</label>
          <input ref={inputRef} id="document-file" type="file" required disabled={!owner || uploading}
            onChange={event => {
              setFile(event.target.files[0] || null);
              setError('');
              setSuccess('');
            }} />
        </div>
        <button className="primary-button" type="submit" disabled={!owner || !file || uploading}>
          {uploading ? <LoaderCircle className="spinner" size={18} aria-hidden="true" /> : <Upload size={18} aria-hidden="true" />}
          {uploading ? 'Enviando...' : 'Enviar documento'}
        </button>
      </form>
      {error && <p className="error-message" role="alert">{error}</p>}
      {success && <p className="success-message" role="status">{success}</p>}
    </section>
  );
}