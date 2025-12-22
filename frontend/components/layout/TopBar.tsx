import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, Menu, LogOut, User, Command, X, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';

interface TopBarProps {
  onMobileMenuClick: () => void;
  onAddClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMobileMenuClick, onAddClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Sync search value with URL params
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearchValue(urlSearch);
  }, [searchParams]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentUrlSearch = searchParams.get('search') || '';
      if (searchValue.trim() !== currentUrlSearch) {
        if (searchValue.trim()) {
          navigate(`/?search=${encodeURIComponent(searchValue.trim())}`, { replace: true });
        } else if (currentUrlSearch) {
          navigate('/', { replace: true });
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, navigate, searchParams]);

  // Robust click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const clearSearch = () => {
    setSearchValue('');
    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-200">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Mobile menu + Logo */}
        <div className="flex items-center gap-4 flex-shrink-0">

          {/* Mobile Menu Button */}
          <button
            onClick={onMobileMenuClick}
            className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* LOGO */}
          <Link to="/" className="flex items-center space-x-2 text-accent-600 dark:text-accent-500 hover:text-accent-700 dark:hover:text-accent-400 transition-colors">
            <Command className="w-6 h-6" />
            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white hidden sm:block">LinkShelf</span>
          </Link>
        </div>

        {/* Center: Search */}
        <div className="flex-1 flex justify-center px-4">
          <div className="relative max-w-md w-full hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="block w-full pl-10 pr-10 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500 sm:text-sm transition-colors shadow-sm"
              placeholder="Search title, description, tags..."
            />
            {searchValue && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Theme + Add + User Menu */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          <Button onClick={onAddClick} size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            <span className="hidden sm:inline">Add Link</span>
            <span className="sm:hidden">Add</span>
          </Button>

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 text-sm focus:outline-none"
            >
              <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-accent-200 dark:hover:ring-accent-900 transition-all">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                )}
              </div>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-900 ring-1 ring-black ring-opacity-5 border border-gray-200 dark:border-gray-800 z-50 origin-top-right animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                >
                  <div className="flex items-center">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;