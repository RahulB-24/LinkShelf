import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { User, Download, Upload, FileJson, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { getBookmarks, createBookmark } from '../services/bookmarkService';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  // Export bookmarks to JSON file
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const bookmarks = await getBookmarks();

      // Create export data in a format similar to browser bookmarks
      const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        source: "LinkShelf",
        bookmarks: bookmarks.map(b => ({
          title: b.title,
          url: b.url,
          description: b.description,
          tags: b.tags,
          createdAt: b.createdAt,
          visitCount: b.visitCount
        }))
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linkshelf-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Import bookmarks from HTML or JSON file
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const text = await file.text();
      let bookmarksToImport: Array<{ title: string; url: string; description?: string; tags?: string[]; faviconUrl?: string }> = [];

      // Check if it's HTML (NETSCAPE-Bookmark-file format from browsers)
      if (text.includes('<!DOCTYPE NETSCAPE-Bookmark-file-1>') || text.includes('<DL>') || text.includes('<A HREF=')) {
        // Parse HTML bookmarks
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const links = doc.querySelectorAll('a');

        links.forEach((link) => {
          const url = link.getAttribute('href');
          const title = link.textContent?.trim();
          const favicon = link.getAttribute('icon'); // Extract favicon from ICON attribute
          if (url && url.startsWith('http')) {
            bookmarksToImport.push({
              title: title || url,
              url: url,
              faviconUrl: favicon || undefined
            });
          }
        });
      } else {
        // Try to parse as JSON
        const data = JSON.parse(text);

        // Handle LinkShelf format
        if (data.source === 'LinkShelf' && data.bookmarks) {
          bookmarksToImport = data.bookmarks;
        }
        // Handle Chrome/Firefox bookmark export format (nested JSON structure)
        else if (data.roots || data.children) {
          const extractBookmarks = (node: any): any[] => {
            let results: any[] = [];
            if (node.url) {
              results.push({ title: node.name || node.title, url: node.url });
            }
            if (node.children) {
              node.children.forEach((child: any) => {
                results = results.concat(extractBookmarks(child));
              });
            }
            if (node.roots) {
              Object.values(node.roots).forEach((root: any) => {
                results = results.concat(extractBookmarks(root));
              });
            }
            return results;
          };
          bookmarksToImport = extractBookmarks(data);
        }
        // Handle simple array format
        else if (Array.isArray(data)) {
          bookmarksToImport = data.filter(item => item.url);
        }
      }

      if (bookmarksToImport.length === 0) {
        throw new Error('No valid bookmarks found in file');
      }

      // Import each bookmark
      let imported = 0;
      let skipped = 0;

      for (const bookmark of bookmarksToImport) {
        try {
          await createBookmark({
            url: bookmark.url,
            title: bookmark.title || bookmark.url,
            description: bookmark.description || '',
            tags: bookmark.tags || [],
            faviconUrl: bookmark.faviconUrl
          });
          imported++;
        } catch (error: any) {
          // Skip duplicates
          if (error.response?.status === 409) {
            skipped++;
          }
        }
      }

      setImportStatus({
        type: 'success',
        message: `Imported ${imported} bookmarks${skipped > 0 ? `, ${skipped} duplicates skipped` : ''}`
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setImportStatus({
        type: 'error',
        message: error.message || 'Failed to import bookmarks'
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto space-y-8 pb-10"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <motion.div variants={itemVariants} className="border-b border-gray-200 dark:border-gray-800 pb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your account and data.</p>
      </motion.div>

      {/* Profile Section */}
      <motion.section variants={itemVariants} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <User className="w-5 h-5 text-accent-600 dark:text-accent-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Profile Information</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <Button variant="secondary" size="sm">Change Avatar</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Display Name" defaultValue={user?.name} />
            <Input label="Email Address" defaultValue={user?.email} disabled className="bg-gray-50 dark:bg-gray-800 dark:text-gray-400" />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-gray-800 mt-4">
            <Button variant="danger" onClick={logout}>Sign Out</Button>
            <Button>Save Changes</Button>
          </div>
        </div>
      </motion.section>

      {/* Data Management Section */}
      <motion.section variants={itemVariants} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <FileJson className="w-5 h-5 text-accent-600 dark:text-accent-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Data Management</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Export */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Export Bookmarks</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Download all your bookmarks as a JSON file</p>
            </div>
            <Button
              onClick={handleExport}
              isLoading={isExporting}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export JSON
            </Button>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Import */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Import Bookmarks</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Import from browser export (HTML) or LinkShelf JSON</p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.html,.htm"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                isLoading={isImporting}
                variant="secondary"
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Import File
              </Button>
            </div>
          </div>

          {/* Import Status */}
          {importStatus && (
            <div className={`flex items-center gap-2 p-3 rounded-md ${importStatus.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}>
              {importStatus.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">{importStatus.message}</span>
            </div>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
};

export default Settings;