import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Loader2 } from 'lucide-react';
import { Collection, Tag } from '../../types';
import {
  getCollections,
  getTags,
  createBookmark,
  createCollection,
  updateCollection,
  deleteCollection,
  fetchUrlMetadata
} from '../../services/bookmarkService';

const AppLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isDeleteCollectionModalOpen, setIsDeleteCollectionModalOpen] = useState(false);

  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkDesc, setNewLinkDesc] = useState('');
  const [newLinkTags, setNewLinkTags] = useState('');
  const [newLinkFavicon, setNewLinkFavicon] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

  // Collection Management State
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [isSavingCollection, setIsSavingCollection] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    fetchGlobalData();
  }, []);

  const fetchGlobalData = async () => {
    const [cols, tgs] = await Promise.all([getCollections(), getTags()]);
    setCollections(cols);
    setTags(tgs);
  };

  // --- Scraping Logic ---
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setNewLinkUrl(url);
  };

  // Debounced Effect for Scraping
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (newLinkUrl && newLinkUrl.includes('http')) {
        setIsFetchingMetadata(true);
        try {
          const metadata = await fetchUrlMetadata(newLinkUrl);

          if (!newLinkTitle && metadata.title) {
            setNewLinkTitle(metadata.title);
          }
          if (!newLinkDesc && metadata.description) {
            setNewLinkDesc(metadata.description);
          }
          if (metadata.favicon) {
            setNewLinkFavicon(metadata.favicon);
          }
        } catch (error) {
          console.error("Scraping failed", error);
        } finally {
          setIsFetchingMetadata(false);
        }
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(delayDebounceFn);
  }, [newLinkUrl, newLinkTitle, newLinkDesc]);


  // --- Link Actions ---
  const [addLinkError, setAddLinkError] = useState('');

  const handleAddLink = async () => {
    if (!newLinkUrl) return;
    setIsSavingLink(true);
    setAddLinkError('');
    try {
      await createBookmark({
        url: newLinkUrl,
        title: newLinkTitle || newLinkUrl,
        description: newLinkDesc,
        tags: newLinkTags.split(',').map(t => t.trim()).filter(Boolean),
        collectionId: selectedCollection,
        faviconUrl: newLinkFavicon
      });
      setIsAddModalOpen(false);
      resetLinkForm();
      window.location.reload();
    } catch (error: any) {
      // Handle duplicate URL error
      if (error.response?.status === 409) {
        const existing = error.response.data.existing;
        setAddLinkError(`This URL was already saved on ${new Date(existing.created_at).toLocaleDateString()}`);
      } else {
        setAddLinkError(error.response?.data?.error || 'Failed to save bookmark');
      }
    } finally {
      setIsSavingLink(false);
    }
  };

  const resetLinkForm = () => {
    setNewLinkUrl('');
    setNewLinkTitle('');
    setNewLinkDesc('');
    setNewLinkTags('');
    setNewLinkFavicon('');
    setSelectedCollection('');
  };

  // --- Collection Actions ---
  const handleSaveCollection = async () => {
    if (!newCollectionName) return;
    setIsSavingCollection(true);
    try {
      if (editingCollection) {
        // Update existing
        const updated = await updateCollection(editingCollection.id, newCollectionName);
        setCollections(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        // Create new
        const newCol = await createCollection(newCollectionName);
        setCollections(prev => [...prev, newCol]);
        if (isAddModalOpen) setSelectedCollection(newCol.id);
      }
      setIsCollectionModalOpen(false);
      resetCollectionForm();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingCollection(false);
    }
  };

  const handleDeleteCollectionConfirm = async () => {
    if (!editingCollection) return;
    setIsSavingCollection(true);
    try {
      await deleteCollection(editingCollection.id);
      setCollections(prev => prev.filter(c => c.id !== editingCollection.id));
      setIsDeleteCollectionModalOpen(false);
      setEditingCollection(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingCollection(false);
    }
  };

  const openCreateCollectionModal = () => {
    setEditingCollection(null);
    setNewCollectionName('');
    setIsCollectionModalOpen(true);
  };

  const openEditCollectionModal = (collection: Collection) => {
    setEditingCollection(collection);
    setNewCollectionName(collection.name);
    setIsCollectionModalOpen(true);
  };

  const openDeleteCollectionModal = (collection: Collection) => {
    setEditingCollection(collection);
    setIsDeleteCollectionModalOpen(true);
  };

  const resetCollectionForm = () => {
    setNewCollectionName('');
    setEditingCollection(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden font-sans transition-colors duration-200">

      {/* Top Bar - Full Width, Fixed Top */}
      <TopBar
        onMobileMenuClick={() => setMobileSidebarOpen(true)}
        onAddClick={() => setIsAddModalOpen(true)}
      />

      {/* Main Container below TopBar */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar - collapsible on desktop */}
        <Sidebar
          isMobileOpen={mobileSidebarOpen}
          isCollapsed={desktopSidebarCollapsed}
          onToggleCollapse={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          collections={collections}
          tags={tags}
          onCreateCollection={openCreateCollectionModal}
          onEditCollection={openEditCollectionModal}
          onDeleteCollection={openDeleteCollectionModal}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <Outlet context={{ collections, refreshCollections: fetchGlobalData }} />
        </main>
      </div>

      {/* Add Link Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Link"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLink} isLoading={isSavingLink}>
              Save Link
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Error Message */}
          {addLinkError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{addLinkError}</p>
            </div>
          )}

          <div className="relative">
            <Input
              label="URL"
              placeholder="https://example.com"
              value={newLinkUrl}
              onChange={handleUrlChange}
              autoFocus
            />
            {isFetchingMetadata && (
              <div className="absolute right-3 top-9 flex items-center text-xs text-accent-600">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Fetching details...
              </div>
            )}
          </div>

          <Input
            label="Title"
            placeholder="Page title"
            value={newLinkTitle}
            onChange={(e) => setNewLinkTitle(e.target.value)}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-colors duration-200 min-h-[80px]"
              placeholder="Optional description or notes..."
              value={newLinkDesc}
              onChange={(e) => setNewLinkDesc(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Collection</label>
            <div className="flex space-x-2">
              <select
                className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-colors"
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
              >
                <option value="">Unorganized</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Button
                type="button"
                variant="secondary"
                onClick={openCreateCollectionModal}
                title="Create new collection"
              >
                +
              </Button>
            </div>
          </div>

          <Input
            label="Tags"
            placeholder="dev, design, tutorial (comma separated)"
            value={newLinkTags}
            onChange={(e) => setNewLinkTags(e.target.value)}
          />
        </div>
      </Modal>

      {/* Create/Edit Collection Modal */}
      <Modal
        isOpen={isCollectionModalOpen}
        onClose={() => { setIsCollectionModalOpen(false); resetCollectionForm(); }}
        title={editingCollection ? "Edit Collection" : "Create Collection"}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setIsCollectionModalOpen(false); resetCollectionForm(); }}>Cancel</Button>
            <Button onClick={handleSaveCollection} isLoading={isSavingCollection}>
              {editingCollection ? "Save Changes" : "Create"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Collection Name"
            placeholder="e.g. Project Resources"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            autoFocus
          />
        </div>
      </Modal>

      {/* Delete Collection Modal */}
      <Modal
        isOpen={isDeleteCollectionModalOpen}
        onClose={() => { setIsDeleteCollectionModalOpen(false); setEditingCollection(null); }}
        title="Delete Collection"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDeleteCollectionModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteCollectionConfirm} isLoading={isSavingCollection}>Delete</Button>
          </>
        }
      >
        <div className="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete <strong>{editingCollection?.name}</strong>?
          Bookmarks inside this collection will NOT be deleted, but will become unorganized.
        </div>
      </Modal>
    </div>
  );
};

export default AppLayout;