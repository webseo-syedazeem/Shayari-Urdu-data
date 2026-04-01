import { useState, useEffect } from 'react';
import ShayariCard from '../components/ShayariCard';
import FilterBar, { FilterState } from '../components/FilterBar';
import { AdSlot } from '../components/ads/AdSlot';
import { api, Shayari } from '../services/api';

interface ExplorePageProps {
  onNavigate: (page: string, id?: string) => void;
}

export default function ExplorePage({ onNavigate }: ExplorePageProps) {
  const [shayari, setShayari] = useState<Shayari[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLanguage, setActiveLanguage] = useState<'roman' | 'urdu' | 'hindi' | 'english'>('roman');
  const [filters, setFilters] = useState<FilterState>({
    form: 'all',
    mood: 'all',
    length: 'all',
  });

  const languages = [
    { id: 'roman', label: 'Roman Urdu' },
    { id: 'urdu', label: 'Urdu' },
    { id: 'hindi', label: 'Hindi' },
    { id: 'english', label: 'English' },
  ];

  useEffect(() => {
    async function loadShayari() {
      try {
        setLoading(true);
        const result = await api.getShayari({
          language: activeLanguage,
          form: filters.form !== 'all' ? filters.form as any : undefined,
          pageSize: 50
        });
        setShayari(result.data);
      } catch (error) {
        console.error('Error loading shayari:', error);
      } finally {
        setLoading(false);
      }
    }

    loadShayari();
  }, [activeLanguage, filters.form]);

  const filteredShayari = shayari;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Explore Shayari</h1>
          <p className="text-lg text-gray-300">
            Browse through our collection of beautiful poetry across multiple languages
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-2 mb-8 border border-gray-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setActiveLanguage(lang.id as any)}
                className={`px-6 py-4 rounded-lg font-semibold text-center transition-all ${
                  activeLanguage === lang.id
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-9">
            <FilterBar onFilterChange={setFilters} />

            <div className="mb-6">
              <p className="text-gray-600">
                Found <span className="font-semibold text-gray-900">{filteredShayari.length}</span> results
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
              </div>
            ) : filteredShayari.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShayari.map((shayari, index) => (
                  <>
                    <ShayariCard
                      key={shayari.id}
                      shayari={shayari}
                      onClick={() => onNavigate('shayari', shayari.id)}
                    />
                    {(index + 1) % 6 === 0 && (
                      <div key={`ad-${index}`} className="md:col-span-2 lg:col-span-3">
                        <AdSlot placement="between_shayari_cards" pageScope="explore" index={index} />
                      </div>
                    )}
                  </>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl text-gray-400">📝</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-600">Try adjusting your filters to see more results</p>
              </div>
            )}
          </div>

          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="sticky top-24">
              <AdSlot placement="sidebar" pageScope="explore" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
