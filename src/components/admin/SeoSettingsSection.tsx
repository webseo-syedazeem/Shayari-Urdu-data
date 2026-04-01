import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SeoSettingsSectionProps {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  onSeoTitleChange: (value: string) => void;
  onSeoDescriptionChange: (value: string) => void;
  onSeoKeywordsChange: (value: string) => void;
}

export default function SeoSettingsSection({
  seoTitle,
  seoDescription,
  seoKeywords,
  onSeoTitleChange,
  onSeoDescriptionChange,
  onSeoKeywordsChange
}: SeoSettingsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const descriptionLength = seoDescription.length;
  const descriptionMax = 160;
  const descriptionColor = descriptionLength > descriptionMax
    ? 'text-red-600'
    : descriptionLength > descriptionMax * 0.9
    ? 'text-amber-600'
    : 'text-gray-500';

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-700 flex items-center space-x-2">
          <span>SEO Settings</span>
          <span className="text-xs text-gray-500">(Optional)</span>
        </span>
        {isExpanded ? (
          <ChevronUp size={20} className="text-gray-500" />
        ) : (
          <ChevronDown size={20} className="text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4 bg-white">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SEO Title
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => onSeoTitleChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="Custom title for search engines"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to auto-generate from content. Recommended: 50-60 characters.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SEO Description
            </label>
            <textarea
              value={seoDescription}
              onChange={(e) => onSeoDescriptionChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              rows={3}
              placeholder="Description for search engines"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                Leave empty to auto-generate from content.
              </p>
              <span className={`text-xs font-medium ${descriptionColor}`}>
                {descriptionLength}/{descriptionMax}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SEO Keywords
            </label>
            <input
              type="text"
              value={seoKeywords}
              onChange={(e) => onSeoKeywordsChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="keyword1, keyword2, keyword3"
            />
            <p className="text-xs text-gray-500 mt-1">
              Comma-separated keywords. Leave empty to auto-generate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
