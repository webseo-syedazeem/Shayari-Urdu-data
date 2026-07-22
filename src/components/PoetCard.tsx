import { Poet } from '../services/api';

const FALLBACK_AVATAR = '/images/poet-image-not-found.svg';

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
      className="h-full min-h-[326px] bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 p-6 cursor-pointer border border-gray-100 dark:border-slate-700 hover:-translate-y-1 text-center flex flex-col"
      onClick={onClick}
    >
      <div className="mb-4 shrink-0">
        <img
          src={poet.avatar_url || FALLBACK_AVATAR}
          alt={poet.avatar_url ? poet.name : `${poet.name} image not available`}
          className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-gray-100 dark:border-slate-700"
          onError={(event) => {
            if (!event.currentTarget.src.endsWith(FALLBACK_AVATAR)) {
              event.currentTarget.src = FALLBACK_AVATAR;
            }
          }}
        />
      </div>

      <h3 className="min-h-7 text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">{poet.name}</h3>
      <p className="min-h-5 text-xs text-gray-500 dark:text-gray-400 mb-2">{yearsText}</p>

      <p className="min-h-10 text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{poet.short_bio}</p>

      <div className="min-h-7 flex items-center justify-center space-x-2 mb-4">
        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
          {poet.primary_language}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{poet.country}</span>
      </div>

      <button className="w-full mt-auto py-2 px-4 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
        View Shayari
      </button>
    </div>
  );
}
