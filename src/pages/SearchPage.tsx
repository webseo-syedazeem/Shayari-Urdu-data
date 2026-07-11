import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import ShayariCard from '../components/ShayariCard';
import PoetCard from '../components/PoetCard';
import TopicCard from '../components/TopicCard';
import CollectionCard from '../components/CollectionCard';
import { api, Shayari, Poet, Topic, Collection } from '../services/api';
import { getShayariUrl } from '../utils/shayariUrl';

interface SearchPageProps {
  initialQuery?: string;
  onNavigate: (page: string, id?: string) => void;
}

export default function SearchPage({ initialQuery = '', onNavigate }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'shayari' | 'poets' | 'topics' | 'collections'>('all');
  const [loading, setLoading] = useState(false);

  const [filteredShayari, setFilteredShayari] = useState<Shayari[]>([]);
  const [filteredPoets, setFilteredPoets] = useState<Poet[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const [shayariRes, poetsRes, topicsRes, collectionsRes] = await Promise.all([
        api.getShayari({ search: query, pageSize: 20 }),
        api.getPoets({ search: query, pageSize: 20 }),
        api.getTopics({ search: query }),
        api.getCollections({ search: query, pageSize: 20 })
      ]);

      setFilteredShayari(shayariRes.data);
      setFilteredPoets(poetsRes.data);
      setFilteredTopics(topicsRes.data);
      setFilteredCollections(collectionsRes.data);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalResults = filteredShayari.length + filteredPoets.length + filteredTopics.length + filteredCollections.length;

  const tabs = [
    { id: 'all', label: 'All', count: totalResults },
    { id: 'shayari', label: 'Shayari', count: filteredShayari.length },
    { id: 'poets', label: 'Poets', count: filteredPoets.length },
    { id: 'topics', label: 'Topics', count: filteredTopics.length },
    { id: 'collections', label: 'Collections', count: filteredCollections.length },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Search Results</h1>

          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search shayari, poets, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-gray-900 border-0 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </form>

          {searchQuery && (
            <p className="mt-4 text-gray-300">
              Searching for: <span className="text-amber-300 font-semibold">{searchQuery}</span>
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
          </div>
        ) : !searchQuery ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Your Search</h3>
            <p className="text-gray-600">Enter keywords to find shayari, poets, topics, and collections</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-2 mb-8 border border-gray-200">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 min-w-[100px] px-4 py-3 rounded-lg font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-slate-700 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                    <span className="ml-2 text-sm opacity-80">({tab.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {totalResults === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl text-gray-400">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-600">Try different keywords or browse our collections</p>
              </div>
            ) : (
              <>
                {(activeTab === 'all' || activeTab === 'shayari') && filteredShayari.length > 0 && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Shayari ({filteredShayari.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredShayari.slice(0, activeTab === 'all' ? 6 : undefined).map((shayari) => (
                        <ShayariCard
                          key={shayari.id}
                          shayari={shayari}
                          onClick={() => onNavigate('shayari', getShayariUrl(shayari))}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {(activeTab === 'all' || activeTab === 'poets') && filteredPoets.length > 0 && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Poets ({filteredPoets.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredPoets.slice(0, activeTab === 'all' ? 6 : undefined).map((poet) => (
                        <PoetCard
                          key={poet.id}
                          poet={poet}
                          onClick={() => onNavigate('poet', poet.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {(activeTab === 'all' || activeTab === 'topics') && filteredTopics.length > 0 && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Topics ({filteredTopics.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredTopics.slice(0, activeTab === 'all' ? 6 : undefined).map((topic) => (
                        <TopicCard
                          key={topic.id}
                          topic={topic}
                          onClick={() => onNavigate('topic', topic.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {(activeTab === 'all' || activeTab === 'collections') && filteredCollections.length > 0 && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Collections ({filteredCollections.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredCollections.slice(0, activeTab === 'all' ? 6 : undefined).map((collection) => (
                        <CollectionCard
                          key={collection.id}
                          collection={collection}
                          onClick={() => onNavigate('collection', collection.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
