import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Upload, Sparkles, Loader2 } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { uploadImage } from '../../services/uploadService';
import { generateShayariImage } from '../../services/imageGenerationService';
import { generateShayariSlug } from '../../utils/slugUtils';
import SeoSettingsSection from '../../components/admin/SeoSettingsSection';

const FETCH_CHUNK = 1000;

interface ShayariFormData {
  slug: string;
  poet_id: string;
  form: string;
  is_featured: boolean;
  is_poetry_of_the_day: boolean;
  popularity_score: number;
  featured_image_url: string;
  featured_image_alt: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  topic_ids: string[];
  tag_ids: string[];
  languages: {
    roman_urdu?: string;
    urdu?: string;
    hindi?: string;
    english?: string;
  };
}

export default function ManageShayariPage() {
  const [shayari, setShayari] = useState<any[]>([]);
  const [poets, setPoets] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ShayariFormData>({
    slug: '',
    poet_id: '',
    form: 'sher',
    is_featured: false,
    is_poetry_of_the_day: false,
    popularity_score: 0,
    featured_image_url: '',
    featured_image_alt: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    topic_ids: [],
    tag_ids: [],
    languages: {}
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [addingTopic, setAddingTopic] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loadLimit, setLoadLimit] = useState(100);
  const [loadLimitInput, setLoadLimitInput] = useState('100');
  const [loadProgress, setLoadProgress] = useState<{ loaded: number; requested: number } | null>(null);
  const [bulkLoaded, setBulkLoaded] = useState(false);

  useEffect(() => {
    loadShayari(1, '', 100);
    loadPoets();
    loadTopics();
    loadTags();
  }, []);

  const loadShayari = async (displayPage = 1, query = '', limit = loadLimit) => {
    try {
      setLoading(true);
      setError('');
      setLoadProgress(null);
      setBulkLoaded(false);
      const pageSize = Math.min(limit, FETCH_CHUNK);
      const result = await adminApi.searchShayari({ query, page: displayPage, pageSize });
      setShayari(result.data || []);
      setTotalRecords(result.total);
      setCurrentPage(displayPage);
    } catch (error: any) {
      console.error('Error loading shayari:', error);
      setError(error.message || 'Failed to load shayari');
    } finally {
      setLoading(false);
    }
  };

  const loadRequestedShayari = async (requestedTotal: number, query = '') => {
    setLoading(true);
    setError('');
    setSuccess('');
    setBulkLoaded(true);
    setCurrentPage(1);
    setLoadProgress({ loaded: 0, requested: requestedTotal });

    const rowsById = new Map<string, any>();
    let total = 0;
    let effectiveRequestedTotal = requestedTotal;
    const totalRequests = Math.ceil(requestedTotal / FETCH_CHUNK);

    try {
      for (let requestIndex = 0; requestIndex < totalRequests; requestIndex++) {
        const page = requestIndex + 1;
        const batchOffset = requestIndex * FETCH_CHUNK;
        const pageSize = Math.min(FETCH_CHUNK, requestedTotal - batchOffset);

        try {
          const result = await adminApi.searchShayari({
            query,
            page,
            pageSize,
            batchOffset,
            fresh: true
          });
          total = result.total;
          effectiveRequestedTotal = Math.min(requestedTotal, total);
          const batchRows = result.data || [];

          for (const row of batchRows) {
            if (row?.id !== undefined && row?.id !== null) rowsById.set(String(row.id), row);
          }
          setLoadProgress({ loaded: rowsById.size, requested: effectiveRequestedTotal });

          if (
            rowsById.size >= effectiveRequestedTotal ||
            batchRows.length < pageSize
          ) {
            break;
          }
        } catch (batchError: any) {
          throw new Error(`Failed to load page ${page}: ${batchError.message || 'Unknown error'}`);
        }
      }

      setShayari(Array.from(rowsById.values()).slice(0, effectiveRequestedTotal));
      setTotalRecords(total);
    } catch (error: any) {
      console.error('Error bulk loading shayari:', error);
      setShayari([]);
      setError(error.message || 'Failed to load shayari');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLimit = () => {
    const n = Math.max(1, parseInt(loadLimitInput) || 100);
    setLoadLimit(n);
    setLoadLimitInput(String(n));
    loadRequestedShayari(n, searchQuery);
  };

  const searchEntireDatabase = async () => {
    const query = searchQuery.trim();
    if (!query) {
      loadRequestedShayari(loadLimit, '');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setLoadProgress(null);
      setBulkLoaded(true);
      setCurrentPage(1);

      const result = await adminApi.searchShayari({
        query,
        searchAll: true,
        fresh: true
      });

      setShayari(result.data || []);
      setTotalRecords(result.total);
    } catch (searchError: any) {
      console.error('Error searching shayari:', searchError);
      setShayari([]);
      setTotalRecords(0);
      setError(searchError.message || 'Failed to search shayari');
    } finally {
      setLoading(false);
    }
  };

  const loadPoets = async () => {
    try {
      const data = await adminApi.get('/poets');
      setPoets(data);
    } catch (error) {
      console.error('Error loading poets:', error);
    }
  };

  const loadTopics = async () => {
    try {
      const data = await adminApi.get('/topics');
      console.log('LOADED TOPICS:', data.length, 'First topic ID type:', typeof data[0]?.id, 'Value:', data[0]?.id);
      setTopics(data);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const loadTags = async () => {
    try {
      const data = await adminApi.get('/tags/all');
      console.log('LOADED TAGS:', data.length, 'First tag ID type:', typeof data[0]?.id, 'Value:', data[0]?.id);
      setTags(data);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      slug: '',
      poet_id: '',
      form: 'sher',
      is_featured: false,
      is_poetry_of_the_day: false,
      popularity_score: 0,
      featured_image_url: '',
      featured_image_alt: '',
      seo_title: '',
      seo_description: '',
      seo_keywords: '',
      topic_ids: [],
      tag_ids: [],
      languages: {}
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setImagePrompt('');
    setGeneratingImage(false);
    setNewTopicName('');
    setNewTagName('');
    setDebugInfo('');
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

  const handleEdit = async (item: any) => {
    setEditingId(item.id);

    try {
      const data = await adminApi.get(`/shayari/${item.id}`);

      const languages: any = {};
      if (data.shayari_language_versions) {
        data.shayari_language_versions.forEach((v: any) => {
          languages[v.language] = v.text;
        });
      }

      // topic_ids and tag_ids are now returned directly from adminApi.get
      const topic_ids = data.topic_ids || [];
      const tag_ids = data.tag_ids || [];
      console.log('EDIT - Received topic_ids:', topic_ids, 'tag_ids:', tag_ids);

      setFormData({
        slug: data.slug || '',
        poet_id: data.poet_id || '',
        form: data.form || 'sher',
        is_featured: data.is_featured || false,
        is_poetry_of_the_day: data.is_poetry_of_the_day || false,
        popularity_score: data.popularity_score || 0,
        featured_image_url: data.featured_image_url || '',
        featured_image_alt: data.featured_image_alt || '',
        seo_title: data.seo_title || '',
        seo_description: data.seo_description || '',
        seo_keywords: data.seo_keywords || '',
        topic_ids,
        tag_ids,
        languages
      });
      setSelectedFile(null);
      setPreviewUrl(data.featured_image_url || '');
      setImagePrompt('');
      setGeneratingImage(false);
      setNewTopicName('');
      setNewTagName('');
      setDebugInfo(`Loaded: ${topic_ids.length} topics, ${tag_ids.length} tags`);
      setShowForm(true);
      setError('');
      setSuccess('');
    } catch (error: any) {
      console.error('Error loading shayari details:', error);
      setError(error.message || 'Failed to load shayari details');
    }
  };

  const handleGenerateImage = async () => {
    if (!editingId) {
      setError('Save the shayari first, then generate its image.');
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
      const result = await generateShayariImage(editingId, imagePrompt);
      setFormData((current) => ({
        ...current,
        featured_image_url: result.public_url
      }));
      setSelectedFile(null);
      setPreviewUrl(result.public_url);
      setSuccess(
        `Image generated and saved using ${result.model} (${result.quality}, ${result.image_format.toUpperCase()}, settings: ${result.settings_source}).`
      );
      setShayari((items) => items.map((item) => (
        item.id === editingId
          ? { ...item, featured_image_url: result.public_url }
          : item
      )));
    } catch (generationError: any) {
      setError(generationError.message || 'Failed to generate image.');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.poet_id) {
      setError('Poet is required');
      return;
    }

    // Filter out empty languages
    const nonEmptyLanguages: Record<string, string> = {};
    Object.entries(formData.languages).forEach(([key, value]) => {
      if (value && value.trim()) {
        nonEmptyLanguages[key] = value.trim();
      }
    });

    if (Object.keys(nonEmptyLanguages).length === 0) {
      setError('At least one language version is required');
      return;
    }

    setSubmitting(true);

    try {
      let shayariId = editingId;
      let featuredImageUrl = formData.featured_image_url;

      // Auto-generate slug if empty
      let slug = formData.slug?.trim() || '';
      if (!slug) {
        const poet = poets.find(p => p.id === formData.poet_id);
        const poetName = poet?.name || '';
        const textForSlug = nonEmptyLanguages.roman_urdu || nonEmptyLanguages.english || '';
        slug = generateShayariSlug(poetName, textForSlug);
      }

      const payload: any = {
        slug,
        poet_id: formData.poet_id,
        form: formData.form || 'sher',
        is_featured: formData.is_featured || false,
        is_poetry_of_the_day: formData.is_poetry_of_the_day || false,
        popularity_score: formData.popularity_score || 0,
        featured_image_url: featuredImageUrl || '',
        featured_image_alt: formData.featured_image_alt || '',
        seo_title: formData.seo_title?.trim() || null,
        seo_description: formData.seo_description?.trim() || null,
        seo_keywords: formData.seo_keywords?.trim() || null,
        topics: formData.topic_ids,
        tags: formData.tag_ids,
        languages: nonEmptyLanguages
      };

      console.log('SUBMIT DEBUG - formData.topic_ids:', formData.topic_ids);
      console.log('SUBMIT DEBUG - formData.tag_ids:', formData.tag_ids);
      console.log('SUBMIT DEBUG - payload.topics:', payload.topics);
      console.log('SUBMIT DEBUG - payload.tags:', payload.tags);
      setDebugInfo(`Submitting: ${formData.topic_ids.length} topics, ${formData.tag_ids.length} tags`);

      if (editingId) {
        if (selectedFile) {
          const uploadResult = await uploadImage(selectedFile, 'shayari', editingId);
          if (!uploadResult.success) {
            setError(uploadResult.error || 'Failed to upload image');
            setSubmitting(false);
            return;
          }
          featuredImageUrl = uploadResult.publicUrl || '';
          payload.featured_image_url = featuredImageUrl;
        }
        const result = await adminApi.put(`/shayari/${editingId}`, payload);
        const debugMsg = result._debug ? `Saved: ${result._debug.topicsInserted} topics, ${result._debug.tagsInserted} tags` : '';
        setDebugInfo(debugMsg);
        setSuccess('Shayari updated successfully');
      } else {
        const created = await adminApi.post('/shayari', payload);
        shayariId = created.id;
        const debugMsg = created._debug ? `Saved: ${created._debug.topicsInserted} topics, ${created._debug.tagsInserted} tags` : '';
        setDebugInfo(debugMsg);

        if (selectedFile && shayariId) {
          const uploadResult = await uploadImage(selectedFile, 'shayari', shayariId);
          if (uploadResult.success && uploadResult.publicUrl) {
            await adminApi.put(`/shayari/${shayariId}`, {
              featured_image_url: uploadResult.publicUrl
            });
          }
        }
        setSuccess('Shayari created successfully');
      }

      setShowForm(false);
      setSelectedFile(null);
      setPreviewUrl('');
      loadShayari(editingId ? currentPage : 1, searchQuery);
    } catch (error: any) {
      console.error('Admin save shayari error:', error);
      setError(error.message || 'Failed to save shayari');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shayari?')) {
      return;
    }

    try {
      await adminApi.delete(`/shayari/${id}`);
      setSuccess('Shayari deleted successfully');
      loadShayari(currentPage, searchQuery);
    } catch (error: any) {
      console.error('Error deleting shayari:', error);
      setError(error.message || 'Failed to delete shayari');
    }
  };

  const handleAddTopic = async () => {
    if (!newTopicName.trim()) return;

    setAddingTopic(true);
    try {
      const created = await adminApi.post('/topics', { name: newTopicName.trim() });
      setTopics([...topics, created]);
      setFormData({ ...formData, topic_ids: [...formData.topic_ids, created.id] });
      setNewTopicName('');
      setSuccess('Topic created and selected');
    } catch (error: any) {
      console.error('Error creating topic:', error);
      setError(error.message || 'Failed to create topic');
    } finally {
      setAddingTopic(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    setAddingTag(true);
    try {
      const created = await adminApi.post('/tags', { name: newTagName.trim() });
      setTags([...tags, created]);
      setFormData({ ...formData, tag_ids: [...formData.tag_ids, created.id] });
      setNewTagName('');
      setSuccess('Tag created and selected');
    } catch (error: any) {
      console.error('Error creating tag:', error);
      setError(error.message || 'Failed to create tag');
    } finally {
      setAddingTag(false);
    }
  };

  const toggleTopic = (topicId: string) => {
    setFormData(prev => {
      const newTopicIds = prev.topic_ids.includes(topicId)
        ? prev.topic_ids.filter(id => id !== topicId)
        : [...prev.topic_ids, topicId];
      console.log('TOGGLE TOPIC:', topicId, 'New array:', newTopicIds);
      return { ...prev, topic_ids: newTopicIds };
    });
  };

  const toggleTag = (tagId: string) => {
    setFormData(prev => {
      const newTagIds = prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId];
      console.log('TOGGLE TAG:', tagId, 'New array:', newTagIds);
      return { ...prev, tag_ids: newTagIds };
    });
  };

  const totalPages = Math.ceil(totalRecords / Math.min(loadLimit, FETCH_CHUNK));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Shayari</h1>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add New Shayari</span>
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

      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && searchEntireDatabase()}
            placeholder="Search by title or slug..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <button
          onClick={searchEntireDatabase}
          disabled={loading}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Search
        </button>
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); loadRequestedShayari(loadLimit, ''); }}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Load limit control */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm text-gray-600">Load records:</span>
        <input
          type="number"
          min="1"
          value={loadLimitInput}
          onChange={(e) => setLoadLimitInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApplyLimit()}
          className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
        />
        <button
          onClick={handleApplyLimit}
          disabled={loading}
          className="px-4 py-1.5 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors"
        >
          Load
        </button>
        <span className="text-xs text-gray-400">(enter any number, e.g. 500, 3500, 10000)</span>
      </div>

      {loadProgress && (
        <div className='mb-4 text-sm text-gray-600' role='status' aria-live='polite'>
          Loaded <strong>{loadProgress.loaded.toLocaleString()}</strong> of <strong>{loadProgress.requested.toLocaleString()}</strong>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingId ? 'Edit Shayari' : 'Add New Shayari'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {debugInfo && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Debug:</strong> {debugInfo}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Selected topic IDs: {formData.topic_ids.join(', ') || 'none'}
                  </p>
                  <p className="text-xs text-blue-600">
                    Selected tag IDs: {formData.tag_ids.join(', ') || 'none'}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poet *
                  </label>
                  <select
                    value={formData.poet_id}
                    onChange={(e) => setFormData({ ...formData, poet_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">Select a poet</option>
                    {poets.map((poet) => (
                      <option key={poet.id} value={poet.id}>
                        {poet.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Form *
                  </label>
                  <select
                    value={formData.form}
                    onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="sher">Sher</option>
                    <option value="ghazal">Ghazal</option>
                    <option value="nazm">Nazm</option>
                    <option value="qitta">Qitta</option>
                    <option value="quote">Quote</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topics (Categories)
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto mb-2">
                    {topics.length === 0 ? (
                      <p className="text-sm text-gray-500">No topics available</p>
                    ) : (
                      <div className="space-y-2">
                        {topics.map((topic) => (
                          <label key={topic.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={formData.topic_ids.includes(topic.id)}
                              onChange={() => toggleTopic(topic.id)}
                              className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                            />
                            <span className="text-sm text-gray-700">{topic.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      placeholder="Add new topic"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                    />
                    <button
                      type="button"
                      onClick={handleAddTopic}
                      disabled={addingTopic || !newTopicName.trim()}
                      className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                      {addingTopic ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                  {formData.topic_ids.length > 0 && (
                    <p className="mt-2 text-xs text-gray-600">
                      {formData.topic_ids.length} topic(s) selected
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto mb-2">
                    {tags.length === 0 ? (
                      <p className="text-sm text-gray-500">No tags available</p>
                    ) : (
                      <div className="space-y-2">
                        {tags.map((tag) => (
                          <label key={tag.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={formData.tag_ids.includes(tag.id)}
                              onChange={() => toggleTag(tag.id)}
                              className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                            />
                            <span className="text-sm text-gray-700">{tag.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Add new tag"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      disabled={addingTag || !newTagName.trim()}
                      className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                      {addingTag ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                  {formData.tag_ids.length > 0 && (
                    <p className="mt-2 text-xs text-gray-600">
                      {formData.tag_ids.length} tag(s) selected
                    </p>
                  )}
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
                    placeholder="auto-generated if empty"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to auto-generate from poet name and text
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_poetry_of_the_day"
                      checked={formData.is_poetry_of_the_day}
                      onChange={(e) => setFormData({ ...formData, is_poetry_of_the_day: e.target.checked })}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <label htmlFor="is_poetry_of_the_day" className="ml-2 text-sm text-gray-700">
                      Poetry of the Day
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Popularity Score
                  </label>
                  <input
                    type="number"
                    value={formData.popularity_score}
                    onChange={(e) => setFormData({ ...formData, popularity_score: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Featured Image
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
                        <Upload size={18} />
                        <span>Upload Image</span>
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
                          className="w-24 h-16 object-cover rounded border-2 border-gray-200"
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
                      value={formData.featured_image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, featured_image_url: e.target.value });
                        if (e.target.value) {
                          setPreviewUrl(e.target.value);
                          setSelectedFile(null);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      placeholder="https://example.com/image.jpg"
                    />
                    {editingId && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            AI Image Prompt
                          </label>
                          <textarea
                            value={imagePrompt}
                            onChange={(event) => setImagePrompt(event.target.value)}
                            rows={4}
                            maxLength={4000}
                            disabled={generatingImage}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                            placeholder="Describe the image to generate for this shayari..."
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-gray-500">
                            The generated image will be uploaded and saved to this shayari immediately.
                          </p>
                          <button
                            type="button"
                            onClick={handleGenerateImage}
                            disabled={generatingImage || !imagePrompt.trim()}
                            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Sparkles size={18} />
                            <span>{generatingImage ? 'Generating...' : 'Generate Image'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Featured Image Alt Text
                  </label>
                  <input
                    type="text"
                    value={formData.featured_image_alt}
                    onChange={(e) => setFormData({ ...formData, featured_image_alt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="Descriptive text for the image"
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Language Versions</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Roman Urdu
                      </label>
                      <textarea
                        value={formData.languages.roman_urdu || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          languages: { ...formData.languages, roman_urdu: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-serif"
                        rows={4}
                        placeholder="Enter shayari in Roman Urdu..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Urdu
                      </label>
                      <textarea
                        value={formData.languages.urdu || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          languages: { ...formData.languages, urdu: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-right"
                        rows={4}
                        dir="rtl"
                        placeholder="اردو میں شاعری درج کریں..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hindi
                      </label>
                      <textarea
                        value={formData.languages.hindi || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          languages: { ...formData.languages, hindi: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        rows={4}
                        placeholder="हिंदी में शायरी दर्ज करें..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        English
                      </label>
                      <textarea
                        value={formData.languages.english || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          languages: { ...formData.languages, english: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        rows={4}
                        placeholder="Enter shayari in English..."
                      />
                    </div>
                  </div>
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
              <span className="font-medium">
                {loadProgress
                  ? `Loading shayari... ${loadProgress.loaded.toLocaleString()} / ${loadProgress.requested.toLocaleString()}`
                  : 'Loading shayari...'}
              </span>
            </div>
          </div>
        )}

        <table className={`min-w-full divide-y divide-gray-200 transition-opacity ${loading ? 'opacity-40' : 'opacity-100'}`}>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Text
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Poet
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Form
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Featured Image
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shayari.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 line-clamp-2">
                    {item.seo_description || 'No text'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.poets?.name || 'Unknown'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    {item.form}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.featured_image_url ? (
                    <img
                      src={item.featured_image_url}
                      alt="Thumbnail"
                      className="w-16 h-12 object-cover rounded"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No image</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-amber-600 hover:text-amber-900 mr-4"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
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

      {/* Pagination */}
      {totalRecords > 0 && !bulkLoaded && (
        <div className="flex items-center justify-between px-4 py-3 mt-2 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600">
            Total: <strong>{totalRecords.toLocaleString()}</strong> &nbsp;&mdash;&nbsp;
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            {' '}({loadLimit} per page)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadShayari(currentPage - 1, searchQuery, loadLimit)}
              disabled={currentPage <= 1 || loading}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              &larr; Prev
            </button>
            <button
              onClick={() => loadShayari(currentPage + 1, searchQuery, loadLimit)}
              disabled={currentPage >= totalPages || loading}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}

      {!loading && shayari.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No shayari found
        </div>
      )}
    </div>
  );
}
