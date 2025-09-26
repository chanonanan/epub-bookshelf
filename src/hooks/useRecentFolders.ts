import localforage from 'localforage';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

export interface RecentFolder {
  id: string;
  name: string;
  lastUpdate: string;
}

interface UseRecentFoldersResult {
  recentFolders: RecentFolder[];
  addRecentFolder: (folderId: string, name: string) => Promise<void>;
  currentFolder: RecentFolder | undefined;
}

export function useRecentFolders(): UseRecentFoldersResult {
  const location = useLocation();
  const [currentFolderId, setCurrentFolderId] = useState<string>();
  const [recentFolders, setRecentFolders] = useState<RecentFolder[]>([]);

  // Extract folderId from path
  useEffect(() => {
    // Match both /bookshelf/:folderId and /book/:folderId routes
    const match = location.pathname.match(/\/(bookshelf|book)\/([^\/]+)/);
    setCurrentFolderId(match ? match[2] : undefined);
  }, [location]);

  useEffect(() => {
    const loadRecentFolders = async () => {
      try {
        const folders =
          (await localforage.getItem<RecentFolder[]>('recentFolders')) || [];
        setRecentFolders(folders);
      } catch (error) {}
    };
    loadRecentFolders();
  }, [currentFolderId]); // Add currentFolderId to dependencies

  const addRecentFolder = async (folderId: string, name: string) => {
    const folders =
      (await localforage.getItem<RecentFolder[]>('recentFolders')) || [];
    const updatedFolders = [
      { id: folderId, name, lastUpdate: new Date().toISOString() },
      ...folders.filter((f) => f.id !== folderId).slice(0, 4), // Keep last 5 folders
    ];
    try {
      await localforage.setItem('recentFolders', updatedFolders);
      setRecentFolders(updatedFolders);
      console.log('Added/Updated folder:', updatedFolders);
    } catch (error) {}
  };

  const currentFolder = useMemo(() => {
    const folder = recentFolders.find((f) => f.id === currentFolderId);
    return folder;
  }, [recentFolders, currentFolderId]);

  return {
    recentFolders,
    currentFolder,

    addRecentFolder,
  };
}
