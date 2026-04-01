import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import SeoSettingsSection from '../../components/admin/SeoSettingsSection';

const normalizeMeanings = (v: any): string[] => {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'string') return v.split('\n').map(s => s.trim()).filter(Boolean);
  return [];
};

export default function ManageDictionaryPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    word_key: '',
    word_roman: '',
    word_urdu: '',
    word_hindi: '',
    word_english: '',
    meanings_english: '',
    meanings_urdu: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await adminApi.get('/dictionary?pageSize=100');
      setEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading dictionary entries:', error);
      setError('Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      word_key: '',
      word_roman: '',
      word_urdu: '',
      word_hindi: '',
      word_english: '',
      meanings_english: '',
      meanings_urdu: '',
      seo_title: '',
      seo_description: '',
      seo_keywords: ''
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleEdit = (entry: any) => {
    setEditingId(entry.id);
    setFormData({
      word_key: entry.word_key || '',
      word_roman: entry.word_roman || '',
      word_urdu: entry.word_urdu || '',
      word_hindi: entry.word_hindi || '',
      word_english: entry.word_english || '',
      meanings_english: normalizeMeanings(entry.meanings_english).join('\n'),
      meanings_urdu: normalizeMeanings(entry.meanings_urdu).join('\n'),
      seo_title: entry.seo_title || '',
      seo_description: entry.seo_description || '',
      seo_keywords: entry.seo_keywords || ''
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.word_key) {
      setError('Word key is required');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        word_key: formData.word_key,
        word_roman: formData.word_roman,
        word_urdu: formData.word_urdu,
        word_hindi: formData.word_hindi,
        word_english: formData.word_english,
        meanings_english: normalizeMeanings(formData.meanings_english),
        meanings_urdu: normalizeMeanings(formData.meanings_urdu),
        seo_title: formData.seo_title?.trim() || null,
        seo_description: formData.seo_description?.trim() || null,
        seo_keywords: formData.seo_keywords?.trim() || null
      };

      if (editingId) {
        await adminApi.put(`/dictionary/${editingId}`, payload);
        setSuccess('Dictionary entry updated successfully');
      } else {
        await adminApi.post('/dictionary', payload);
        setSuccess('Dictionary entry created successfully');
      }

      setShowForm(false);
      loadEntries();
    } catch (error: any) {
      console.error('Error saving entry:', error);
      setError(error.message || 'Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, wordKey: string) => {
    if (!confirm(`Are you sure you want to delete "${wordKey}"?`)) {
      return;
    }

    try {
      await adminApi.delete(`/dictionary/${id}`);
      setSuccess('Dictionary entry deleted successfully');
      loadEntries();
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      setError(error.message || 'Failed to delete entry');
    }
  };

  const filteredEntries = entries.filter((entry) =>
    entry.word_key?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.word_roman?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.word_english?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Dictionary</h1>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          <Plus size={20} />
          <span>Add New Word</span>
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

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dictionary..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingId ? 'Edit Dictionary Entry' : 'Add New Dictionary Entry'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Word Key *</label>
                  <input
                    type="text"
                    value={formData.word_key}
                    onChange={(e) => setFormData({ ...formData, word_key: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roman Urdu</label>
                    <input
                      type="text"
                      value={formData.word_roman}
                      onChange={(e) => setFormData({ ...formData, word_roman: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Urdu</label>
                    <input
                      type="text"
                      value={formData.word_urdu}
                      onChange={(e) => setFormData({ ...formData, word_urdu: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hindi</label>
                    <input
                      type="text"
                      value={formData.word_hindi}
                      onChange={(e) => setFormData({ ...formData, word_hindi: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">English</label>
                    <input
                      type="text"
                      value={formData.word_english}
                      onChange={(e) => setFormData({ ...formData, word_english: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meanings (English) - One per line
                  </label>
                  <textarea
                    value={formData.meanings_english}
                    onChange={(e) => setFormData({ ...formData, meanings_english: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    rows={4}
                    placeholder="One meaning per line"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meanings (Urdu) - One per line
                  </label>
                  <textarea
                    value={formData.meanings_urdu}
                    onChange={(e) => setFormData({ ...formData, meanings_urdu: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    rows={4}
                    placeholder="ایک لائن میں ایک معنی"
                    dir="rtl"
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Word Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roman
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                English
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{entry.word_key}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{entry.word_roman || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{entry.word_english || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="text-amber-600 hover:text-amber-900 mr-4"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id, entry.word_key)}
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

      {filteredEntries.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No dictionary entries found
        </div>
      )}
    </div>
  );
}
