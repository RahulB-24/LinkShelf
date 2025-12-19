import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Layers, Hash, Settings, Book, PlusCircle, MoreVertical, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Collection, Tag } from '../../types';

interface SidebarProps {
  isMobileOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  collections: Collection[];
  tags: Tag[];
  onCloseMobile: () => void;
  onCreateCollection: () => void;
  onEditCollection: (collection: Collection) => void;
  onDeleteCollection: (collection: Collection) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isMobileOpen,
  isCollapsed,
  onToggleCollapse,
  collections, 
  tags, 
  onCloseMobile, 
  onCreateCollection,
  onEditCollection,
  onDeleteCollection
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* 
        Sidebar Container 
      */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-40 lg:static
          bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0 w-64 pt-16 lg:pt-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-[4.5rem]' : 'lg:w-64'} 
          h-full flex flex-col
        `}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-6 scrollbar-thin">
          
          {/* Main Links */}
          <div className="space-y-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap group relative overflow-hidden ${
                  isActive
                    ? 'bg-accent-50 dark:bg-accent-600 text-accent-700 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
              title="All Bookmarks"
            >
              {/* Icon Container - Fixed Width to prevent moving */}
              <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                 <Layers className="w-5 h-5" />
              </div>
              
              <span 
                className={`transition-all duration-300 ease-in-out ml-3 whitespace-nowrap ${
                  isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                }`}
              >
                All Bookmarks
              </span>
            </NavLink>
          </div>

          {/* Collections */}
          <div>
            {/* Header Logic: 
                - Collapsed: Text width 0, Plus button centered.
                - Expanded: Text left, Plus button right.
            */}
            <div className={`flex items-center mb-2 h-6 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'}`}>
              <h3 
                className={`text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider overflow-hidden transition-all duration-300 whitespace-nowrap ${
                  isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                }`}
              >
                Collections
              </h3>
              
              <button 
                onClick={onCreateCollection}
                className="text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors rounded-full p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Create new collection"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {collections.map((collection) => (
                <div key={collection.id} className="group relative">
                  <NavLink
                    to={`/collection/${collection.slug}`}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap overflow-hidden ${
                        isActive
                           ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                           : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                      }`
                    }
                    title={collection.name}
                  >
                    {/* Icon Container - Fixed Width */}
                    <div className="flex items-center justify-center w-5 h-5 flex-shrink-0 mr-3">
                      <Book className="w-4 h-4 opacity-70" />
                    </div>
                    
                    {/* Text and Count Wrapper */}
                    <div className={`flex items-center flex-1 min-w-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 max-w-0 opacity-0' : 'w-auto max-w-[200px] opacity-100'}`}>
                       <span className="truncate flex-1">{collection.name}</span>
                       <span 
                          className="flex-shrink-0 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 py-0.5 px-2 rounded-full border border-gray-200 dark:border-gray-600 group-hover:bg-white dark:group-hover:bg-gray-600 w-8 text-center ml-2"
                        >
                          {collection.count > 99 ? '99+' : collection.count}
                        </span>
                    </div>
                  </NavLink>
                  
                  {/* 3 Dots Menu - Only visible when expanded and hovered */}
                  {!isCollapsed && (
                    <div className="absolute right-1 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className={`p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity ${activeMenuId === collection.id ? 'opacity-100' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === collection.id ? null : collection.id);
                        }}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      
                      {activeMenuId === collection.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 z-50">
                          <button 
                            onClick={(e) => {
                              e.preventDefault(); 
                              e.stopPropagation();
                              onEditCollection(collection);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
                          >
                            <Edit2 className="w-3 h-3 mr-2" />
                            Edit Name
                          </button>
                          <button 
                            onClick={(e) => {
                              e.preventDefault(); 
                              e.stopPropagation();
                              onDeleteCollection(collection);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
             <div className={`flex items-center mb-2 h-6 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}>
               <h3 className={`text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider overflow-hidden transition-all duration-300 whitespace-nowrap ${
                  isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                }`}>
                  Tags
                </h3>
               {isCollapsed && <span className="text-gray-400 dark:text-gray-600 text-xs">#</span>}
             </div>
            
            <div className={`flex flex-wrap gap-2 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}>
              {tags.map((tag) => (
                <NavLink
                  key={tag.id}
                  to={`/tag/${tag.name}`}
                  className={({ isActive }) =>
                    `inline-flex items-center rounded-full text-xs font-medium border transition-colors whitespace-nowrap overflow-hidden ${
                      isActive
                        ? 'bg-accent-50 dark:bg-accent-600 text-accent-700 dark:text-white border-accent-200 dark:border-accent-500'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-gray-200'
                    } ${isCollapsed ? 'w-8 h-8 justify-center p-0' : 'px-2.5 py-0.5'}`
                  }
                  title={tag.name}
                >
                  <Hash className={`w-3 h-3 opacity-70 flex-shrink-0 ${!isCollapsed ? 'mr-1' : ''}`} />
                  <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 max-w-0 opacity-0' : 'w-auto max-w-[100px] opacity-100'} truncate`}>
                    {tag.name}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
              }`
            }
            title="Settings"
          >
             {/* Icon Container - Fixed Width */}
             <div className="flex items-center justify-center w-5 h-5 flex-shrink-0 mr-3">
               <Settings className="w-5 h-5" />
             </div>
            
            <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 max-w-0 opacity-0' : 'w-auto max-w-[150px] opacity-100'}`}>
              Settings
            </span>
          </NavLink>
          
          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {/* Icon Container - Fixed Width */}
            <div className="flex items-center justify-center w-5 h-5 flex-shrink-0 mr-3">
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </div>
            
            <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 max-w-0 opacity-0' : 'w-auto max-w-[150px] opacity-100'}`}>
              Collapse
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;