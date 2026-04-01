import { useState, useEffect } from 'react';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { WordPressImporter } from '../../services/wordpressImporter';

interface WordPressImportPageProps {
  onNavigate: (page: string) => void;
}

export default function WordPressImportPage({ onNavigate }: WordPressImportPageProps) {
  const [wordpressUrl, setWordpressUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({
    totalFetched: 0,
    imported: 0,
    skipped: 0,
    errors: [] as string[],
    currentPage: 0,
    lastPostId: 0,
    authExpired: false
  });
  const [completed, setCompleted] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [hasResumableState, setHasResumableState] = useState(false);

  useEffect(() => {
    const importer = new WordPressImporter('');
    setHasResumableState(importer.hasResumableState());
  }, []);

  const handleImport = async () => {
    if (!wordpressUrl.trim()) {
      alert('Please enter a WordPress URL');
      return;
    }

    setImporting(true);
    setCompleted(false);
    setImportError(null);
    setProgress({
      totalFetched: 0,
      imported: 0,
      skipped: 0,
      errors: [],
      currentPage: 0,
      lastPostId: 0,
      authExpired: false
    });

    try {
      const importer = new WordPressImporter(wordpressUrl);
      const result = await importer.import((p) => {
        setProgress(p);
      });
      setProgress(result);

      if (result.authExpired) {
        setImportError('Session expired. Please re-login and click Resume to continue.');
      } else {
        setCompleted(true);
      }
    } catch (error: any) {
      if (error?.message === 'AUTH_EXPIRED') {
        setImportError('Session expired. Please re-login and click Resume to continue.');
      } else {
        setImportError(error instanceof Error ? error.message : String(error));
      }
      setCompleted(true);
    } finally {
      setImporting(false);
      const importer = new WordPressImporter(wordpressUrl);
      setHasResumableState(importer.hasResumableState());
    }
  };

  const handleResume = async () => {
    if (!wordpressUrl.trim()) {
      alert('Please enter a WordPress URL');
      return;
    }

    setImporting(true);
    setCompleted(false);
    setImportError(null);

    try {
      const importer = new WordPressImporter(wordpressUrl);
      const result = await importer.resume((p) => {
        setProgress(p);
      });
      setProgress(result);

      if (result.authExpired) {
        setImportError('Session expired. Please re-login and click Resume to continue.');
      } else {
        setCompleted(true);
      }
    } catch (error: any) {
      if (error?.message === 'AUTH_EXPIRED') {
        setImportError('Session expired. Please re-login and click Resume to continue.');
      } else {
        setImportError(error instanceof Error ? error.message : String(error));
      }
      setCompleted(true);
    } finally {
      setImporting(false);
      const importer = new WordPressImporter(wordpressUrl);
      setHasResumableState(importer.hasResumableState());
    }
  };

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
              WordPress Base URL
            </label>
            <input
              type="text"
              value={wordpressUrl}
              onChange={(e) => setWordpressUrl(e.target.value)}
              placeholder="https://example.com"
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
              {importing ? 'Importing...' : 'Start Import'}
            </button>

            {hasResumableState && (
              <button
                onClick={handleResume}
                disabled={importing || !wordpressUrl.trim()}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                <RefreshCw size={20} />
                <span>Resume</span>
              </button>
            )}
          </div>

          {(importing || completed || progress.imported > 0) && (
            <div className="mt-8 p-6 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Import Progress
              </h2>
              <div className="space-y-3">
                {progress.currentPage > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Current Page:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{progress.currentPage}</span>
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
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      Errors: {progress.errors.length}
                    </span>
                    <div className="mt-2 max-h-40 overflow-y-auto bg-red-50 dark:bg-red-900/20 p-3 rounded">
                      {[...new Set(progress.errors)].slice(0, 3).map((error, i) => (
                        <div key={i} className="text-xs text-red-600 dark:text-red-400 mb-2 font-mono">
                          {error}
                        </div>
                      ))}
                      {progress.errors.length > 3 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">
                          ... and {progress.errors.length - 3} more errors
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {completed && progress.imported > 0 && progress.errors.length === 0 && !importError && (
                <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded">
                  Import completed! Imported {progress.imported} posts.
                </div>
              )}
              {completed && progress.imported > 0 && progress.errors.length > 0 && !importError && (
                <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded">
                  Import finished with errors. Imported {progress.imported} posts, {progress.errors.length} errors occurred.
                </div>
              )}
              {completed && progress.imported === 0 && !importError && (
                <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded">
                  Import completed with no posts imported. Check errors above.
                </div>
              )}
            </div>
          )}

          {importError && (
            <div className="mt-6 p-6 bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-700 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Import Issue</h3>
              <p className="text-sm text-red-700 dark:text-red-300">{importError}</p>
              {importError.includes('Session expired') && (
                <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                  Please refresh the page, log back in, and use the Resume button to continue.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
