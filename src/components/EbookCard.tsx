import { BookOpen, FileText } from 'lucide-react';
import { Ebook } from '../services/api';

interface EbookCardProps {
  ebook: Ebook;
  onClick?: () => void;
}

export default function EbookCard({ ebook, onClick }: EbookCardProps) {
  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 dark:border-slate-700 hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-700 dark:to-slate-800">
        <img
          src={ebook.cover_image_url || 'https://images.pexels.com/photos/256559/pexels-photo-256559.jpeg?auto=compress&cs=tinysrgb&w=400'}
          alt={ebook.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        {ebook.total_pages && (
          <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full">
            <div className="flex items-center space-x-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              <FileText size={14} />
              <span>{ebook.total_pages} pages</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {ebook.title}
        </h3>
        {ebook.poets && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 font-medium">{ebook.poets.name}</p>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">{ebook.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
              {ebook.language || 'Urdu'}
            </span>
          </div>
          <button className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-sm">
            <BookOpen size={16} />
            <span>View</span>
          </button>
        </div>
      </div>
    </div>
  );
}
