import { Hash } from 'lucide-react';
import { Tag } from '../services/api';

interface TagCardProps {
  tag: Tag;
  onClick: () => void;
}

export default function TagCard({ tag, onClick }: TagCardProps) {
  return (
    <button
      onClick={onClick}
      className="group bg-white dark:bg-neutral-800 rounded-lg shadow-sm hover:shadow-md transition-all p-6 text-left border border-gray-200 dark:border-neutral-700 hover:border-amber-500 dark:hover:border-amber-500"
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
          <Hash className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {tag.name}
        </h3>
      </div>
      {tag.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
          {tag.description}
        </p>
      )}
      {tag.count !== undefined && tag.count > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {tag.count} {tag.count === 1 ? 'shayari' : 'shayari'}
        </div>
      )}
    </button>
  );
}
