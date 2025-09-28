import type { Cover, File, Folder, Settings, SyncRoot } from '@/types/models';
import Dexie, { type Table } from 'dexie';

export class BookshelfDB extends Dexie {
  syncRoots!: Table<SyncRoot, string>; // key = provider
  folders!: Table<Folder, [string, string]>; // [provider, id]
  files!: Table<File, [string, string]>; // [provider, id]
  covers!: Table<Cover, string>; // key = coverId (hash or fileId)
  settings!: Table<Settings, string>; // key = "global" or userId later

  constructor() {
    super('BookshelfDB');

    this.version(1).stores({
      syncRoots: 'provider',
      folders: '&id, provider, parentId, [provider+parentId]',
      files:
        '[provider+id], id, folderId, name, status, metadata, [provider+folderId]',
      covers: 'id, provider',
      settings: 'id',
    });
  }
}

export const db = new BookshelfDB();
