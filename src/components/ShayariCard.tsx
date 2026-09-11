import { Heart, Bookmark, Share2 } from 'lucide-react';
import { Shayari } from '../services/api';

const FALLBACK_IMAGE = '/images/shayari-image-not-found.svg';

interface ShayariCardProps {
  shayari: Shayari;
  onClick?: () => void;
  showStar?: boolean;
}

export default function ShayariCard({ shayari, onClick, showStar = false }: ShayariCardProps) {
  const firstVersion = shayari.shayari_language_versions?.[0];
  const poetName = shayari.poets?.name || 'Unknown Poet';
  const text = firstVersion?.text || 'No text available';
  const language = firstVersion?.language || 'unknown';

  const getLanguageColor = (lang: string) => {
    switch (lang) {
      case 'roman': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'urdu': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'hindi': return 'bg-green-100 text-green-700 border-green-200';
      case 'english': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getLanguageLabel = (lang: string) => {
    if (lang === 'roman' || lang === 'roman_urdu') return 'Roman Urdu';
    return lang
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="relative h-full">
      {showStar && (
        <div className="absolute -top-3 -right-3 z-10 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
          <span className="text-white text-xl">⭐</span>
        </div>
      )}
      <div
        className="h-full bg-white dark:bg-neutral-800 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 dark:border-neutral-700 hover:-translate-y-1 relative overflow-hidden flex flex-col"
        onClick={onClick}
      >
        <div className="w-full h-48 shrink-0 overflow-hidden bg-slate-100 dark:bg-neutral-700">
          <img
            src={shayari.featured_image_url || FALLBACK_IMAGE}
            alt={shayari.featured_image_alt || 'Shayari image not available'}
            className="w-full h-full object-cover"
            onError={(event) => {
              if (!event.currentTarget.src.endsWith(FALLBACK_IMAGE)) {
                event.currentTarget.src = FALLBACK_IMAGE;
              }
            }}
          />
        </div>
        <div className="p-6 flex flex-col flex-1">
          <div className="mb-4 min-h-[5.25rem]">
            <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 line-clamp-3 font-serif">
              {text}
            </p>
          </div>

        <div className="flex items-center justify-between mb-4 min-h-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {poetName.charAt(0)}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{poetName}</span>
          </div>
        </div>

        <div className="mb-3">
          <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold border ${getLanguageColor(language)}`}>
            {getLanguageLabel(language)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 rounded text-xs">
            {shayari.form}
          </span>
          {shayari.is_trending && (
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded text-xs">
              Trending
            </span>
          )}
        </div>

          <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100 dark:border-neutral-700">
            <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
              <button className="flex items-center space-x-1 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                <Heart size={16} />
                <span className="text-xs">{shayari.popularity_score}</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                <Bookmark size={16} />
              </button>
            </div>
            <button className="text-gray-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-neutral-300 transition-colors">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
