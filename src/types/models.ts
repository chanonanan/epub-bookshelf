export interface SyncRoot {
  provider: 'gdrive' | 'onedrive';
  rootFolderId: string;
  lastSyncedAt: number;
}

export interface Folder {
  id: string; // provider-specific folderId
  provider: 'gdrive' | 'onedrive';
  name: string;
  parentId?: string;
  cachedAt: number;
  lastModifiedAt: number;
  fileIds: string[];
}

export interface File {
  id: string; // provider-specific fileId
  provider: 'gdrive' | 'onedrive';
  folderId: string;
  name: string;
  mimeType: string;
  size: number;
  modifiedAt: number;

  metadata?: BookMetadata;
  coverId?: string;
  progress?: ReadingProgress;

  status: 'pending' | 'processing' | 'ready' | 'error';
  lockedBy?: string; // tabId if in-progress
}

export interface Cover {
  id: string; // same as fileId or hash
  provider: 'gdrive' | 'onedrive';
  blob: Blob; // compressed WebP
  width: number;
  height: number;
  cachedAt: number;
}

export interface Settings {
  id: string; // "global"
  viewMode: 'list' | 'card';
  theme: 'light' | 'dark';
  defaultGroupBy: 'series' | 'author' | 'tags' | 'none';
  lastOpenedFileId?: string;
}

export interface BookMetadata {
  title: string;
  author?: string[];
  series?: string;
  tags?: string[];
  language?: string;
  publisher?: string;
  description?: string;
}

export interface ReadingProgress {
  cfi: string; // EPUB CFI
  percent: number;
  lastReadAt: number;
}
