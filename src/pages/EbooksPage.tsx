import { useState, useEffect } from 'react';
import EbookCard from '../components/EbookCard';
import { api, Ebook } from '../services/api';

interface EbooksPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export default function EbooksPage({ onNavigate }: EbooksPageProps) {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEbooks() {
      try {
        setLoading(true);
        const result = await api.getEbooks({ pageSize: 50 });
        setEbooks(result.data);
      } catch (error) {
        console.error('Error loading ebooks:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEbooks();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Ebooks</h1>
          <p className="text-lg text-gray-300">
            Explore our digital library of classic and contemporary Urdu poetry collections
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-gray-600">
            Browse <span className="font-semibold text-gray-900">{ebooks.length}</span> ebooks
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ebooks.map((ebook) => (
              <EbookCard
                key={ebook.id}
                ebook={ebook}
                onClick={() => onNavigate('ebook', ebook.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
