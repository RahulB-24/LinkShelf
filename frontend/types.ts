export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface Tag {
  id: string;
  name: string;
  count: number;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  notes?: string;
  collectionId?: string;
  tags: string[]; // array of tag IDs or names
  faviconUrl?: string;
  createdAt: string;
  visitCount: number;
  lastVisited?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}