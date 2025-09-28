import type { Folder } from '@/types/models';
import type { StorageProvider } from './storageProvider';

export class OneDriveProvider implements StorageProvider {
  private accessToken: string | null = null;

  getToken(): string | null {
    return this.accessToken;
  }

  setToken(token: string | null, _expires_at?: number): void {
    this.accessToken = token;
  }

  async login(): Promise<boolean> {
    // Simplified: you would use MSAL.js here
    return new Promise((resolve, reject) => {
      // TODO: Replace with real MSAL integration
      const token = window.prompt('Enter OneDrive access token (mock)');
      if (token) {
        this.setToken(token);
        resolve(true);
      } else {
        reject(false);
      }
    });
  }

  logout(): void {
    this.accessToken = null;
  }

  async openPicker(): Promise<Folder | null> {
    return new Promise((resolve, reject) => {
      (window as any).OneDrive.open({
        clientId: 'YOUR_ONEDRIVE_APP_ID',
        action: 'query',
        multiSelect: true,
        advanced: {
          accessToken: this.accessToken,
          filter: 'folder', // restrict to folders
        },
        success: (files: any) => resolve(files.value),
        cancel: () => resolve(null),
        error: (e: any) => reject(e),
      });
    });
  }

  private headers() {
    return { Authorization: `Bearer ${this.accessToken}` };
  }

  async listFolders(rootId: string = 'root') {
    const url =
      rootId === 'root'
        ? 'https://graph.microsoft.com/v1.0/me/drive/root/children'
        : `https://graph.microsoft.com/v1.0/me/drive/items/${rootId}/children`;

    const res = await fetch(url, { headers: this.headers() });
    const data = await res.json();
    return data.value.filter((i: any) => i.folder);
  }

  async listFiles(folderId: string) {
    const url = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`;
    const res = await fetch(url, { headers: this.headers() });
    const data = await res.json();
    return data.value.filter(
      (i: any) => i.file?.mimeType === 'application/epub+zip',
    );
  }

  async downloadFile(fileId: string): Promise<ArrayBuffer> {
    const url = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;
    const res = await fetch(url, { headers: this.headers() });
    return await res.arrayBuffer();
  }

  async uploadFile(
    folderId: string,
    name: string,
    data: Blob | ArrayBuffer,
  ): Promise<void> {
    const url = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${name}:/content`;
    await fetch(url, {
      method: 'PUT',
      headers: this.headers(),
      body: data,
    });
  }
}
