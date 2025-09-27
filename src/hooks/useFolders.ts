import { FolderUtil } from '@/lib/googleDrive';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

export interface RecentFolder {
  id: string;
  name: string;
  lastUpdate: string;
}

interface useFoldersResult {
  allFolders: DriveFolder[];
  currentFolder: DriveFolder | undefined;
}

export function useFolders(): useFoldersResult {
  const location = useLocation();
  const [currentFolderId, setCurrentFolderId] = useState<string>();
  const [allFolders, setAllFolders] = useState<DriveFolder[]>([]);

  // Extract folderId from path
  useEffect(() => {
    // Match both /bookshelf/:folderId and /book/:folderId routes
    const match = location.pathname.match(/\/(bookshelf|book)\/([^\/]+)/);
    setCurrentFolderId(match ? match[2] : undefined);
  }, [location]);

  useEffect(() => {
    const loadRecentFolders = async () => {
      try {
        const folders = await FolderUtil.getAllFolders();
        setAllFolders(folders);
      } catch (error) {}
    };
    loadRecentFolders();
  }, [currentFolderId]);

  const currentFolder = useMemo(() => {
    const folder = allFolders.find((f) => f.id === currentFolderId);
    return folder;
  }, [allFolders, currentFolderId]);

  return {
    allFolders,
    currentFolder,
  };
}
