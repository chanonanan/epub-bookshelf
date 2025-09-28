import type { File, Folder } from '@/types/models';

export interface StorageProvider {
  getToken(): string | null;
  setToken(token: string | null, expires_at?: number): void;

  login(): Promise<boolean>;
  logout(): void;

  openPicker(): Promise<Folder | null>;
  listFolders(rootId?: string): Promise<any[]>;
  listFiles(folderId: string): Promise<File[]>;
  downloadFile(fileId: string): Promise<ArrayBuffer>;
  uploadFile(
    folderId: string,
    name: string,
    data: Blob | ArrayBuffer,
  ): Promise<void>;
}
