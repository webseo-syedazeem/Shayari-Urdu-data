import { useState } from 'react';

interface FilterBarProps {
  onFilterChange?: (filters: FilterState) => void;
}

export interface FilterState {
  form: string;
  mood: string;
  length: string;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    form: 'all',
    mood: 'all',
    length: 'all',
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            By Form
          </label>
          <select
            value={filters.form}
            onChange={(e) => handleFilterChange('form', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          >
            <option value="all">All Forms</option>
            <option value="Ghazal">Ghazal</option>
            <option value="Nazm">Nazm</option>
            <option value="Sher">Sher</option>
            <option value="Quote">Quote</option>
            <option value="Rubai">Rubai</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            By Mood
          </label>
          <select
            value={filters.mood}
            onChange={(e) => handleFilterChange('mood', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          >
            <option value="all">All Moods</option>
            <option value="Love">Love</option>
            <option value="Sad">Sad</option>
            <option value="Motivational">Motivational</option>
            <option value="Friendship">Friendship</option>
            <option value="Life">Life</option>
            <option value="Romantic">Romantic</option>
            <option value="Philosophical">Philosophical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            By Length
          </label>
          <select
            value={filters.length}
            onChange={(e) => handleFilterChange('length', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          >
            <option value="all">All Lengths</option>
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
        </div>
      </div>
    </div>
  );
}
