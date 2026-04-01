import { Poet } from '../services/api';

interface PoetCardProps {
  poet: Poet;
  onClick?: () => void;
}

export default function PoetCard({ poet, onClick }: PoetCardProps) {
  const birthYear = poet.birth_year || '';
  const deathYear = poet.death_year ? ` - ${poet.death_year}` : '';
  const yearsText = birthYear ? `${birthYear}${deathYear}` : '';

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 p-6 cursor-pointer border border-gray-100 dark:border-slate-700 hover:-translate-y-1 text-center"
      onClick={onClick}
    >
      <div className="mb-4">
        <img
          src={poet.avatar_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200'}
          alt={poet.name}
          className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-gray-100 dark:border-slate-700"
        />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{poet.name}</h3>
      {yearsText && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{yearsText}</p>
      )}

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{poet.short_bio}</p>

      <div className="flex items-center justify-center space-x-2 mb-4">
        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
          {poet.primary_language}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{poet.country}</span>
      </div>

      <button className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
        View Shayari
      </button>
    </div>
  );
}
