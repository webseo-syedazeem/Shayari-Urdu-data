import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import SeoSettingsSection from '../../components/admin/SeoSettingsSection';

interface TagFormData {
  name: string;
  slug: string;
  description: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
}

const PAGE_SIZE = 100;

export default function ManageTagsPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TagFormData>({
    name: '',
    slug: '',
    description: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadTags(1);
  }, []);

  const loadTags = async (displayPage = 1) => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getTags({ page: displayPage, pageSize: PAGE_SIZE });
      setTags(response.data);
      setTotalRecords(response.pagination.total);
      setCurrentPage(displayPage);
    } catch (error) {
      console.error('Error loading tags:', error);
      setError('Failed to load tags');
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
      description: '',
      seo_title: '',
      seo_description: '',
      seo_keywords: ''
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleEdit = async (tag: any) => {
    setError('');
    setSuccess('');
    try {
      const fullTag = await adminApi.get<any>(`/tags/${tag.id}`);
      setEditingId(fullTag.id);
      setFormData({
        name: fullTag.name || '',
        slug: fullTag.slug || '',
        description: fullTag.description || '',
        seo_title: fullTag.seo_title || '',
        seo_description: fullTag.seo_description || '',
        seo_keywords: fullTag.seo_keywords || ''
      });
      setShowForm(true);
    } catch (error: any) {
      setError(error.message || 'Failed to load tag');
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
      const payload = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description,
        seo_title: formData.seo_title?.trim() || null,
        seo_description: formData.seo_description?.trim() || null,
        seo_keywords: formData.seo_keywords?.trim() || null
      };

      if (editingId) {
        await adminApi.put(`/tags/${editingId}`, payload);
        setSuccess('Tag updated successfully');
      } else {
        await adminApi.post('/tags', payload);
        setSuccess('Tag created successfully');
      }

      setShowForm(false);
      loadTags(currentPage);
    } catch (error: any) {
      console.error('Error saving tag:', error);
      setError(error.message || 'Failed to save tag');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await adminApi.delete(`/tags/${id}`);
      setSuccess('Tag deleted successfully');
      loadTags(currentPage);
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      setError(error.message || 'Failed to delete tag');
    }
  };

  const totalPages = Math.ceil(totalRecords / PAGE_SIZE);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Tags</h1>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          <Plus size={20} />
          <span>Add New Tag</span>
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
                  {editingId ? 'Edit Tag' : 'Add New Tag'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

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

      <div
        className="relative min-h-[160px] bg-white rounded-lg shadow overflow-hidden"
        aria-busy={loading}
      >
        {loading && (
          <div className="absolute inset-0 z-20 flex items-start justify-center bg-white/80 backdrop-blur-[1px] pt-16">
            <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-white px-5 py-3 text-amber-700 shadow-md">
              <Loader2 className="animate-spin" size={22} />
              <span className="font-medium">Loading tags...</span>
            </div>
          </div>
        )}

        <table className={`min-w-full divide-y divide-gray-200 transition-opacity ${loading ? 'opacity-40' : 'opacity-100'}`}>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tags.map((tag) => (
              <tr key={tag.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{tag.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{tag.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 line-clamp-2">
                    {tag.description || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(tag)}
                    className="text-amber-600 hover:text-amber-900 mr-4"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id, tag.name)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalRecords > 0 && (
        <div className="flex items-center justify-between px-4 py-3 mt-2 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600">
            Total: <strong>{totalRecords.toLocaleString()}</strong> &nbsp;&mdash;&nbsp;
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            {' '}({PAGE_SIZE} per page)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadTags(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              &larr; Prev
            </button>
            <button
              onClick={() => loadTags(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}

      {!loading && tags.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No tags found
        </div>
      )}
    </div>
  );
}
