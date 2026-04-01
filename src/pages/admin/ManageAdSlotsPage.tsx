import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

const PLACEMENTS = [
  { value: 'header', label: 'Header' },
  { value: 'home_hero_top', label: 'Home Hero Top' },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'footer', label: 'Footer' },
  { value: 'between_shayari_cards', label: 'Between Shayari Cards' }
];

const PAGE_SCOPES = [
  { value: 'global', label: 'Global (All Pages)' },
  { value: 'home', label: 'Home' },
  { value: 'explore', label: 'Explore' },
  { value: 'poet_detail', label: 'Poet Detail' },
  { value: 'topic_detail', label: 'Topic Detail' },
  { value: 'collection_detail', label: 'Collection Detail' },
  { value: 'shayari_detail', label: 'Shayari Detail' },
  { value: 'ebooks', label: 'Ebooks' },
  { value: 'ebook_detail', label: 'Ebook Detail' },
  { value: 'dictionary', label: 'Dictionary' },
  { value: 'dictionary_detail', label: 'Dictionary Detail' }
];

export default function ManageAdSlotsPage() {
  const [adSlots, setAdSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    title: '',
    description: '',
    placement: 'header',
    page_scope: 'global',
    is_active: true,
    priority: 100,
    frequency: 6,
    html_snippet: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadAdSlots();
  }, []);

  const loadAdSlots = async () => {
    try {
      setLoading(true);
      const data = await adminApi.get('/ad-slots');
      setAdSlots(data.data);
    } catch (error) {
      console.error('Error loading ad slots:', error);
      setError('Failed to load ad slots');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      key: '',
      title: '',
      description: '',
      placement: 'header',
      page_scope: 'global',
      is_active: true,
      priority: 100,
      frequency: 6,
      html_snippet: ''
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleEdit = (slot: any) => {
    setEditingId(slot.id);
    setFormData({
      key: slot.key || '',
      title: slot.title || '',
      description: slot.description || '',
      placement: slot.placement || 'header',
      page_scope: slot.page_scope || 'global',
      is_active: slot.is_active !== undefined ? slot.is_active : true,
      priority: slot.priority !== undefined ? slot.priority : 100,
      frequency: slot.frequency !== undefined ? slot.frequency : 6,
      html_snippet: slot.html_snippet || ''
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.key) {
      setError('Key is required');
      return;
    }

    if (!formData.placement) {
      setError('Placement is required');
      return;
    }

    if (!formData.page_scope) {
      setError('Page scope is required');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        key: formData.key,
        title: formData.title,
        description: formData.description,
        placement: formData.placement,
        page_scope: formData.page_scope,
        is_active: formData.is_active,
        priority: formData.priority,
        frequency: formData.frequency,
        html_snippet: formData.html_snippet
      };

      if (editingId) {
        await adminApi.put(`/ad-slots/${editingId}`, payload);
        setSuccess('Ad slot updated successfully');
      } else {
        await adminApi.post('/ad-slots', payload);
        setSuccess('Ad slot created successfully');
      }

      setShowForm(false);
      loadAdSlots();
    } catch (error: any) {
      console.error('Error saving ad slot:', error);
      setError(error.message || 'Failed to save ad slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, key: string) => {
    if (!confirm(`Are you sure you want to delete ad slot "${key}"?`)) {
      return;
    }

    try {
      await adminApi.delete(`/ad-slots/${id}`);
      setSuccess('Ad slot deleted successfully');
      loadAdSlots();
    } catch (error: any) {
      console.error('Error deleting ad slot:', error);
      setError(error.message || 'Failed to delete ad slot');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Ad Slots</h1>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          <Plus size={20} />
          <span>Add New Ad Slot</span>
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
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingId ? 'Edit Ad Slot' : 'Add New Ad Slot'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="e.g., home_hero_top_1"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Unique identifier for this ad slot</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="e.g., Home Hero Banner"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    rows={2}
                    placeholder="Brief description of where this ad appears"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Placement <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.placement}
                      onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      required
                    >
                      {PLACEMENTS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Page Scope <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.page_scope}
                      onChange={(e) => setFormData({ ...formData, page_scope: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      required
                    >
                      {PAGE_SCOPES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Higher priority wins when multiple slots match</p>
                  </div>

                  {formData.placement === 'between_shayari_cards' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
                      </label>
                      <input
                        type="number"
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: parseInt(e.target.value) || 6 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        min="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Show ad after every N cards</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Active (ad will be displayed)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HTML Snippet
                  </label>
                  <textarea
                    value={formData.html_snippet}
                    onChange={(e) => setFormData({ ...formData, html_snippet: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-sm"
                    rows={8}
                    placeholder="<div>Ad code here (AdSense, custom HTML, etc.)</div>"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to disable rendering. Include full HTML/script tags for AdSense or custom ads.
                  </p>
                </div>

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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Placement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page Scope
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adSlots.map((slot) => (
                <tr key={slot.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{slot.key}</code>
                    {slot.title && <div className="text-xs text-gray-500 mt-1">{slot.title}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {PLACEMENTS.find((p) => p.value === slot.placement)?.label || slot.placement}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {PAGE_SCOPES.find((s) => s.value === slot.page_scope)?.label || slot.page_scope}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{slot.priority}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        slot.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {slot.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(slot)}
                      className="text-amber-600 hover:text-amber-900 mr-4"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(slot.id, slot.key)}
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
      </div>

      {adSlots.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No ad slots found. Click &quot;Add New Ad Slot&quot; to create one.
        </div>
      )}
    </div>
  );
}
