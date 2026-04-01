import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { uploadImage } from '../../services/uploadService';
import EbookForm from '../../components/admin/EbookForm';

export default function ManageEbooksPage() {
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [poets, setPoets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEbook, setEditingEbook] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadEbooks();
    loadPoets();
  }, []);

  const loadEbooks = async () => {
    try {
      setLoading(true);
      const response = await api.getEbooks({ pageSize: 100 });
      setEbooks(response.data);
    } catch (error) {
      console.error('Error loading ebooks:', error);
      setError('Failed to load ebooks');
    } finally {
      setLoading(false);
    }
  };

  const loadPoets = async () => {
    try {
      const response = await api.getPoets({ pageSize: 100 });
      setPoets(response.data);
    } catch (error) {
      console.error('Error loading poets:', error);
    }
  };

  const handleCreate = () => {
    setEditingEbook(null);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleEdit = (ebook: any) => {
    setEditingEbook(ebook);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (data: any, file?: File) => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      let ebookId = editingEbook?.id;
      let coverImage = data.cover_image;

      if (editingEbook) {
        if (file) {
          const uploadResult = await uploadImage(file, 'ebooks', editingEbook.id);
          if (!uploadResult.success) {
            setError(uploadResult.error || 'Failed to upload image');
            setSubmitting(false);
            return;
          }
          coverImage = uploadResult.publicUrl || '';
          data.cover_image = coverImage;
        }
        await adminApi.put(`/ebooks/${editingEbook.id}`, data);
        setSuccess('Ebook updated successfully');
      } else {
        const created = await adminApi.post('/ebooks', data);
        ebookId = created.id;

        if (file && ebookId) {
          const uploadResult = await uploadImage(file, 'ebooks', ebookId);
          if (uploadResult.success && uploadResult.publicUrl) {
            await adminApi.put(`/ebooks/${ebookId}`, {
              cover_image: uploadResult.publicUrl
            });
          }
        }
        setSuccess('Ebook created successfully');
      }

      setShowForm(false);
      loadEbooks();
    } catch (error: any) {
      console.error('Error saving ebook:', error);
      setError(error.message || 'Failed to save ebook');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await adminApi.delete(`/ebooks/${id}`);
      setSuccess('Ebook deleted successfully');
      loadEbooks();
    } catch (error: any) {
      console.error('Error deleting ebook:', error);
      setError(error.message || 'Failed to delete ebook');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Ebooks</h1>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          <Plus size={20} />
          <span>Add New Ebook</span>
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
        <EbookForm
          ebook={editingEbook}
          poets={poets}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          submitting={submitting}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ebooks.map((ebook) => (
          <div key={ebook.id} className="bg-white rounded-lg shadow overflow-hidden">
            <img
              src={ebook.cover_image || 'https://via.placeholder.com/300x400'}
              alt={ebook.titles?.romanUrdu || 'Ebook'}
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <h3 className="text-lg font-bold mb-2">{ebook.titles?.romanUrdu || ebook.titles?.english || 'Untitled'}</h3>
              {ebook.slug && (
                <div className="mb-2">
                  <span className="text-xs text-gray-500">Slug: </span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{ebook.slug}</code>
                </div>
              )}
              <p className="text-sm text-gray-600 mb-4">{ebook.descriptions?.romanUrdu?.substring(0, 100) || 'No description'}</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(ebook)}
                  className="p-2 text-amber-600 hover:bg-amber-50 rounded"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(ebook.id, ebook.titles?.romanUrdu || 'this ebook')}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
