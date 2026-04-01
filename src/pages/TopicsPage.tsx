import { useState, useEffect } from 'react';
import TopicCard from '../components/TopicCard';
import { api, Topic } from '../services/api';

interface TopicsPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export default function TopicsPage({ onNavigate }: TopicsPageProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTopics() {
      try {
        setLoading(true);
        const result = await api.getTopics();
        setTopics(result.data);
      } catch (error) {
        console.error('Error loading topics:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTopics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse by Topic</h1>
          <p className="text-lg text-gray-300">
            Explore shayari organized by themes, moods, and subjects
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-gray-600">
            Discover <span className="font-semibold text-gray-900">{topics.length}</span> topics
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onClick={() => onNavigate('topic', topic.slug)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
