import { useState, useEffect } from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { api, DictionaryEntry, Shayari } from '../services/api';

interface DictionaryDetailPageProps {
  wordId: string;
  onNavigate: (page: string, id?: string) => void;
}

export default function DictionaryDetailPage({ wordId, onNavigate }: DictionaryDetailPageProps) {
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [exampleShayari, setExampleShayari] = useState<Shayari[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'meanings' | 'examples'>('meanings');

  useEffect(() => {
    async function loadEntry() {
      console.log('DictionaryDetailPage - Loading entry with ID:', wordId);

      try {
        setLoading(true);
        setError(null);

        const entryRes = await api.getDictionaryEntryById(wordId);
        console.log('DictionaryDetailPage - Loaded entry:', entryRes);

        if (!entryRes) {
          setError('Dictionary entry not found');
          setEntry(null);
          setExampleShayari([]);
        } else {
          setEntry(entryRes);

          try {
            const shayariRes = await api.getShayari({ search: entryRes.word_key, pageSize: 4 });
            setExampleShayari(shayariRes.data || []);
          } catch (shayariErr) {
            console.error('DictionaryDetailPage - Error loading example shayari:', shayariErr);
            setExampleShayari([]);
          }
        }
      } catch (err: any) {
        console.error('DictionaryDetailPage - Error loading dictionary entry:', err);
        setError(err?.message || 'Failed to load dictionary entry');
        setEntry(null);
        setExampleShayari([]);
      } finally {
        setLoading(false);
      }
    }

    if (wordId) {
      loadEntry();
    } else {
      setError('No word ID provided');
      setLoading(false);
    }
  }, [wordId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dictionary entry...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Word</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => onNavigate('dictionary')}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
          >
            Back to Dictionary
          </button>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Word Not Found</h2>
          <p className="text-gray-600 mb-6">The dictionary entry you're looking for doesn't exist.</p>
          <button
            onClick={() => onNavigate('dictionary')}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
          >
            Back to Dictionary
          </button>
        </div>
      </div>
    );
  }

  const getDisplayWord = () => {
    return entry.word_urdu || entry.word_roman || entry.word_english || entry.word_key;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => onNavigate('dictionary')}
            className="text-gray-300 hover:text-white mb-6 flex items-center space-x-2"
          >
            <span>← Back to Dictionary</span>
          </button>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-serif">
            {getDisplayWord()}
          </h1>

          <div className="flex flex-wrap gap-4 mb-4 text-lg">
            {entry.word_roman && (
              <span className="text-gray-300">{entry.word_roman}</span>
            )}
            {entry.word_hindi && (
              <span className="text-gray-300">• {entry.word_hindi}</span>
            )}
            {entry.word_english && (
              <span className="text-gray-300">• {entry.word_english}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {entry.part_of_speech && (
              <span className="px-3 py-1 bg-amber-600 text-white rounded-full text-sm font-medium">
                {entry.part_of_speech}
              </span>
            )}
            {entry.pronunciation && (
              <span className="px-3 py-1 bg-white/10 text-white rounded-full text-sm">
                /{entry.pronunciation}/
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-2 mb-8 border border-gray-200">
          <div className="flex gap-2">
            {[
              { id: 'meanings', label: 'Meanings' },
              { id: 'examples', label: 'Examples from Shayari', count: exampleShayari.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 text-sm opacity-80">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'meanings' && (
          <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Meanings</h2>

            {entry.meanings_english && entry.meanings_english.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">English</h3>
                <ul className="space-y-3">
                  {entry.meanings_english.map((meaning, idx) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700 text-lg">{meaning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {entry.meanings_urdu && entry.meanings_urdu.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Urdu</h3>
                <ul className="space-y-3">
                  {entry.meanings_urdu.map((meaning, idx) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700 text-xl font-serif">{meaning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!entry.meanings_english?.length && !entry.meanings_urdu?.length && (
              <div className="text-center py-8 text-gray-500">
                No meanings available for this word.
              </div>
            )}

            {entry.notes && (
              <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
                <p className="text-gray-700 leading-relaxed">{entry.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'examples' && (
          <div>
            {exampleShayari.length > 0 ? (
              <div className="space-y-6">
                {exampleShayari.map((shayari) => (
                  <div
                    key={shayari.id}
                    className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onNavigate('shayari', shayari.id)}
                  >
                    <p className="text-xl leading-relaxed text-gray-800 mb-4 font-serif">
                      {shayari.text_roman || shayari.text_urdu || shayari.text_english}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      {shayari.poets && (
                        <span className="text-gray-600 font-medium">— {shayari.poets.name}</span>
                      )}
                      <div className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 font-medium transition-colors">
                        <span>View Full Shayari</span>
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-100">
                <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Examples Available
                </h3>
                <p className="text-gray-600">
                  We don't have shayari examples for this word yet
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
