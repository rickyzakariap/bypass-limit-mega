import { useState } from 'react'

function formatBytes(bytes, decimals = 2) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function App() {
  const [megaUrl, setMegaUrl] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const [directLink, setDirectLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const apiEndpoint = 'https://mega.wldbs.workers.dev/api/info';

  const getFileInfo = async () => {
    if (loading || !megaUrl.trim()) return;
    setLoading(true);
    setError(null);
    setFileInfo(null);
    setDirectLink('');
    if (!megaUrl.startsWith('https://mega.nz/file/')) {
      setError('Only Mega.nz file links are supported (must start with https://mega.nz/file/). Folders are not supported.');
      setLoading(false);
      return;
    }
    const formData = new FormData();
    formData.append('megaurl', megaUrl);
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok && response.status !== 400) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      const data = await response.json();
      if (data.ok) {
        setFileInfo(data);
        const base64Url = btoa(megaUrl);
        setDirectLink(`https://mega.wldbs.workers.dev/download?url=${base64Url}`);
      } else {
        throw new Error(data.error || 'The API could not process the URL.');
      }
    } catch (e) {
      setError(e.message || 'Failed to fetch file info.');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = () => {
    if (!directLink || isDownloading) return;
    setIsDownloading(true);
    setError(null);
    setTimeout(() => {
      window.location.href = directLink;
      setTimeout(() => setIsDownloading(false), 5000);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md sm:max-w-lg px-4 sm:px-8 py-8 rounded-2xl shadow-2xl bg-white/40 backdrop-blur-2xl border border-white/60 flex flex-col items-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-2 text-neutral-900 drop-shadow">Mega.nz Direct Link</h1>
        <p className="text-base text-neutral-700 text-center mb-6">Paste your Mega.nz file URL to generate a direct download link.</p>
        <input
          type="url"
          value={megaUrl}
          onChange={e => setMegaUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && getFileInfo()}
          placeholder="https://mega.nz/file/..."
          className="w-full px-4 py-2 border border-white/60 bg-white/60 text-neutral-900 placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 mb-3 backdrop-blur"
          disabled={loading}
        />
        <button
          onClick={getFileInfo}
          disabled={loading || !megaUrl}
          className="w-full py-2 bg-blue-600 text-white text-base font-semibold rounded-lg focus:outline-none hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed mb-4 transition"
        >
          {loading ? 'Generating...' : 'Generate Link'}
        </button>
        {error && (
          <div className="bg-red-200/80 text-red-800 px-2 py-1 text-sm w-full text-center mb-2 rounded-lg">
            {error}
          </div>
        )}
        {fileInfo && (
          <div className="space-y-1 text-sm w-full bg-white/60 rounded-lg p-4 mt-2 backdrop-blur">
            <div className="flex justify-between">
              <span className="text-neutral-700">File Name:</span>
              <span className="text-neutral-900 text-right break-all max-w-[60%]">{fileInfo.file_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-700">File Size:</span>
              <span className="text-neutral-900">{formatBytes(fileInfo.file_size)}</span>
            </div>
            <button
              onClick={downloadFile}
              disabled={isDownloading}
              className="w-full py-2 mt-2 bg-green-600 text-white text-base font-semibold rounded-lg focus:outline-none hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition"
            >
              {isDownloading ? 'Downloading...' : 'Download Now'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
