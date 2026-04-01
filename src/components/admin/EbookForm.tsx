import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { uploadImage } from '../../services/uploadService';
import { generateEbookSlug } from '../../utils/slugUtils';
import SeoSettingsSection from './SeoSettingsSection';

interface EbookFormProps {
  ebook?: any;
  poets: any[];
  onSubmit: (data: any, file?: File) => void;
  onCancel: () => void;
  submitting: boolean;
}

export default function EbookForm({ ebook, poets, onSubmit, onCancel, submitting }: EbookFormProps) {
  const [formData, setFormData] = useState({
    slug: '',
    poet_id: '',
    cover_image: '',
    file_url_pdf: '',
    file_url_epub: '',
    title_roman: '',
    title_urdu: '',
    title_hindi: '',
    title_english: '',
    desc_roman: '',
    desc_urdu: '',
    desc_hindi: '',
    desc_english: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (ebook) {
      setFormData({
        slug: ebook.slug || '',
        poet_id: ebook.poet_id || '',
        cover_image: ebook.cover_image || '',
        file_url_pdf: ebook.file_url_pdf || '',
        file_url_epub: ebook.file_url_epub || '',
        title_roman: ebook.titles?.romanUrdu || '',
        title_urdu: ebook.titles?.urdu || '',
        title_hindi: ebook.titles?.hindi || '',
        title_english: ebook.titles?.english || '',
        desc_roman: ebook.descriptions?.romanUrdu || '',
        desc_urdu: ebook.descriptions?.urdu || '',
        desc_hindi: ebook.descriptions?.hindi || '',
        desc_english: ebook.descriptions?.english || '',
        seo_title: ebook.seo_title || '',
        seo_description: ebook.seo_description || '',
        seo_keywords: ebook.seo_keywords || ''
      });
      setPreviewUrl(ebook.cover_image || '');
    }
  }, [ebook]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const titles = {
      romanUrdu: formData.title_roman,
      urdu: formData.title_urdu,
      hindi: formData.title_hindi,
      english: formData.title_english
    };

    // Auto-generate slug if empty
    let slug = formData.slug?.trim() || '';
    if (!slug) {
      slug = generateEbookSlug(titles);
    }

    // Ensure we have a valid slug before submitting
    if (!slug) {
      alert('Unable to generate slug. Please enter a slug manually.');
      return;
    }

    const payload = {
      slug,
      poet_id: formData.poet_id || null,
      cover_image: formData.cover_image,
      file_url_pdf: formData.file_url_pdf,
      file_url_epub: formData.file_url_epub,
      titles,
      descriptions: {
        romanUrdu: formData.desc_roman,
        urdu: formData.desc_urdu,
        hindi: formData.desc_hindi,
        english: formData.desc_english
      },
      seo_title: formData.seo_title?.trim() || null,
      seo_description: formData.seo_description?.trim() || null,
      seo_keywords: formData.seo_keywords?.trim() || null
    };

    onSubmit(payload, selectedFile || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {ebook ? 'Edit Ebook' : 'Add New Ebook'}
            </h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="auto-generated if empty"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to auto-generate from title
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Poet</label>
              <select
                value={formData.poet_id}
                onChange={(e) => setFormData({ ...formData, poet_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">None</option>
                {poets.map((poet) => (
                  <option key={poet.id} value={poet.id}>{poet.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
              {error && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                  {error}
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
                    <Upload size={18} />
                    <span>Upload Cover</span>
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
                      className="w-16 h-24 object-cover rounded border-2 border-gray-200"
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
                  value={formData.cover_image}
                  onChange={(e) => {
                    setFormData({ ...formData, cover_image: e.target.value });
                    if (e.target.value) {
                      setPreviewUrl(e.target.value);
                      setSelectedFile(null);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PDF URL</label>
                <input
                  type="text"
                  value={formData.file_url_pdf}
                  onChange={(e) => setFormData({ ...formData, file_url_pdf: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">EPUB URL</label>
                <input
                  type="text"
                  value={formData.file_url_epub}
                  onChange={(e) => setFormData({ ...formData, file_url_epub: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Titles</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roman Urdu</label>
                  <input
                    type="text"
                    value={formData.title_roman}
                    onChange={(e) => setFormData({ ...formData, title_roman: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">English</label>
                  <input
                    type="text"
                    value={formData.title_english}
                    onChange={(e) => setFormData({ ...formData, title_english: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <textarea
                value={formData.desc_roman}
                onChange={(e) => setFormData({ ...formData, desc_roman: e.target.value })}
                placeholder="Roman Urdu description"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                rows={3}
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
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : ebook ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
