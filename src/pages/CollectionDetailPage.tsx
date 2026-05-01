import { useState, useEffect } from 'react';
import { BookMarked } from 'lucide-react';
import ShayariCard from '../components/ShayariCard';
import { api, Collection, Shayari } from '../services/api';

interface CollectionDetailPageProps {
  collectionId: string;
  onNavigate: (page: string, id?: string) => void;
}

export default function CollectionDetailPage({ collectionId, onNavigate }: CollectionDetailPageProps) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [collectionShayari, setCollectionShayari] = useState<Shayari[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCollection() {
      try {
        setLoading(true);
        const collectionRes = await api.getCollectionById(collectionId);
        setCollection(collectionRes);

        if (collectionRes) {
          setCollectionShayari(collectionRes.items || []);
        }
      } catch (error) {
        console.error('Error loading collection:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCollection();
  }, [collectionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Collection Not Found</h2>
          <button
            onClick={() => onNavigate('collections')}
            className="text-slate-700 hover:text-slate-900 font-medium"
          >
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-80 overflow-hidden">
        <img
          src={collection.cover_image || 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=800'}
          alt={collection.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
            <div className="flex items-center space-x-2 text-amber-300 mb-4">
              <BookMarked size={20} />
              <span className="text-sm font-medium">Collection</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {collection.title}
            </h1>
            <p className="text-xl text-gray-200 max-w-3xl">
              {collection.description}
            </p>
            <p className="text-amber-300 mt-4 font-medium">
              {collection.itemCount} items in this collection
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {collectionShayari.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collectionShayari.map((shayari) => (
              <ShayariCard
                key={shayari.id}
                shayari={shayari}
                onClick={() => onNavigate('shayari', shayari.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl text-gray-400">📚</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Items Yet</h3>
            <p className="text-gray-600">This collection is currently empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
