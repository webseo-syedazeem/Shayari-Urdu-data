import * as Icons from 'lucide-react';
import { Topic } from '../services/api';

interface TopicCardProps {
  topic: Topic;
  onClick?: () => void;
}

export default function TopicCard({ topic, onClick }: TopicCardProps) {
  const IconComponent = (Icons as any)[topic.icon] || Icons.BookOpen;

  return (
    <div
      className="bg-gradient-to-br from-slate-50 to-white dark:from-neutral-800 dark:to-neutral-800 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 p-6 cursor-pointer border border-gray-100 dark:border-neutral-700 hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-500 rounded-lg flex items-center justify-center">
          <IconComponent className="text-white" size={24} />
        </div>
        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
          {topic.count}
        </span>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{topic.name}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{topic.description}</p>
    </div>
  );
}
