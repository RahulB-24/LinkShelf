import { User, Collection, Tag, Bookmark } from './types';

export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

// Toggle this to false to attempt real API connections
export const USE_MOCK_DATA = true;

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  SETTINGS: '/settings',
};

export const MOCK_USER: User = {
  id: '1',
  name: 'Dev User',
  email: 'dev@linkshelf.app',
  avatarUrl: 'https://picsum.photos/200',
};

export const MOCK_COLLECTIONS: Collection[] = [
  { id: '1', name: 'Development', slug: 'development', count: 12 },
  { id: '2', name: 'Design', slug: 'design', count: 8 },
  { id: '3', name: 'Reading List', slug: 'reading', count: 5 },
  { id: '4', name: 'Tools', slug: 'tools', count: 15 },
];

export const MOCK_TAGS: Tag[] = [
  { id: '1', name: 'react', count: 10 },
  { id: '2', name: 'typescript', count: 7 },
  { id: '3', name: 'ui/ux', count: 5 },
  { id: '4', name: 'backend', count: 3 },
  { id: '5', name: 'architecture', count: 2 },
];

export const MOCK_BOOKMARKS: Bookmark[] = [
  {
    id: '101',
    title: 'React Documentation',
    url: 'https://react.dev',
    description: 'The library for web and native user interfaces',
    tags: ['react', 'ui/ux'],
    collectionId: '1',
    visitCount: 42,
    createdAt: '2023-10-01T10:00:00Z',
  },
  {
    id: '102',
    title: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    description: 'Rapidly build modern websites without ever leaving your HTML.',
    tags: ['ui/ux', 'css'],
    collectionId: '2',
    visitCount: 128,
    createdAt: '2023-10-02T11:00:00Z',
  },
  {
    id: '103',
    title: 'TypeScript: The starting point for learning TypeScript',
    url: 'https://www.typescriptlang.org',
    description: 'Typed JavaScript at Any Scale.',
    tags: ['typescript', 'dev'],
    collectionId: '1',
    visitCount: 15,
    createdAt: '2023-10-05T14:30:00Z',
  },
  {
    id: '104',
    title: 'Framer Motion',
    url: 'https://www.framer.com/motion/',
    description: 'A production-ready motion library for React.',
    tags: ['react', 'animation'],
    collectionId: '2',
    visitCount: 8,
    createdAt: '2023-10-10T09:15:00Z',
  },
];