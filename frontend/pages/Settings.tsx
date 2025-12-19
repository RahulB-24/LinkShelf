import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { User, Palette, Moon, Sun } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto space-y-8 pb-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="border-b border-gray-200 dark:border-gray-800 pb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your account and preferences.</p>
      </motion.div>

      {/* Profile Section */}
      <motion.section variants={itemVariants} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <User className="w-5 h-5 text-accent-600 dark:text-accent-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Profile Information</h2>
        </div>
        <div className="p-6 space-y-6">
           <div className="flex items-center space-x-4">
             <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
               {user?.avatarUrl && <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />}
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

      {/* Appearance Section */}
      <motion.section variants={itemVariants} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <Palette className="w-5 h-5 text-accent-600 dark:text-accent-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Appearance</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Theme Preference</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark mode.</p>
            </div>
            
            {/* Custom Toggle Switch */}
            <button
              onClick={toggleTheme}
              className={`
                relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2
                ${isDark ? 'bg-accent-600' : 'bg-gray-200'}
              `}
              aria-label="Toggle Dark Mode"
            >
              <span className="sr-only">Toggle Dark Mode</span>
              <span
                className={`
                  inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center
                  ${isDark ? 'translate-x-9' : 'translate-x-1'}
                `}
              >
                {isDark ? (
                  <Moon className="h-3.5 w-3.5 text-accent-600" />
                ) : (
                  <Sun className="h-3.5 w-3.5 text-orange-500" />
                )}
              </span>
            </button>

          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default Settings;