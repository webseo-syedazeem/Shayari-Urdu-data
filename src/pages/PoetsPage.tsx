import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import PoetCard from '../components/PoetCard';
import { api, Poet } from '../services/api';

interface PoetsPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export default function PoetsPage({ onNavigate }: PoetsPageProps) {
  const [poets, setPoets] = useState<Poet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('all');

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  useEffect(() => {
    async function loadPoets() {
      try {
        setLoading(true);
        const result = await api.getPoets({ pageSize: 100 });
        setPoets(result.data);
      } catch (error) {
        console.error('Error loading poets:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPoets();
  }, []);

  const filteredPoets = poets.filter((poet) => {
    const matchesSearch = poet.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLetter = selectedLetter === 'all' || poet.name.charAt(0).toUpperCase() === selectedLetter;
    return matchesSearch && matchesLetter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse Poets</h1>
          <p className="text-lg text-gray-300">
            Discover legendary poets and their timeless works
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search poets by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Filter by letter:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedLetter('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedLetter === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {alphabet.map((letter) => (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedLetter === letter
                      ? 'bg-slate-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">
            Found <span className="font-semibold text-gray-900">{filteredPoets.length}</span> poets
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
          </div>
        ) : filteredPoets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPoets.map((poet) => (
              <PoetCard
                key={poet.id}
                poet={poet}
                onClick={() => onNavigate('poet', poet.slug)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl text-gray-400">👤</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Poets Found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
