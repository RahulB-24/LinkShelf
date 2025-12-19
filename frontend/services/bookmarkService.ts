import api from './api';
import { USE_MOCK_DATA, MOCK_BOOKMARKS, MOCK_COLLECTIONS, MOCK_TAGS } from '../constants';
import { Bookmark, Collection, Tag } from '../types';

// Helper to simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getBookmarks = async (): Promise<Bookmark[]> => {
  if (USE_MOCK_DATA) {
    await delay(600);
    return [...MOCK_BOOKMARKS]; // Return copy to allow mutation in mock mode
  }
  const response = await api.get('/bookmarks');
  return response.data;
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
  const response = await api.post('/bookmarks', bookmark);
  return response.data;
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
  const response = await api.put(`/bookmarks/${id}`, updates);
  return response.data;
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

export const getCollections = async (): Promise<Collection[]> => {
  if (USE_MOCK_DATA) {
    await delay(300);
    return MOCK_COLLECTIONS;
  }
  const response = await api.get('/collections');
  return response.data;
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
  return response.data;
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
  return response.data;
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
  return response.data;
};

export const fetchUrlMetadata = async (url: string): Promise<{ title: string; description: string; faviconUrl?: string }> => {
  // Simulate backend scraping
  await delay(1500); // 1.5s delay to simulate network request
  
  if (USE_MOCK_DATA) {
    let hostname = '';
    try {
      hostname = new URL(url).hostname;
    } catch {
      hostname = url;
    }

    return {
      title: `${hostname.charAt(0).toUpperCase() + hostname.slice(1)} - Official Site`,
      description: `This is an auto-generated description for ${url} fetched by the scraping service. It provides a summary of the webpage content.`,
      faviconUrl: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
    };
  }
  
  const response = await api.post('/scrape', { url });
  return response.data;
};