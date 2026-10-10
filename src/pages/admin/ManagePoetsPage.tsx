import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Upload, Sparkles, Loader2 } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { uploadImage } from '../../services/uploadService';
import { generatePoetImage } from '../../services/imageGenerationService';
import SeoSettingsSection from '../../components/admin/SeoSettingsSection';

interface PoetFormData {
  name: string;
  slug: string;
  short_bio: string;
  long_bio: string;
  primary_language: string;
  avatar_url: string;
  country: string;
  birth_year: number | '';
  death_year: number | '';
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
}

type PoetRecord = Partial<PoetFormData> & {
  id: string;
  name: string;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function ManagePoetsPage() {
  const [poets, setPoets] = useState<PoetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PoetFormData>({
    name: '',
    slug: '',
    short_bio: '',
    long_bio: '',
    primary_language: 'roman_urdu',
    avatar_url: '',
    country: '',
    birth_year: '',
    death_year: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);

  useEffect(() => {
    loadPoets();
  }, []);

  const loadPoets = async () => {
    try {
      setLoading(true);
      const data = await adminApi.get<PoetRecord[]>('/poets');
      setPoets(data);
    } catch (error) {
      console.error('Error loading poets:', error);
      setError('Failed to load poets');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    });
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      slug: '',
      short_bio: '',
      long_bio: '',
      primary_language: 'roman_urdu',
      avatar_url: '',
      country: '',
      birth_year: '',
      death_year: '',
      seo_title: '',
      seo_description: '',
      seo_keywords: ''
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setImagePrompt('');
    setGeneratingImage(false);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleEdit = (poet: PoetRecord) => {
    setEditingId(poet.id);
    setFormData({
      name: poet.name || '',
      slug: poet.slug || '',
      short_bio: poet.short_bio || '',
      long_bio: poet.long_bio || '',
      primary_language: poet.primary_language || 'roman_urdu',
      avatar_url: poet.avatar_url || '',
      country: poet.country || '',
      birth_year: poet.birth_year || '',
      death_year: poet.death_year || '',
      seo_title: poet.seo_title || '',
      seo_description: poet.seo_description || '',
      seo_keywords: poet.seo_keywords || ''
    });
    setSelectedFile(null);
    setPreviewUrl(poet.avatar_url || '');
    setImagePrompt('');
    setGeneratingImage(false);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Invalid file type. Please upload JPG, PNG, or WEBP.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File too large. Maximum size is 5 MB.');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError('');
    }
  };

  const handleGenerateImage = async () => {
    if (!editingId) {
      setError('Create the poet first. The image will then generate automatically from this prompt.');
      return;
    }
    if (!imagePrompt.trim()) {
      setError('Please enter an image prompt.');
      return;
    }

    setGeneratingImage(true);
    setError('');
    setSuccess('');
    try {
      const result = await generatePoetImage(editingId, imagePrompt);
      setFormData((current) => ({ ...current, avatar_url: result.public_url }));
      setSelectedFile(null);
      setPreviewUrl(result.public_url);
      setPoets((items) => items.map((poet) => (
        poet.id === editingId ? { ...poet, avatar_url: result.public_url } : poet
      )));
      setSuccess(
        `Portrait generated and saved using ${result.model} (${result.quality}, ${result.image_format.toUpperCase()}, settings: ${result.settings_source}).`
      );
    } catch (generationError: unknown) {
      setError(errorMessage(generationError, 'Failed to generate poet image.'));
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name) {
      setError('Name is required');
      return;
    }

    setSubmitting(true);

    try {
      let poetId = editingId;
      let avatarUrl = formData.avatar_url;

      const payload = {
        name: formData.name,
        slug: formData.slug || '',
        short_bio: formData.short_bio || '',
        long_bio: formData.long_bio || '',
        primary_language: formData.primary_language || 'roman_urdu',
        avatar_url: avatarUrl || '',
        country: formData.country || '',
        birth_year: formData.birth_year ? Number(formData.birth_year) : null,
        death_year: formData.death_year ? Number(formData.death_year) : null,
        seo_title: formData.seo_title?.trim() || null,
        seo_description: formData.seo_description?.trim() || null,
        seo_keywords: formData.seo_keywords?.trim() || null
      };

      if (editingId) {
        if (selectedFile) {
          const uploadResult = await uploadImage(selectedFile, 'poets', editingId);
          if (!uploadResult.success) {
            setError(uploadResult.error || 'Failed to upload image');
            setSubmitting(false);
            return;
          }
          avatarUrl = uploadResult.publicUrl || '';
          payload.avatar_url = avatarUrl;
        }
        await adminApi.put(`/poets/${editingId}`, payload);
        setSuccess('Poet updated successfully');
      } else {
        const created = await adminApi.post<{ id: string }>('/poets', payload);
        poetId = created.id;
        const prompt = imagePrompt.trim();

        if (selectedFile && poetId && !prompt) {
          const uploadResult = await uploadImage(selectedFile, 'poets', poetId);
          if (uploadResult.success && uploadResult.publicUrl) {
            await adminApi.put(`/poets/${poetId}`, { avatar_url: uploadResult.publicUrl });
          }
        }

        if (prompt && poetId) {
          setGeneratingImage(true);
          try {
            const result = await generatePoetImage(poetId, prompt);
            avatarUrl = result.public_url;
            setFormData((current) => ({ ...current, avatar_url: avatarUrl }));
            setSelectedFile(null);
            setPreviewUrl(avatarUrl);
            setSuccess('Poet created and portrait generated successfully');
          } catch (generationError: unknown) {
            setEditingId(poetId);
            setError(
              `Poet was created, but its portrait could not be generated: ${errorMessage(generationError, 'Unknown error')}`
            );
            await loadPoets();
            return;
          } finally {
            setGeneratingImage(false);
          }
        } else {
          setSuccess('Poet created successfully');
        }
      }

      setShowForm(false);
      setSelectedFile(null);
      setPreviewUrl('');
      setImagePrompt('');
      setGeneratingImage(false);
      loadPoets();
    } catch (error: unknown) {
      console.error('Admin save poet error:', error);
      setError(errorMessage(error, 'Failed to save poet'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await adminApi.delete(`/poets/${id}`);
      setSuccess('Poet deleted successfully');
      loadPoets();
    } catch (error: unknown) {
      console.error('Error deleting poet:', error);
      setError(errorMessage(error, 'Failed to delete poet'));
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Poets</h1>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          <Plus size={20} />
          <span>Add New Poet</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingId ? 'Edit Poet' : 'Add New Poet'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Language
                  </label>
                  <select
                    value={formData.primary_language}
                    onChange={(e) => setFormData({ ...formData, primary_language: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="roman_urdu">Roman Urdu</option>
                    <option value="urdu">Urdu</option>
                    <option value="hindi">Hindi</option>
                    <option value="english">English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avatar Image
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
                        <Upload size={18} />
                        <span>Upload Avatar</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Allowed: JPG, PNG, WEBP | Max size: 5 MB
                    </p>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">or enter URL manually</span>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formData.avatar_url}
                      onChange={(e) => {
                        setFormData({ ...formData, avatar_url: e.target.value });
                        if (e.target.value) {
                          setPreviewUrl(e.target.value);
                          setSelectedFile(null);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      placeholder="https://example.com/avatar.jpg"
                    />
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          AI Portrait Prompt
                        </label>
                        <textarea
                          value={imagePrompt}
                          onChange={(event) => setImagePrompt(event.target.value)}
                          rows={4}
                          maxLength={4000}
                          disabled={generatingImage || submitting}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                          placeholder="Describe the portrait to generate for this poet..."
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-gray-500">
                          {editingId
                            ? 'The generated portrait will be uploaded and saved to this poet immediately.'
                            : 'The portrait will generate automatically after the poet is created. A prompt takes priority over a selected upload.'}
                        </p>
                        {editingId ? (
                          <button
                            type="button"
                            onClick={handleGenerateImage}
                            disabled={generatingImage || submitting || !imagePrompt.trim()}
                            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {generatingImage ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <Sparkles size={18} />
                            )}
                            <span>{generatingImage ? 'Generating...' : 'Generate Portrait'}</span>
                          </button>
                        ) : (
                          <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                            Runs after Create
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Birth Year
                    </label>
                    <input
                      type="number"
                      value={formData.birth_year}
                      onChange={(e) => setFormData({ ...formData, birth_year: e.target.value ? Number(e.target.value) : '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Death Year
                    </label>
                    <input
                      type="number"
                      value={formData.death_year}
                      onChange={(e) => setFormData({ ...formData, death_year: e.target.value ? Number(e.target.value) : '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Bio
                  </label>
                  <textarea
                    value={formData.short_bio}
                    onChange={(e) => setFormData({ ...formData, short_bio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Long Bio
                  </label>
                  <textarea
                    value={formData.long_bio}
                    onChange={(e) => setFormData({ ...formData, long_bio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    rows={6}
                  />
                </div>

                <SeoSettingsSection
                  seoTitle={formData.seo_title}
                  seoDescription={formData.seo_description}
                  seoKeywords={formData.seo_keywords}
                  onSeoTitleChange={(value) => setFormData({ ...formData, seo_title: value })}
                  onSeoDescriptionChange={(value) => setFormData({ ...formData, seo_description: value })}
                  onSeoKeywordsChange={(value) => setFormData({ ...formData, seo_keywords: value })}
                />

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || generatingImage}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                  >
                    {submitting
                      ? (generatingImage ? 'Generating portrait...' : 'Saving...')
                      : editingId
                        ? 'Update'
                        : imagePrompt.trim()
                          ? 'Create & Generate Portrait'
                          : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {poets.map((poet) => (
          <div key={poet.id} className="bg-white rounded-lg shadow p-6">
            <img
              src={poet.avatar_url || 'https://via.placeholder.com/150'}
              alt={poet.name}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            />
            <h3 className="text-lg font-bold text-center mb-2">{poet.name}</h3>
            <p className="text-sm text-gray-600 text-center mb-4 line-clamp-2">
              {poet.short_bio || 'No bio available'}
            </p>
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => handleEdit(poet)}
                className="p-2 text-amber-600 hover:bg-amber-50 rounded"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => handleDelete(poet.id, poet.name)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
