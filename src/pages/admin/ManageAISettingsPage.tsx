import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Save, Sparkles } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

interface ManageAISettingsPageProps {
  onBack: () => void;
}

interface AIImageSettings {
  id: 'default';
  model: 'gpt-image-2' | 'gpt-image-1.5' | 'gpt-image-1-mini';
  quality: 'low' | 'medium' | 'high';
  compression: number;
  updated_at?: string;
}

const DEFAULT_SETTINGS: AIImageSettings = {
  id: 'default',
  model: 'gpt-image-2',
  quality: 'high',
  compression: 90
};

const MODEL_OPTIONS = [
  {
    value: 'gpt-image-2' as const,
    label: 'Best',
    model: 'GPT Image 2',
    description: 'Maximum visual quality and strongest prompt understanding'
  },
  {
    value: 'gpt-image-1.5' as const,
    label: 'Medium',
    model: 'GPT Image 1.5',
    description: 'Balanced image quality, generation time and cost'
  },
  {
    value: 'gpt-image-1-mini' as const,
    label: 'Low',
    model: 'GPT Image 1 Mini',
    description: 'Lighter and lower-cost image generation'
  }
];

const QUALITY_OPTIONS = [
  { value: 'high' as const, label: 'High', description: 'Best detail and text clarity' },
  { value: 'medium' as const, label: 'Medium', description: 'Balanced detail and cost' },
  { value: 'low' as const, label: 'Low', description: 'Fastest and lowest cost' }
];

export default function ManageAISettingsPage({ onBack }: ManageAISettingsPageProps) {
  const [settings, setSettings] = useState<AIImageSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await adminApi.get<AIImageSettings>('/ai-image-settings');
        setSettings(data);
      } catch (loadError: any) {
        setError(loadError.message || 'Failed to load AI image settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => setSuccess(''), 3000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const selectedModel = useMemo(
    () => MODEL_OPTIONS.find((option) => option.value === settings.model) || MODEL_OPTIONS[0],
    [settings.model]
  );

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const saved = await adminApi.put<AIImageSettings>('/ai-image-settings', {
        model: settings.model,
        quality: settings.quality,
        compression: settings.compression
      });
      setSettings(saved);
      setSuccess('saved');
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to save AI image settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-2"
      >
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>

      <div className="text-center mb-4">
        <div className="w-11 h-11 mx-auto mb-1.5 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
          <Sparkles size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Image Generation</h1>
        <p className="mt-1 text-base text-gray-500">Choose the image level and output quality for new poetry images.</p>
      </div>

      <div className="w-full max-w-2xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}
        <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-3.5">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Selected configuration</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xl leading-tight font-bold">{selectedModel.label}</p>
                <p className="text-sm text-slate-300">{selectedModel.model}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="px-2.5 py-1 rounded-full bg-white/10">
                  Quality: <strong className="capitalize">{settings.quality}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/10">WEBP</span>
                <span className="px-2.5 py-1 rounded-full bg-white/10">{settings.compression}%</span>
              </div>
            </div>
          </div>

          <div className="p-4 md:px-5 md:py-4 space-y-4">
            {loading ? (
              <div className="py-12 text-center text-gray-500">Loading settings...</div>
            ) : (
              <>
                <fieldset>
                  <legend className="text-center text-lg font-bold text-gray-900">Image Level</legend>
                  <p className="text-center text-sm text-gray-500 mb-2.5">Select the model level that suits the client.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {MODEL_OPTIONS.map((option) => {
                      const selected = settings.model === option.value;
                      return (
                        <label
                          key={option.value}
                          className={`relative cursor-pointer rounded-xl border-2 p-3 transition-all ${ 
                            selected
                              ? 'border-amber-500 bg-amber-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-amber-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="image-model"
                            value={option.value}
                            checked={selected}
                            onChange={() => setSettings({ ...settings, model: option.value })}
                            className="sr-only"
                          />
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-lg font-bold text-gray-900">{option.label}</p>
                              <p className="text-sm font-medium text-amber-700">{option.model}</p>
                            </div>
                            <span className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selected ? 'border-amber-600 bg-amber-600' : 'border-gray-300'
                            }`}>
                              {selected && <span className="w-2 h-2 bg-white rounded-full" />}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-gray-500">{option.description}</p>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-center text-lg font-bold text-gray-900">Image Quality</legend>
                  <p className="text-center text-sm text-gray-500 mb-2.5">Control visual detail, generation time and cost.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {QUALITY_OPTIONS.map((option) => {
                      const selected = settings.quality === option.value;
                      return (
                        <label
                          key={option.value}
                          className={`cursor-pointer rounded-xl border-2 px-3 py-2.5 text-center transition-all ${ 
                            selected
                              ? 'border-amber-500 bg-amber-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-amber-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="image-quality"
                            value={option.value}
                            checked={selected}
                            onChange={() => setSettings({ ...settings, quality: option.value })}
                            className="sr-only"
                          />
                          <span className={`mx-auto mb-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${ 
                            selected ? 'border-amber-600 bg-amber-600' : 'border-gray-300'
                          }`}>
                            {selected && <span className="w-2 h-2 bg-white rounded-full" />}
                          </span>
                          <p className="font-bold text-gray-900">{option.label}</p>
                          <p className="mt-1 text-xs text-gray-500">{option.description}</p>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-4 mb-1.5">
                    <div>
                      <p className="font-bold text-gray-900">Compression Quality</p>
                      <p className="text-xs text-gray-500">WEBP is fixed for fast website delivery.</p>
                    </div>
                    <div className="w-16 h-9 rounded-lg bg-white border border-gray-300 flex items-center justify-center font-bold text-amber-700">
                      {settings.compression}%
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.compression}
                    onChange={(event) => setSettings({ ...settings, compression: Number(event.target.value) })}
                    className="w-full accent-amber-600"
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-400">
                    <span>Smaller file</span>
                    <span>Better detail</span>
                  </div>
                </div>

                {settings.updated_at && (
                  <p className="text-center text-xs text-gray-400">
                    Last saved: {new Date(settings.updated_at).toLocaleString()}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-2.5 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 ${
                    success
                      ? 'bg-green-600 hover:bg-green-600'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {saving ? (
                    <Sparkles className="animate-pulse" size={19} />
                  ) : success ? (
                    <CheckCircle2 size={19} />
                  ) : (
                    <Save size={19} />
                  )}
                  <span>{saving ? 'Saving Settings...' : success ? 'Saved' : 'Save Image Settings'}</span>
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
