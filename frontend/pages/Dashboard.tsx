import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { getBookmarks, updateBookmark, deleteBookmark } from '../services/bookmarkService';
import { Bookmark, Collection } from '../types';
import BookmarkCard from '../components/bookmarks/BookmarkCard';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { ArrowUpDown, ExternalLink, Calendar, Tag as TagIcon, LayoutGrid, List, Book } from 'lucide-react';

type SortOption = 'date-desc' | 'date-asc' | 'alpha-asc' | 'alpha-desc' | 'tag';
type ViewMode = 'grid' | 'list';

const Dashboard: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Modal States
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Edit Form State
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    url: '',
    tags: '',
    collectionId: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Context from AppLayout for Collections
  const { collections } = useOutletContext<{ collections: Collection[] }>();

  // Fetch Data
  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const data = await getBookmarks();
      setBookmarks(data);
    } catch (error) {
      console.error('Failed to load bookmarks', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sorting Logic
  const sortedBookmarks = useMemo(() => {
    const sorted = [...bookmarks];
    switch (sortBy) {
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'alpha-asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'alpha-desc':
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case 'tag':
        return sorted.sort((a, b) => {
          const tagA = a.tags[0] || 'z';
          const tagB = b.tags[0] || 'z';
          return tagA.localeCompare(tagB);
        });
      default:
        return sorted;
    }
  }, [bookmarks, sortBy]);

  // Actions
  const handleViewDetail = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    setIsDetailModalOpen(true);
  };

  const handleEditClick = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    setEditForm({
      title: bookmark.title,
      description: bookmark.description || '',
      url: bookmark.url,
      tags: bookmark.tags.join(', '),
      collectionId: bookmark.collectionId || '',
      notes: bookmark.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    setIsDeleteModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedBookmark) return;
    setIsSaving(true);
    try {
      const updated = await updateBookmark(selectedBookmark.id, {
        title: editForm.title,
        description: editForm.description,
        tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        collectionId: editForm.collectionId,
        notes: editForm.notes
      });
      
      setBookmarks(prev => prev.map(b => b.id === updated.id ? updated : b));
      setIsEditModalOpen(false);
      
      // Update Detail Modal if open and same bookmark
      if (isDetailModalOpen && selectedBookmark.id === updated.id) {
        setSelectedBookmark(updated);
      }
    } catch (error) {
      console.error('Failed to update', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBookmark) return;
    setIsSaving(true);
    try {
      await deleteBookmark(selectedBookmark.id);
      setBookmarks(prev => prev.filter(b => b.id !== selectedBookmark.id));
      setIsDeleteModalOpen(false);
      setIsDetailModalOpen(false); // Close detail view if open
    } catch (error) {
      console.error('Failed to delete', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  // Renderers
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse border border-gray-200 dark:border-gray-700" />
          ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          All Bookmarks 
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">{bookmarks.length} items</span>
        </h2>
        
        <div className="flex items-center space-x-3">
          {/* View Toggles */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-md border border-gray-200 dark:border-gray-700 mr-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-accent-600 shadow-sm text-accent-600 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-accent-600 shadow-sm text-accent-600 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-9 pr-8 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent cursor-pointer"
            >
              <option value="date-desc">Date Added (Newest)</option>
              <option value="date-asc">Date Added (Oldest)</option>
              <option value="alpha-asc">Alphabetical (A-Z)</option>
              <option value="alpha-desc">Alphabetical (Z-A)</option>
              <option value="tag">Tag Name</option>
            </select>
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content */}
      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-200 dark:border-gray-700">
            <span className="text-2xl">🔖</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No bookmarks yet</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
            Start building your library by clicking the Add Link button.
          </p>
        </div>
      ) : (
        <motion.div 
          key={viewMode + sortBy} // Forces remount animation on view/sort change
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "flex flex-col space-y-3"
          }
        >
          <AnimatePresence mode="popLayout">
            {sortedBookmarks.map((bookmark) => (
              <motion.div 
                key={bookmark.id} 
                variants={itemVariants} 
                layout={false} // Explicitly disable layout animation to prevent morphing
                className={viewMode === 'list' ? 'w-full' : 'h-full'}
              >
                <BookmarkCard 
                  bookmark={bookmark} 
                  viewMode={viewMode}
                  onViewDetail={handleViewDetail}
                  onEdit={handleEditClick}
                  onAddToCollection={handleEditClick} 
                  onDelete={handleDeleteClick}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Detailed View Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Bookmark Details"
        footer={
          <div className="flex justify-between w-full">
            <Button variant="danger" onClick={() => {
              setIsDetailModalOpen(false);
              handleDeleteClick(selectedBookmark!);
            }}>
              Delete
            </Button>
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={() => {
                 setIsDetailModalOpen(false);
                 handleEditClick(selectedBookmark!);
              }}>
                Edit
              </Button>
              <Button onClick={() => window.open(selectedBookmark?.url, '_blank')} leftIcon={<ExternalLink className="w-4 h-4" />}>
                Open Website
              </Button>
            </div>
          </div>
        }
      >
        {selectedBookmark && (
          <div className="space-y-6">
             <div>
               <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{selectedBookmark.title}</h3>
               <a href={selectedBookmark.url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-600 dark:text-accent-400 hover:underline break-all block">
                 {selectedBookmark.url}
               </a>
             </div>
             
             {selectedBookmark.description && (
               <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                 <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selectedBookmark.description}</p>
               </div>
             )}

             {selectedBookmark.notes && (
               <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</h4>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{selectedBookmark.notes}</p>
               </div>
             )}

             <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  Added {new Date(selectedBookmark.createdAt).toLocaleDateString()}
                </div>
                {selectedBookmark.collectionId && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Book className="w-4 h-4 mr-2" />
                    {collections.find(c => c.id === selectedBookmark.collectionId)?.name || 'Unknown Collection'}
                  </div>
                )}
             </div>

             {selectedBookmark.tags.length > 0 && (
               <div>
                 <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tags</h4>
                 <div className="flex flex-wrap gap-2">
                   {selectedBookmark.tags.map(tag => (
                     <span key={tag} className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-600">
                       #{tag}
                     </span>
                   ))}
                 </div>
               </div>
             )}
          </div>
        )}
      </Modal>

      {/* Edit Bookmark Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Bookmark"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} isLoading={isSaving}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
             label="Title"
             value={editForm.title}
             onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          />
          <Input
             label="URL"
             value={editForm.url}
             onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
          />
          <div className="space-y-1">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
             <textarea
               className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-colors duration-200 min-h-[80px]"
               value={editForm.description}
               onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
             />
          </div>
          <div className="space-y-1">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Collection</label>
             <select
               className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-colors"
               value={editForm.collectionId}
               onChange={(e) => setEditForm({ ...editForm, collectionId: e.target.value })}
             >
               <option value="">Unorganized</option>
               {collections.map(c => (
                 <option key={c.id} value={c.id}>{c.name}</option>
               ))}
             </select>
          </div>
          <div className="space-y-1">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
             <textarea
               className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-colors duration-200 min-h-[60px]"
               value={editForm.notes}
               onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
               placeholder="Personal notes..."
             />
          </div>
          <Input
             label="Tags (comma separated)"
             value={editForm.tags}
             onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Bookmark"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} isLoading={isSaving}>Delete</Button>
          </>
        }
      >
        <div className="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete <strong>{selectedBookmark?.title}</strong>? This action cannot be undone.
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;