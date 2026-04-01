import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Upload, List } from 'lucide-react';
import { api } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { uploadImage } from '../../services/uploadService';
import CollectionItemsManager from '../../components/admin/CollectionItemsManager';
import SeoSettingsSection from '../../components/admin/SeoSettingsSection';

interface CollectionFormData {
  title: string;
  slug: string;
  description: string;
  cover_image: string;
  is_featured: boolean;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
}

export default function ManageCollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CollectionFormData>({
    title: '',
    slug: '',
    description: '',
    cover_image: '',
    is_featured: false,
    seo_title: '',
    seo_description: '',
    seo_keywords: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [managingItemsFor, setManagingItemsFor] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const response = await api.getCollections({ pageSize: 100 });
      setCollections(response.data);
    } catch (error) {
      console.error('Error loading collections:', error);
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title)
    });
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      cover_image: '',
      is_featured: false,
      seo_title: '',
      seo_description: '',
      seo_keywords: ''
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleEdit = (collection: any) => {
    setEditingId(collection.id);
    setFormData({
      title: collection.title || '',
      slug: collection.slug || '',
      description: collection.description || '',
      cover_image: collection.cover_image || '',
      is_featured: collection.is_featured || false,
      seo_title: collection.seo_title || '',
      seo_description: collection.seo_description || '',
      seo_keywords: collection.seo_keywords || ''
    });
    setSelectedFile(null);
    setPreviewUrl(collection.cover_image || '');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title) {
      setError('Title is required');
      return;
    }

    setSubmitting(true);

    try {
      let collectionId = editingId;
      let coverImage = formData.cover_image;

      const payload = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        description: formData.description,
        cover_image: coverImage,
        is_featured: formData.is_featured,
        seo_title: formData.seo_title?.trim() || null,
        seo_description: formData.seo_description?.trim() || null,
        seo_keywords: formData.seo_keywords?.trim() || null
      };

      if (editingId) {
        if (selectedFile) {
          const uploadResult = await uploadImage(selectedFile, 'collections', editingId);
          if (!uploadResult.success) {
            setError(uploadResult.error || 'Failed to upload image');
            setSubmitting(false);
            return;
          }
          coverImage = uploadResult.publicUrl || '';
          payload.cover_image = coverImage;
        }
        await adminApi.put(`/collections/${editingId}`, payload);
        setSuccess('Collection updated successfully');
      } else {
        const created = await adminApi.post('/collections', payload);
        collectionId = created.id;

        if (selectedFile && collectionId) {
          const uploadResult = await uploadImage(selectedFile, 'collections', collectionId);
          if (uploadResult.success && uploadResult.publicUrl) {
            await adminApi.put(`/collections/${collectionId}`, {
              cover_image: uploadResult.publicUrl
            });
          }
        }
        setSuccess('Collection created successfully');
      }

      setShowForm(false);
      setSelectedFile(null);
      setPreviewUrl('');
      loadCollections();
    } catch (error: any) {
      console.error('Error saving collection:', error);
      setError(error.message || 'Failed to save collection');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await adminApi.delete(`/collections/${id}`);
      setSuccess('Collection deleted successfully');
      loadCollections();
    } catch (error: any) {
      console.error('Error deleting collection:', error);
      setError(error.message || 'Failed to delete collection');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Collections</h1>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          <Plus size={20} />
          <span>Add New Collection</span>
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
                  {editingId ? 'Edit Collection' : 'Add New Collection'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Image
                  </label>
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
                          className="w-32 h-20 object-cover rounded border-2 border-gray-200"
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

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <label htmlFor="is_featured" className="ml-2 text-sm text-gray-700">
                    Featured
                  </label>
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
                    disabled={submitting}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <div key={collection.id} className="bg-white rounded-lg shadow overflow-hidden">
            <img
              src={collection.cover_image || 'https://via.placeholder.com/400x200'}
              alt={collection.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-lg font-bold mb-2">{collection.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{collection.description || 'No description'}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{collection.itemCount || 0} items</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setManagingItemsFor({ id: collection.id, title: collection.title })}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Manage items"
                  >
                    <List size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(collection)}
                    className="p-2 text-amber-600 hover:bg-amber-50 rounded"
                    title="Edit collection"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(collection.id, collection.title)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete collection"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {managingItemsFor && (
        <CollectionItemsManager
          collectionId={managingItemsFor.id}
          collectionTitle={managingItemsFor.title}
          onClose={() => {
            setManagingItemsFor(null);
            loadCollections();
          }}
        />
      )}
    </div>
  );
}
