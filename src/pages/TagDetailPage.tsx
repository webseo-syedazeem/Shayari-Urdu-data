import { useState, useEffect } from 'react';
import { Hash } from 'lucide-react';
import ShayariCard from '../components/ShayariCard';
import FilterBar, { FilterState } from '../components/FilterBar';
import { api, Tag, Shayari } from '../services/api';
import { Seo } from '../components/seo/Seo';

interface TagDetailPageProps {
  tagSlug: string;
  onNavigate: (page: string, id?: string) => void;
}

export default function TagDetailPage({ tagSlug, onNavigate }: TagDetailPageProps) {
  const [tag, setTag] = useState<(Tag & { shayari?: Shayari[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    form: 'all',
    mood: 'all',
    length: 'all',
  });

  useEffect(() => {
    async function loadTag() {
      try {
        setLoading(true);
        const tagData = await api.getTag(tagSlug);
        setTag(tagData);
      } catch (error) {
        console.error('Error loading tag:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTag();
  }, [tagSlug]);

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

  if (!tag) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tag Not Found</h2>
          <button
            onClick={() => onNavigate('tags')}
            className="text-slate-700 hover:text-slate-900 font-medium"
          >
            Back to Tags
          </button>
        </div>
      </div>
    );
  }

  const tagShayari = tag.shayari || [];

  const filteredShayari = tagShayari.filter((shayari) => {
    if (filters.form !== 'all' && shayari.form !== filters.form) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Seo
        title={tag.seo_title || `${tag.name} Shayari`}
        description={tag.seo_description || tag.description || `Explore beautiful ${tag.name} shayari`}
        keywords={tag.seo_keywords || undefined}
      />

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Hash className="text-white" size={48} />
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">#{tag.name}</h1>
              {tag.description && (
                <p className="text-xl text-gray-300 mb-4">{tag.description}</p>
              )}
              <p className="text-lg text-amber-300">
                {tagShayari.length} shayari and quotes available
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FilterBar onFilterChange={setFilters} />

        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredShayari.length}</span> results
          </p>
        </div>

        {filteredShayari.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShayari.map((shayari) => (
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
              <span className="text-4xl text-gray-400">📝</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600">
              {tagShayari.length === 0
                ? `No shayari in this tag yet`
                : `Try adjusting your filters to see more results`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
