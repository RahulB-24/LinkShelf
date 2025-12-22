import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, MoreVertical, Edit2, Trash2, FolderPlus } from 'lucide-react';
import { Bookmark } from '../../types';
import { trackVisit } from '../../services/bookmarkService';

interface BookmarkCardProps {
  bookmark: Bookmark;
  viewMode?: 'grid' | 'list';
  onViewDetail: (bookmark: Bookmark) => void;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onAddToCollection: (bookmark: Bookmark) => void;
  onVisit?: (bookmark: Bookmark) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  viewMode = 'grid',
  onViewDetail,
  onEdit,
  onDelete,
  onAddToCollection,
  onVisit,
  isSelectMode = false,
  isSelected = false,
  onSelect
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Safe default for URL display
  let hostname = '';
  try {
    hostname = new URL(bookmark.url).hostname.replace('www.', '');
  } catch (e) {
    hostname = bookmark.url;
  }

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    setShowMenu(false);
    action();
  };

  const handleFaviconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackVisit(bookmark.id);
    onVisit?.(bookmark);
    window.open(bookmark.url, '_blank');
  };

  const isList = viewMode === 'list';

  const handleCardClick = () => {
    if (isSelectMode && onSelect) {
      onSelect(bookmark.id);
    } else {
      onViewDetail(bookmark);
    }
  };

  return (
    <div
      className={`group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
        hover:border-accent-300 dark:hover:border-accent-600 rounded-xl p-5 cursor-pointer shadow-sm 
        transition-all duration-200 ease-out transform hover:shadow-md hover:-translate-y-1
        ${isList
          ? 'flex items-center gap-4 hover:bg-accent-50/50 dark:hover:bg-accent-900/10 w-full'
          : 'h-full flex flex-col'
        }
        ${isSelected ? 'ring-2 ring-accent-500 border-accent-500 dark:border-accent-500' : ''}`}
      onClick={handleCardClick}
    >
      {/* Checkbox for Select Mode */}
      {isSelectMode && (
        <div className={`flex-shrink-0 ${isList ? 'mr-2' : 'absolute top-3 left-3'}`}>
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                ? 'bg-accent-500 border-accent-500 text-white'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
              }`}
          >
            {isSelected && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}
      {/* Icon Area - Clickable to open URL */}
      <div className={`flex-shrink-0 ${isList ? '' : 'mb-3 flex items-start justify-between'}`}>
        <button
          onClick={handleFaviconClick}
          className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-400 hover:bg-accent-50 dark:hover:bg-accent-900 hover:border-accent-300 dark:hover:border-accent-600 transition-colors"
          title="Open website"
        >
          {bookmark.faviconUrl ? (
            <img src={bookmark.faviconUrl} alt="" className="w-5 h-5" />
          ) : (
            <Globe className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className={`flex-grow min-w-0 ${isList ? 'flex items-center justify-between gap-6' : ''}`}>
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
            {bookmark.title}
          </h4>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate font-mono block mb-1">{hostname}</span>

          {/* Description shown in both views but truncated differently */}
          {bookmark.description && (
            <p className={`text-sm text-gray-600 dark:text-gray-400 leading-relaxed ${isList ? 'truncate max-w-xl' : 'line-clamp-2 mb-4 flex-grow'}`}>
              {bookmark.description}
            </p>
          )}
        </div>

        {/* Tags and Date Area */}
        <div className={`${isList ? 'flex items-center gap-6 flex-shrink-0' : 'flex items-center justify-between mt-auto pt-3 border-t border-gray-50 dark:border-gray-700'}`}>
          <div className="flex flex-wrap gap-2">
            {bookmark.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-600"
              >
                #{tag}
              </span>
            ))}
            {bookmark.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-400 rounded-full border border-gray-100 dark:border-gray-600">
                +{bookmark.tags.length - 3}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
            {bookmark.visitCount > 0 && (
              <span className="flex items-center gap-1" title="Times visited">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {bookmark.visitCount}
              </span>
            )}
            {new Date(bookmark.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Action Menu */}
      <div className={`${isList ? 'ml-2' : 'absolute right-5 top-5'}`} ref={menuRef}>
        <button
          className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1.5 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md shadow-lg py-1 z-20 origin-top-right">
            <button
              onClick={(e) => handleMenuAction(e, () => onEdit(bookmark))}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
            >
              <Edit2 className="w-3 h-3 mr-2" />
              Edit Bookmark
            </button>
            <button
              onClick={(e) => handleMenuAction(e, () => onAddToCollection(bookmark))}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
            >
              <FolderPlus className="w-3 h-3 mr-2" />
              Add to Collection
            </button>
            <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
            <button
              onClick={(e) => handleMenuAction(e, () => onDelete(bookmark))}
              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarkCard;