import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, ChevronUp, ChevronDown, X, Filter, Upload } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

interface CollectionItemsManagerProps {
  collectionId: string;
  collectionTitle: string;
  onClose: () => void;
}

export default function CollectionItemsManager({ collectionId, collectionTitle, onClose }: CollectionItemsManagerProps) {
  const [items, setItems] = useState<any[]>([]);
  const [poets, setPoets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [itemsPage, setItemsPage] = useState(1);
  const [itemsTotal, setItemsTotal] = useState(0);
  const itemsPageSize = 50;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkIdsModal, setShowBulkIdsModal] = useState(false);
  const [bulkIds, setBulkIds] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [formFilter, setFormFilter] = useState('all');
  const [poetFilter, setPoetFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const searchPageSize = 20;
  const [searchLoading, setSearchLoading] = useState(false);

  const [selectedShayari, setSelectedShayari] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAllOnPage, setSelectAllOnPage] = useState(false);

  useEffect(() => {
    loadItems();
    loadPoets();
  }, [collectionId, itemsPage]);

  useEffect(() => {
    if (showAddModal) {
      performSearch();
    }
  }, [showAddModal, searchQuery, formFilter, poetFilter, languageFilter, searchPage]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const result = await adminApi.getCollectionItems(collectionId, {
        page: itemsPage,
        pageSize: itemsPageSize
      });
      setItems(result.data || []);
      setItemsTotal(result.total || 0);
    } catch (error: any) {
      console.error('Error loading items:', error);
      setError(error.message || 'Failed to load collection items');
    } finally {
      setLoading(false);
    }
  };

  const loadPoets = async () => {
    try {
      const data = await adminApi.get<any[]>('/poets');
      setPoets(data || []);
    } catch (error: any) {
      console.error('Error loading poets:', error);
    }
  };

  const performSearch = async () => {
    try {
      setSearchLoading(true);
      const result = await adminApi.searchShayari({
        query: searchQuery,
        form: formFilter,
        poetId: poetFilter,
        language: languageFilter,
        page: searchPage,
        pageSize: searchPageSize
      });

      const existingShayariIds = new Set((await adminApi.getCollectionItems(collectionId)).data.map((item: any) => item.shayari?.id));
      const filtered = result.data.filter((s: any) => !existingShayariIds.has(s.id));

      setSearchResults(filtered);
      setSearchTotal(result.total || 0);
    } catch (error: any) {
      console.error('Error searching:', error);
      setError(error.message || 'Failed to search shayari');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddSelected = async () => {
    if (selectedShayari.size === 0) {
      setError('Please select at least one shayari');
      return;
    }

    try {
      setError('');
      const result = await adminApi.bulkAddCollectionItems(collectionId, Array.from(selectedShayari));
      setSuccess(`Added ${result.inserted} item(s) to collection${result.skipped > 0 ? ` (${result.skipped} skipped - already in collection)` : ''}`);
      setSelectedShayari(new Set());
      setShowAddModal(false);
      loadItems();
    } catch (error: any) {
      console.error('Error adding items:', error);
      setError(error.message || 'Failed to add items');
    }
  };

  const handleBulkAddByIds = async () => {
    const ids = bulkIds.split('\n').map(id => id.trim()).filter(id => id);

    if (ids.length === 0) {
      setError('Please enter at least one ID');
      return;
    }

    try {
      setError('');
      const result = await adminApi.bulkAddCollectionItems(collectionId, ids);
      setSuccess(`Added ${result.inserted} item(s) to collection${result.skipped > 0 ? ` (${result.skipped} skipped)` : ''}`);
      setBulkIds('');
      setShowBulkIdsModal(false);
      loadItems();
    } catch (error: any) {
      console.error('Error adding items:', error);
      setError(error.message || 'Failed to add items by IDs');
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedItems.size === 0) {
      setError('Please select at least one item to remove');
      return;
    }

    if (!confirm(`Remove ${selectedItems.size} item(s) from this collection?`)) return;

    try {
      setError('');
      await adminApi.bulkRemoveCollectionItems(Array.from(selectedItems));
      setSuccess(`Removed ${selectedItems.size} item(s) from collection`);
      setSelectedItems(new Set());
      loadItems();
    } catch (error: any) {
      console.error('Error removing items:', error);
      setError(error.message || 'Failed to remove items');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Remove this shayari from the collection?')) return;

    try {
      setError('');
      await adminApi.removeCollectionItem(itemId);
      setSuccess('Item removed from collection');
      loadItems();
    } catch (error: any) {
      console.error('Error removing item:', error);
      setError(error.message || 'Failed to remove item');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];

    const itemIds = newItems.map(item => item.id);

    try {
      await adminApi.reorderCollectionItems(collectionId, itemIds);
      setItems(newItems);
      setSuccess('Order updated');
    } catch (error: any) {
      console.error('Error reordering:', error);
      setError(error.message || 'Failed to reorder items');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === items.length - 1) return;

    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];

    const itemIds = newItems.map(item => item.id);

    try {
      await adminApi.reorderCollectionItems(collectionId, itemIds);
      setItems(newItems);
      setSuccess('Order updated');
    } catch (error: any) {
      console.error('Error reordering:', error);
      setError(error.message || 'Failed to reorder items');
    }
  };

  const toggleShayariSelection = (shayariId: string) => {
    const newSelection = new Set(selectedShayari);
    if (newSelection.has(shayariId)) {
      newSelection.delete(shayariId);
    } else {
      newSelection.add(shayariId);
    }
    setSelectedShayari(newSelection);
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleSelectAllOnPage = () => {
    if (selectAllOnPage) {
      searchResults.forEach(s => selectedShayari.delete(s.id));
      setSelectedShayari(new Set(selectedShayari));
      setSelectAllOnPage(false);
    } else {
      searchResults.forEach(s => selectedShayari.add(s.id));
      setSelectedShayari(new Set(selectedShayari));
      setSelectAllOnPage(true);
    }
  };

  const getShayariText = (shayari: any) => {
    const version = shayari?.shayari_language_versions?.[0];
    return version?.text || 'No text available';
  };

  const getPoetName = (shayari: any) => {
    return shayari?.poets?.name || 'Unknown Poet';
  };

  const itemsTotalPages = Math.ceil(itemsTotal / itemsPageSize);
  const searchTotalPages = Math.ceil(searchTotal / searchPageSize);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Manage Items: {collectionTitle}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <p className="text-sm text-gray-600">{itemsTotal} total item(s) in collection</p>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
            <button onClick={() => setError('')} className="float-right text-red-900 font-bold">×</button>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {success}
            <button onClick={() => setSuccess('')} className="float-right text-green-900 font-bold">×</button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Current Items (Page {itemsPage} of {itemsTotalPages})</h3>
            <div className="flex space-x-2">
              {selectedItems.size > 0 && (
                <button
                  onClick={handleRemoveSelected}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Trash2 size={18} />
                  <span>Remove Selected ({selectedItems.size})</span>
                </button>
              )}
              <button
                onClick={() => setShowBulkIdsModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload size={18} />
                <span>Add by IDs</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                <Plus size={18} />
                <span>Add Shayari</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items in this collection yet. Click "Add Shayari" to get started.
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {items.map((item, index) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className="mr-3 w-4 h-4 text-amber-600 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {getPoetName(item.shayari)} • {item.shayari?.form || 'sher'}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {getShayariText(item.shayari)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 text-gray-600 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ChevronUp size={20} />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === items.length - 1}
                        className="p-1 text-gray-600 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ChevronDown size={20} />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                        title="Remove from collection"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {itemsTotalPages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                  <button
                    onClick={() => setItemsPage(p => Math.max(1, p - 1))}
                    disabled={itemsPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {itemsPage} of {itemsTotalPages}
                  </span>
                  <button
                    onClick={() => setItemsPage(p => Math.min(itemsTotalPages, p + 1))}
                    disabled={itemsPage === itemsTotalPages}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Add Shayari to Collection</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSearchPage(1);
                      }}
                      placeholder="Search shayari by text or poet name..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <select
                      value={formFilter}
                      onChange={(e) => {
                        setFormFilter(e.target.value);
                        setSearchPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="all">All Forms</option>
                      <option value="sher">Sher</option>
                      <option value="ghazal">Ghazal</option>
                      <option value="nazm">Nazm</option>
                      <option value="qitta">Qitta</option>
                      <option value="quote">Quote</option>
                      <option value="rubai">Rubai</option>
                      <option value="other">Other</option>
                    </select>

                    <select
                      value={poetFilter}
                      onChange={(e) => {
                        setPoetFilter(e.target.value);
                        setSearchPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="all">All Poets</option>
                      {poets.map(poet => (
                        <option key={poet.id} value={poet.id}>{poet.name}</option>
                      ))}
                    </select>

                    <select
                      value={languageFilter}
                      onChange={(e) => {
                        setLanguageFilter(e.target.value);
                        setSearchPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="all">All Languages</option>
                      <option value="roman_urdu">Roman Urdu</option>
                      <option value="urdu">Urdu</option>
                      <option value="hindi">Hindi</option>
                      <option value="english">English</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectAllOnPage}
                          onChange={handleSelectAllOnPage}
                          className="w-4 h-4 text-amber-600 rounded"
                        />
                        <span>Select all on page</span>
                      </label>
                    </div>
                    <span>{selectedShayari.size} selected | {searchTotal} available</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {searchLoading ? (
                  <div className="text-center py-8 text-gray-500">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery || formFilter !== 'all' || poetFilter !== 'all' || languageFilter !== 'all'
                      ? 'No shayari found matching your search'
                      : 'All shayari have been added to this collection'}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-4">
                      {searchResults.map((shayari) => {
                        const isSelected = selectedShayari.has(shayari.id);
                        return (
                          <div
                            key={shayari.id}
                            onClick={() => toggleShayariSelection(shayari.id)}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-amber-600 bg-amber-50'
                                : 'border-gray-200 bg-white hover:border-amber-300'
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {getPoetName(shayari)} • {shayari.form}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {getShayariText(shayari)}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {searchTotalPages > 1 && (
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => setSearchPage(p => Math.max(1, p - 1))}
                          disabled={searchPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-600">
                          Page {searchPage} of {searchTotalPages}
                        </span>
                        <button
                          onClick={() => setSearchPage(p => Math.min(searchTotalPages, p + 1))}
                          disabled={searchPage === searchTotalPages}
                          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSelected}
                  disabled={selectedShayari.size === 0}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add {selectedShayari.size > 0 ? `(${selectedShayari.size})` : ''}
                </button>
              </div>
            </div>
          </div>
        )}

        {showBulkIdsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Add Shayari by IDs</h3>
                  <button onClick={() => setShowBulkIdsModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Enter shayari IDs, one per line. This is useful for bulk imports.
                </p>
                <textarea
                  value={bulkIds}
                  onChange={(e) => setBulkIds(e.target.value)}
                  placeholder="e.g.&#10;a1b2c3d4-e5f6-7890-abcd-ef1234567890&#10;b2c3d4e5-f6a7-8901-bcde-f12345678901&#10;..."
                  className="w-full h-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {bulkIds.split('\n').filter(id => id.trim()).length} ID(s) entered
                </p>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowBulkIdsModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAddByIds}
                    disabled={!bulkIds.trim()}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add IDs
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
