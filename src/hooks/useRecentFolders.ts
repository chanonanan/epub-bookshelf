import { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';

export interface RecentFolder {
  id: string;
  name: string;
  lastUpdate: string;
}

interface UseRecentFoldersResult {
  recentFolders: RecentFolder[];
  addRecentFolder: (folderId: string, name: string) => Promise<void>;
  removeRecentFolder: (folderId: string) => Promise<void>;
  currentFolder: RecentFolder | undefined;
}

export function useRecentFolders(currentFolderId?: string): UseRecentFoldersResult {
  const [recentFolders, setRecentFolders] = useState<RecentFolder[]>([]);

  useEffect(() => {
    const loadRecentFolders = async () => {
      try {
        const folders = await localforage.getItem<RecentFolder[]>('recentFolders') || [];
        setRecentFolders(folders);
      } catch (error) {
        console.error('Error loading recent folders:', error);
      }
    };
    loadRecentFolders();
  }, []);

  const addRecentFolder = useCallback(async (folderId: string, name: string) => {
    const updatedFolders = [
      { id: folderId, name, lastUpdate: new Date().toISOString() },
      ...recentFolders.filter(f => f.id !== folderId).slice(0, 4) // Keep last 5 folders
    ];
    try {
      await localforage.setItem('recentFolders', updatedFolders);
      setRecentFolders(updatedFolders);
    } catch (error) {
      console.error('Error saving recent folder:', error);
    }
  }, [recentFolders]);

  const removeRecentFolder = useCallback(async (folderId: string) => {
    const updatedFolders = recentFolders.filter(f => f.id !== folderId);
    try {
      await localforage.setItem('recentFolders', updatedFolders);
      setRecentFolders(updatedFolders);
    } catch (error) {
      console.error('Error removing recent folder:', error);
    }
  }, [recentFolders]);

  const currentFolder = recentFolders.find(f => f.id === currentFolderId);

  return {
    recentFolders,
    addRecentFolder,
    removeRecentFolder,
    currentFolder
  };
}