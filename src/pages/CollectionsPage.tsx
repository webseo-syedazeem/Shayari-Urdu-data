import { useState, useEffect } from 'react';
import CollectionCard from '../components/CollectionCard';
import { api, Collection } from '../services/api';

interface CollectionsPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export default function CollectionsPage({ onNavigate }: CollectionsPageProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCollections() {
      try {
        setLoading(true);
        const result = await api.getCollections({ pageSize: 50 });
        setCollections(result.data);
      } catch (error) {
        console.error('Error loading collections:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCollections();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Curated Collections</h1>
          <p className="text-lg text-gray-300">
            Handpicked selections of shayari for every mood and occasion
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-gray-600">
            Browse <span className="font-semibold text-gray-900">{collections.length}</span> collections
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onClick={() => onNavigate('collection', collection.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
