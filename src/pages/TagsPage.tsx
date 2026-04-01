import { useState, useEffect } from 'react';
import TagCard from '../components/TagCard';
import { api, Tag } from '../services/api';

interface TagsPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export default function TagsPage({ onNavigate }: TagsPageProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTags() {
      try {
        setLoading(true);
        const result = await api.getTags();
        setTags(result.data);
      } catch (error) {
        console.error('Error loading tags:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTags();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse by Tag</h1>
          <p className="text-lg text-gray-300">
            Explore shayari organized by popular tags and themes
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-gray-600">
            Discover <span className="font-semibold text-gray-900">{tags.length}</span> tags
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tags.map((tag) => (
              <TagCard
                key={tag.id}
                tag={tag}
                onClick={() => onNavigate('tag', tag.slug)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
