import { useState, useEffect } from 'react';
import { Search, Book } from 'lucide-react';
import DictionaryWordCard from '../components/DictionaryWordCard';
import { api, DictionaryEntry } from '../services/api';

interface DictionaryPageProps {
  onNavigate: (page: string, id?: string) => void;
  initialQuery?: string;
}

export default function DictionaryPage({ onNavigate, initialQuery = '' }: DictionaryPageProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<DictionaryEntry[]>([]);
  const [popularWords, setPopularWords] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('recentDictionarySearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }

    loadPopularWords();
  }, []);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  async function loadPopularWords() {
    try {
      setLoading(true);
      const result = await api.getDictionaryEntries({ pageSize: 12 });
      setPopularWords(result.data);
      if (!searchQuery) {
        setSearchResults(result.data);
      }
    } catch (error) {
      console.error('Error loading dictionary:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) {
      setSearchResults(popularWords);
      return;
    }

    try {
      setLoading(true);
      const result = await api.getDictionaryEntries({
        search: query,
        pageSize: 50
      });
      setSearchResults(result.data);

      if (query.trim() && !recentSearches.includes(query)) {
        const updated = [query, ...recentSearches].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentDictionarySearches', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error searching dictionary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-600 rounded-full mb-6">
              <Book size={40} className="text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Urdu & Shayari Dictionary
            </h1>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Find meanings of words from Urdu, Roman Urdu, Hindi and English – with examples from classic shayari.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for any word in Urdu, Roman Urdu, Hindi or English..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-4 py-5 text-lg text-gray-900 border-0 rounded-xl focus:ring-2 focus:ring-amber-500 shadow-lg"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
          </div>
        ) : searchQuery ? (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Search Results for "{searchQuery}"
            </h2>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((entry) => (
                  <DictionaryWordCard
                    key={entry.id}
                    entry={entry}
                    onClick={() => onNavigate('dictionary-word', entry.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={40} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-600">
                  Try searching with different spelling or a related word
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Words</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {popularWords.map((entry) => (
                  <DictionaryWordCard
                    key={entry.id}
                    entry={entry}
                    onClick={() => onNavigate('dictionary-word', entry.id)}
                  />
                ))}
              </div>
            </div>

            {recentSearches.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Searches</h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((query, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchQuery(query);
                        handleSearch(query);
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
