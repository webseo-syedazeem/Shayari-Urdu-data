import { BookMarked } from 'lucide-react';
import { Collection } from '../services/api';

interface CollectionCardProps {
  collection: Collection;
  onClick?: () => void;
}

export default function CollectionCard({ collection, onClick }: CollectionCardProps) {
  return (
    <div
      className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 dark:border-neutral-700 hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={collection.cover_image}
          alt={collection.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center space-x-2 text-white/90 mb-2">
            <BookMarked size={16} />
            <span className="text-sm">{collection.itemCount || 0} items</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {collection.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{collection.description}</p>
      </div>
    </div>
  );
}
