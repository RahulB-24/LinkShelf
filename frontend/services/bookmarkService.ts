import api from './api';
import { USE_MOCK_DATA, MOCK_BOOKMARKS, MOCK_COLLECTIONS, MOCK_TAGS } from '../constants';
import { Bookmark, Collection, Tag } from '../types';

// Helper to simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Transform backend snake_case to frontend camelCase
const transformBookmark = (b: any): Bookmark => ({
  id: String(b.id),
  title: b.title,
  url: b.url,
  description: b.description || '',
  notes: b.notes || '',
  collectionId: b.collection_id ? String(b.collection_id) : undefined,
  tags: b.tags || [],
  faviconUrl: b.favicon_url || '',
  createdAt: b.created_at,
  visitCount: b.visit_count || 0,
  lastVisited: b.last_visited_at
});

const transformCollection = (c: any): Collection => ({
  id: String(c.id),
  name: c.name,
  slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
  count: parseInt(c.count) || 0
});

const transformTag = (t: any): Tag => ({
  id: String(t.id),
  name: t.name,
  count: parseInt(t.count) || 0
});

export const getBookmarks = async (params?: { search?: string; collection?: string; tags?: string[] }): Promise<Bookmark[]> => {
  if (USE_MOCK_DATA) {
    await delay(600);
    return [...MOCK_BOOKMARKS];
  }
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.collection) queryParams.append('collection', params.collection);
  if (params?.tags) params.tags.forEach(t => queryParams.append('tags', t));

  const url = queryParams.toString() ? `/bookmarks?${queryParams}` : '/bookmarks';
  const response = await api.get(url);
  const bookmarks = response.data.bookmarks || response.data;
  return bookmarks.map(transformBookmark);
};

export const createBookmark = async (bookmark: Partial<Bookmark>): Promise<Bookmark> => {
  if (USE_MOCK_DATA) {
    await delay(800);
    const newBookmark = {
      id: Math.random().toString(36).substr(2, 9),
      visitCount: 0,
      createdAt: new Date().toISOString(),
      tags: bookmark.tags || [],
      ...bookmark,
    } as Bookmark;
    MOCK_BOOKMARKS.push(newBookmark);
    return newBookmark;
  }
  const response = await api.post('/bookmarks', {
    url: bookmark.url,
    title: bookmark.title,
    description: bookmark.description,
    notes: bookmark.notes,
    collectionId: bookmark.collectionId ? parseInt(bookmark.collectionId) : null,
    tags: bookmark.tags || [],
    faviconUrl: bookmark.faviconUrl
  });
  return transformBookmark(response.data);
};

export const updateBookmark = async (id: string, updates: Partial<Bookmark>): Promise<Bookmark> => {
  if (USE_MOCK_DATA) {
    await delay(600);
    const index = MOCK_BOOKMARKS.findIndex(b => b.id === id);
    if (index !== -1) {
      MOCK_BOOKMARKS[index] = { ...MOCK_BOOKMARKS[index], ...updates };
      return MOCK_BOOKMARKS[index];
    }
    throw new Error('Bookmark not found');
  }
  const response = await api.put(`/bookmarks/${id}`, {
    title: updates.title,
    description: updates.description,
    notes: updates.notes,
    collectionId: updates.collectionId ? parseInt(updates.collectionId) : null,
    tags: updates.tags || []
  });
  return transformBookmark(response.data);
};

export const deleteBookmark = async (id: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    await delay(400);
    const index = MOCK_BOOKMARKS.findIndex(b => b.id === id);
    if (index !== -1) {
      MOCK_BOOKMARKS.splice(index, 1);
    }
    return;
  }
  await api.delete(`/bookmarks/${id}`);
};

// Track a visit to a bookmark (increments visit_count)
export const trackVisit = async (id: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    const index = MOCK_BOOKMARKS.findIndex(b => b.id === id);
    if (index !== -1) {
      MOCK_BOOKMARKS[index].visitCount += 1;
    }
    return;
  }
  await api.post(`/bookmarks/${id}/visit`);
};

export const getCollections = async (): Promise<Collection[]> => {
  if (USE_MOCK_DATA) {
    await delay(300);
    return MOCK_COLLECTIONS;
  }
  const response = await api.get('/collections');
  return response.data.map(transformCollection);
};

export const createCollection = async (name: string): Promise<Collection> => {
  if (USE_MOCK_DATA) {
    await delay(500);
    const newCollection: Collection = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      count: 0
    };
    MOCK_COLLECTIONS.push(newCollection);
    return newCollection;
  }
  const response = await api.post('/collections', { name });
  return transformCollection(response.data);
};

export const updateCollection = async (id: string, name: string): Promise<Collection> => {
  if (USE_MOCK_DATA) {
    await delay(500);
    const index = MOCK_COLLECTIONS.findIndex(c => c.id === id);
    if (index !== -1) {
      MOCK_COLLECTIONS[index] = {
        ...MOCK_COLLECTIONS[index],
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-')
      };
      return MOCK_COLLECTIONS[index];
    }
    throw new Error('Collection not found');
  }
  const response = await api.put(`/collections/${id}`, { name });
  return transformCollection(response.data);
};

export const deleteCollection = async (id: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    await delay(500);
    const index = MOCK_COLLECTIONS.findIndex(c => c.id === id);
    if (index !== -1) {
      MOCK_COLLECTIONS.splice(index, 1);
    }
    return;
  }
  await api.delete(`/collections/${id}`);
};

export const getTags = async (): Promise<Tag[]> => {
  if (USE_MOCK_DATA) {
    await delay(300);
    return MOCK_TAGS;
  }
  const response = await api.get('/tags');
  return response.data.map(transformTag);
};

export const fetchUrlMetadata = async (url: string): Promise<{ title: string; description: string; favicon?: string }> => {
  if (USE_MOCK_DATA) {
    await delay(1500);
    let hostname = '';
    try {
      hostname = new URL(url).hostname;
    } catch {
      hostname = url;
    }

    return {
      title: `${hostname.charAt(0).toUpperCase() + hostname.slice(1)} - Official Site`,
      description: `This is an auto-generated description for ${url} fetched by the scraping service.`,
      favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
    };
  }

  const response = await api.post('/bookmarks/scrape', { url });
  return response.data;
};