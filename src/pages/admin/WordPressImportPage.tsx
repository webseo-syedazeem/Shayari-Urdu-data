import { useState, useRef } from 'react';
import { ArrowLeft, Download, Square } from 'lucide-react';
import { API_BASE_URL } from '../../lib/supabase';

interface WordPressImportPageProps {
  onNavigate: (page: string) => void;
}

interface ImportProgress {
  totalFetched: number;
  imported: number;
  skipped: number;
  errors: string[];
  currentPage: number;
  lastPostId: number;
}

const emptyProgress = (): ImportProgress => ({
  totalFetched: 0,
  imported: 0,
  skipped: 0,
  errors: [],
  currentPage: 0,
  lastPostId: 0,
});

export default function WordPressImportPage({ onNavigate }: WordPressImportPageProps) {
  const [wordpressUrl, setWordpressUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [progress, setProgress] = useState<ImportProgress>(emptyProgress);
  const [completed, setCompleted] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleImport = async () => {
    if (!wordpressUrl.trim()) {
      alert('Please enter a WordPress URL');
      return;
    }

    setImporting(true);
    setCompleted(false);
    setImportError(null);
    setStatusMessage('Connecting...');
    setProgress(emptyProgress());

    const token = localStorage.getItem('adminAccessToken');
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(API_BASE_URL + '/api/import/wordpress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ siteUrl: wordpressUrl.trim() }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Import failed' }));
        throw new Error(err.error || 'Import failed');
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'status') {
              setStatusMessage(data.message ?? '');
            } else if (data.type === 'progress') {
              setStatusMessage(data.message ?? '');
              setProgress(prev => ({
                ...prev,
                totalFetched: data.totalFetched ?? 0,
                imported: data.imported ?? 0,
                skipped: data.skipped ?? 0,
                errors: data.errors ?? [],
                currentPage: data.currentPage ?? 0,
                lastPostId: data.lastPostId ?? 0,
              }));
            } else if (data.type === 'complete') {
              setProgress(prev => ({
                ...prev,
                totalFetched: data.totalFetched ?? 0,
                imported: data.imported ?? 0,
                skipped: data.skipped ?? 0,
                errors: data.errors ?? [],
                currentPage: data.currentPage ?? 0,
                lastPostId: data.lastPostId ?? 0,
              }));
              setStatusMessage('');
              setCompleted(true);
            } else if (data.type === 'error') {
              setProgress(prev => ({ ...prev, errors: data.errors ?? prev.errors }));
              setImportError(data.message ?? 'Unknown error');
            }
          } catch { /* ignore malformed SSE lines */ }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setImportError(err.message || 'Import failed');
      } else {
        setStatusMessage('Import stopped.');
      }
    } finally {
      setImporting(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const showProgress = importing || completed || progress.imported > 0 || progress.skipped > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => onNavigate('admin')}
          className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Download size={32} className="text-amber-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">WordPress Import</h1>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              WordPress URL
            </label>
            <input
              type="text"
              value={wordpressUrl}
              onChange={(e) => setWordpressUrl(e.target.value)}
              placeholder="https://shayariurdu.com/wp-json/wp/v2/posts?per_page=50"
              disabled={importing}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
       
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleImport}
              disabled={importing || !wordpressUrl.trim()}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              {importing ? 'Importing...' : 'Start Shayari Import'}
            </button>

            {importing && (
              <button
                onClick={handleStop}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Square size={18} />
                <span>Stop</span>
              </button>
            )}
          </div>

          {statusMessage && (
            <p className="mt-3 text-sm text-blue-600 dark:text-blue-400 animate-pulse">{statusMessage}</p>
          )}

          {showProgress && (
            <div className="mt-8 p-6 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Import Progress</h2>
              <div className="space-y-3">
                {progress.currentPage > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Current Page:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {progress.currentPage}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total Fetched:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{progress.totalFetched}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Imported:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">{progress.imported}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Skipped:</span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">{progress.skipped}</span>
                </div>

                {progress.errors.length > 0 && (
                  <div className="mt-4">
                    <span className="text-red-600 dark:text-red-400 font-semibold">Errors: {progress.errors.length}</span>
                    <div className="mt-2 max-h-40 overflow-y-auto bg-red-50 dark:bg-red-900/20 p-3 rounded">
                      {[...new Set(progress.errors)].slice(0, 5).map((error, i) => (
                        <div key={i} className="text-xs text-red-600 dark:text-red-400 mb-2 font-mono">{error}</div>
                      ))}
                      {progress.errors.length > 5 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                          ...and {progress.errors.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {completed && !importError && progress.errors.length === 0 && (
                <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded">
                  Import completed! {progress.imported} posts imported.
                </div>
              )}
              {completed && !importError && progress.errors.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded">
                  Import finished. {progress.imported} imported, {progress.errors.length} error(s).
                </div>
              )}
            </div>
          )}

          {importError && (
            <div className="mt-6 p-6 bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-700 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Import Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300">{importError}</p>
              {progress.currentPage > 1 && (
                <div className="mt-3">
                  <p className="text-xs text-red-600 dark:text-red-400 mb-1">
  Paused on page {progress.currentPage} — use this URL to resume:
</p>
                  <code className="block text-xs bg-red-50 dark:bg-red-900/40 text-red-800 dark:text-red-300 p-2 rounded break-all">
                    {wordpressUrl.split('?')[0]}?per_page=100&start_page={progress.currentPage}
                  </code>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
