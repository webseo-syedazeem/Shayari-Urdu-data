import { BookOpen } from 'lucide-react';
import { DictionaryEntry } from '../services/api';

interface DictionaryWordCardProps {
  entry: DictionaryEntry;
  onClick?: () => void;
}

export default function DictionaryWordCard({ entry, onClick }: DictionaryWordCardProps) {
  const getDisplayWord = () => {
    if (entry.word_urdu) return entry.word_urdu;
    if (entry.word_roman) return entry.word_roman;
    if (entry.word_english) return entry.word_english;
    return entry.word_key;
  };

  const getSecondaryForms = () => {
    const forms = [];
    if (entry.word_roman) forms.push(entry.word_roman);
    if (entry.word_english) forms.push(entry.word_english);
    return forms.slice(0, 2).join(' / ');
  };

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 p-6 cursor-pointer border border-gray-100 dark:border-slate-700 hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 font-serif">
          {getDisplayWord()}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{getSecondaryForms()}</p>
      </div>

      {entry.part_of_speech && (
        <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium mb-3">
          {entry.part_of_speech}
        </span>
      )}

      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
          {entry.meanings_english && entry.meanings_english.length > 0
            ? entry.meanings_english.slice(0, 3).join(', ')
            : 'No meanings available'}
        </p>
      </div>

      <button className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-sm transition-colors">
        <BookOpen size={16} />
        <span>View Details</span>
      </button>
    </div>
  );
}
